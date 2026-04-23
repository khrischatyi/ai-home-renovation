from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.domain.payments.models import Payment
from app.domain.payments.repository import PaymentRepository
from app.domain.payments.schemas import (
    CheckoutSessionResponse,
    CreateCheckoutSession,
    CreatePaymentIntent,
    PaymentHistoryResponse,
    PaymentResponse,
    PaymentStatusResponse,
)
from app.domain.payments.stripe_client import StripeClient
from app.domain.projects.models import Project

logger = logging.getLogger(__name__)

# Pricing in cents per payment_type. "test_payment" is the $19.99 bucket used
# by the /project/new flow for end-to-end verification.
PRICING: dict[str, int] = {
    "test_payment": 1999,
    "design_session": 14900,
    "concierge_vetting": 24900,
    "concierge_full": 49900,
    "concierge_bundle": 59900,
}

PRODUCT_NAMES: dict[str, str] = {
    "test_payment": "Helpico test payment",
    "design_session": "AI Design Session",
    "concierge_vetting": "Concierge: Contractor Vetting",
    "concierge_full": "Concierge: Full Service",
    "concierge_bundle": "Concierge: Bundle",
}


def _require_pricing(payment_type: str) -> int:
    if payment_type not in PRICING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment type. Must be one of: {', '.join(PRICING.keys())}",
        )
    return PRICING[payment_type]


class PaymentService:
    def __init__(self, settings: Settings, stripe_client: StripeClient | None = None) -> None:
        self.settings = settings
        self.repo = PaymentRepository()
        self.stripe = stripe_client or StripeClient(settings)

    async def create_checkout_session(
        self,
        db: AsyncSession,
        data: CreateCheckoutSession,
        *,
        user_id: UUID | None = None,
    ) -> CheckoutSessionResponse:
        """Create a Stripe Embedded Checkout Session for a project payment."""
        amount_cents = _require_pricing(data.payment_type)

        project = await db.get(Project, data.project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        return_url = self.settings.STRIPE_SUCCESS_RETURN_URL.replace(
            "{PROJECT_ID}", str(project.id)
        )

        payment = await self.repo.create(
            db,
            user_id=user_id,
            session_id=project.session_id,
            project_id=project.id,
            amount_cents=amount_cents,
            currency="usd",
            payment_type=data.payment_type,
            status="pending",
        )

        try:
            checkout = self.stripe.create_checkout_session(
                amount_cents=amount_cents,
                currency="usd",
                return_url=return_url,
                metadata={
                    "payment_id": str(payment.id),
                    "project_id": str(project.id),
                    "payment_type": data.payment_type,
                },
                product_name=PRODUCT_NAMES.get(data.payment_type, data.payment_type),
            )
        except Exception as exc:
            logger.exception("stripe checkout session create failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Stripe error: {exc}",
            ) from exc

        await self.repo.update_status(
            db,
            payment.id,
            status="pending",
        )
        payment.stripe_checkout_session_id = checkout.id
        await db.flush()

        return CheckoutSessionResponse(
            payment_id=payment.id,
            checkout_session_id=checkout.id,
            client_secret=checkout.client_secret,
            publishable_key=self.settings.STRIPE_PUBLISHABLE_KEY,
            amount_cents=amount_cents,
            currency="usd",
        )

    async def get_status_by_checkout_session_id(
        self, db: AsyncSession, checkout_session_id: str
    ) -> PaymentStatusResponse:
        payment = await self.repo.get_by_stripe_session_id(db, checkout_session_id)
        if payment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )

        # Self-heal: if the DB row is still pending, check Stripe directly.
        # The webhook remains the authoritative path; this is a fallback for
        # the window between Stripe's redirect and the webhook arriving (and
        # covers local dev where `stripe listen` might not be running).
        if payment.status == "pending":
            try:
                session = self.stripe.retrieve_session(checkout_session_id)
            except Exception:
                logger.exception("stripe session retrieve failed")
                session = None

            if session is not None:
                s_status = getattr(session, "status", None)
                pay_status = getattr(session, "payment_status", None)
                intent_id = getattr(session, "payment_intent", None)
                if s_status == "complete" and pay_status == "paid":
                    payment = await self.repo.update_status(
                        db,
                        payment.id,
                        status="completed",
                        stripe_payment_intent_id=intent_id,
                    )
                elif s_status == "expired":
                    payment = await self.repo.update_status(
                        db,
                        payment.id,
                        status="failed",
                        failure_reason="checkout.session.expired",
                    )
                elif pay_status == "unpaid" and s_status == "complete":
                    # e.g. async payment failed mid-flow
                    payment = await self.repo.update_status(
                        db,
                        payment.id,
                        status="failed",
                        failure_reason="payment unpaid",
                    )

        return PaymentStatusResponse(
            payment_id=payment.id,
            project_id=payment.project_id,
            checkout_session_id=payment.stripe_checkout_session_id,
            status=payment.status,
            amount_cents=payment.amount_cents,
            currency=payment.currency,
            payment_type=payment.payment_type,
        )

    async def handle_webhook(
        self, db: AsyncSession, *, payload: bytes, sig_header: str
    ) -> dict:
        """Verify and dispatch a Stripe webhook event."""
        from stripe import SignatureVerificationError

        try:
            event = self.stripe.construct_webhook_event(
                payload=payload, sig_header=sig_header
            )
        except SignatureVerificationError as exc:
            logger.warning("stripe webhook signature verification failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature",
            ) from exc
        except ValueError as exc:
            logger.warning("stripe webhook payload invalid: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload"
            ) from exc

        event_type = event["type"]
        obj = event["data"]["object"]
        logger.info("stripe webhook received type=%s id=%s", event_type, event.get("id"))

        if event_type == "checkout.session.completed":
            await self._handle_session_completed(db, obj)
        elif event_type in (
            "checkout.session.async_payment_failed",
            "checkout.session.expired",
        ):
            await self._handle_session_failed(db, obj, reason=event_type)
        elif event_type == "payment_intent.payment_failed":
            await self._handle_payment_intent_failed(db, obj)
        else:
            logger.debug("stripe webhook type=%s ignored", event_type)

        return {"received": True, "type": event_type}

    # ── internal event handlers (idempotent) ───────────────────────────
    #
    # Stripe webhook payloads deserialize to StripeObject, which supports
    # attribute access (session.id) and dict-style (session["id"]) but NOT
    # dict.get(). Use getattr(...) to tolerate missing fields.

    async def _handle_session_completed(self, db: AsyncSession, session) -> None:
        checkout_session_id = getattr(session, "id", None)
        payment_intent_id = getattr(session, "payment_intent", None)
        payment_status = getattr(session, "payment_status", None)

        payment = await self.repo.get_by_stripe_session_id(db, checkout_session_id)
        if payment is None:
            logger.warning(
                "checkout.session.completed for unknown session %s", checkout_session_id
            )
            return

        # `checkout.session.completed` fires on success AND for delayed payment
        # methods that are still pending. Only mark completed when truly paid.
        if payment_status == "paid":
            if payment.status != "completed":
                await self.repo.update_status(
                    db,
                    payment.id,
                    status="completed",
                    stripe_payment_intent_id=payment_intent_id,
                )
        else:
            # still waiting on async payment method; record intent id if new
            if payment.stripe_payment_intent_id is None and payment_intent_id:
                await self.repo.update_status(
                    db, payment.id, status="pending",
                    stripe_payment_intent_id=payment_intent_id,
                )

    async def _handle_session_failed(
        self, db: AsyncSession, session, *, reason: str
    ) -> None:
        checkout_session_id = getattr(session, "id", None)
        payment = await self.repo.get_by_stripe_session_id(db, checkout_session_id)
        if payment is None:
            return
        if payment.status not in ("failed", "completed"):
            await self.repo.update_status(
                db,
                payment.id,
                status="failed",
                failure_reason=reason,
            )

    async def _handle_payment_intent_failed(
        self, db: AsyncSession, intent
    ) -> None:
        intent_id = getattr(intent, "id", None)
        last_err = getattr(intent, "last_payment_error", None)
        last_message = getattr(last_err, "message", None) if last_err else None
        failure_reason = last_message or "payment_intent.payment_failed"

        payment = await self.repo.get_by_stripe_intent_id(db, intent_id)
        if payment is None:
            # fallback: look up by metadata.payment_id if present
            meta = getattr(intent, "metadata", None)
            meta_pid = getattr(meta, "payment_id", None) if meta else None
            if meta_pid:
                payment = await self.repo.get_by_id(db, UUID(meta_pid))
        if payment is None:
            return
        if payment.status not in ("failed", "completed"):
            await self.repo.update_status(
                db,
                payment.id,
                status="failed",
                failure_reason=failure_reason,
                stripe_payment_intent_id=intent_id,
            )

    # ── legacy endpoints kept for existing API shape ────────────────────

    async def create_payment_intent(
        self,
        db: AsyncSession,
        user_id: UUID,
        data: CreatePaymentIntent,
    ) -> PaymentResponse:
        """Legacy endpoint: retained for `/payments/create-intent`.

        Real integrations should use `create_checkout_session` instead.
        """
        amount_cents = _require_pricing(data.payment_type)

        project = await db.get(Project, data.project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        import stripe

        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={
                "project_id": str(project.id),
                "payment_type": data.payment_type,
                "user_id": str(user_id),
            },
        )

        payment = await self.repo.create(
            db,
            user_id=user_id,
            session_id=project.session_id,
            project_id=project.id,
            stripe_payment_intent_id=intent.id,
            amount_cents=amount_cents,
            currency="usd",
            payment_type=data.payment_type,
            status="pending",
        )
        return PaymentResponse.model_validate(payment)

    async def get_payment_history(
        self, db: AsyncSession, user_id: UUID
    ) -> PaymentHistoryResponse:
        payments = await self.repo.get_user_payments(db, user_id)
        return PaymentHistoryResponse(
            payments=[PaymentResponse.model_validate(p) for p in payments]
        )

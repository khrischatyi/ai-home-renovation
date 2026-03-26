import uuid
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.domain.payments.repository import PaymentRepository
from app.domain.payments.schemas import (
    CreatePaymentIntent,
    PaymentHistoryResponse,
    PaymentResponse,
)

# Pricing in cents for each payment type
PRICING: dict[str, int] = {
    "design_session": 14900,       # $149
    "concierge_vetting": 24900,    # $249
    "concierge_full": 49900,       # $499
    "concierge_bundle": 59900,     # $599
}


class PaymentService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.repo = PaymentRepository()

    async def create_payment_intent(
        self,
        db: AsyncSession,
        user_id: UUID,
        data: CreatePaymentIntent,
    ) -> PaymentResponse:
        if data.payment_type not in PRICING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payment type. Must be one of: {', '.join(PRICING.keys())}",
            )

        amount_cents = PRICING[data.payment_type]

        # Mock Stripe payment intent creation.
        # In production, this would call stripe.PaymentIntent.create().
        mock_intent_id = f"pi_mock_{uuid.uuid4().hex[:24]}"

        payment = await self.repo.create(
            db,
            user_id=user_id,
            project_id=data.project_id,
            stripe_payment_intent_id=mock_intent_id,
            amount_cents=amount_cents,
            payment_type=data.payment_type,
            status="pending",
        )

        return PaymentResponse.model_validate(payment)

    async def handle_webhook(self, db: AsyncSession, payload: dict) -> PaymentResponse | None:
        """Handle a Stripe webhook event.

        In production this would verify the webhook signature and process the event.
        For now, we handle mock payment_intent.succeeded events.
        """
        event_type = payload.get("type")
        if event_type == "payment_intent.succeeded":
            intent_id = payload.get("data", {}).get("object", {}).get("id")
            if intent_id:
                # Find payment by stripe intent id and mark completed
                from sqlalchemy import select
                from app.domain.payments.models import Payment

                result = await db.execute(
                    select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
                )
                payment = result.scalar_one_or_none()
                if payment:
                    updated = await self.repo.update_status(db, payment.id, "completed")
                    if updated:
                        return PaymentResponse.model_validate(updated)
        return None

    async def get_payment_history(
        self, db: AsyncSession, user_id: UUID
    ) -> PaymentHistoryResponse:
        payments = await self.repo.get_user_payments(db, user_id)
        return PaymentHistoryResponse(
            payments=[PaymentResponse.model_validate(p) for p in payments]
        )

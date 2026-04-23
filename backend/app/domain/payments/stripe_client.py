"""Thin wrapper around the Stripe Python SDK.

Isolating SDK calls here keeps PaymentService free of network concerns and
trivially mockable in tests.
"""
from __future__ import annotations

import stripe
from stripe import SignatureVerificationError

from app.config import Settings


class StripeClient:
    def __init__(self, settings: Settings) -> None:
        if not settings.STRIPE_SECRET_KEY:
            raise RuntimeError("STRIPE_SECRET_KEY is not configured")
        self._settings = settings
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_checkout_session(
        self,
        *,
        amount_cents: int,
        currency: str,
        return_url: str,
        metadata: dict[str, str],
        product_name: str,
    ) -> stripe.checkout.Session:
        """Create an embedded-mode Checkout Session for a one-time payment.

        Uses `ui_mode="embedded_page"` (the current name; older `"embedded"`
        is rejected by recent API versions).
        """
        return stripe.checkout.Session.create(
            ui_mode="embedded_page",
            mode="payment",
            return_url=return_url,
            line_items=[
                {
                    "price_data": {
                        "currency": currency,
                        "unit_amount": amount_cents,
                        "product_data": {"name": product_name},
                    },
                    "quantity": 1,
                }
            ],
            metadata=metadata,
            payment_intent_data={"metadata": metadata},
        )

    def retrieve_session(self, session_id: str) -> stripe.checkout.Session:
        return stripe.checkout.Session.retrieve(session_id)

    def construct_webhook_event(
        self, *, payload: bytes, sig_header: str
    ) -> stripe.Event:
        """Verify signature and decode a webhook payload.

        Raises SignatureVerificationError on bad signature.
        """
        return stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=self._settings.STRIPE_WEBHOOK_SECRET,
        )


__all__ = ["StripeClient", "SignatureVerificationError"]

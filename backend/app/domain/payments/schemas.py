from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CreatePaymentIntent(BaseModel):
    project_id: UUID
    payment_type: str  # design_session, concierge_vetting, concierge_full, concierge_bundle


class CreateCheckoutSession(BaseModel):
    project_id: UUID
    payment_type: str = "test_payment"


class CheckoutSessionResponse(BaseModel):
    payment_id: UUID
    checkout_session_id: str
    client_secret: str
    publishable_key: str
    amount_cents: int
    currency: str


class PaymentStatusResponse(BaseModel):
    """Read-only status surfaced to the return page.

    `failure_reason` is intentionally NOT exposed — it can contain
    verbose or sensitive text from Stripe's error details. The backend
    keeps it in the DB for operator debugging; the UI renders a generic
    message.
    """
    model_config = ConfigDict(from_attributes=True)

    payment_id: UUID
    project_id: UUID
    checkout_session_id: str | None
    status: str  # pending | completed | failed
    amount_cents: int
    currency: str
    payment_type: str


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    project_id: UUID
    stripe_payment_intent_id: str | None
    stripe_checkout_session_id: str | None
    amount_cents: int
    currency: str
    payment_type: str
    status: str
    failure_reason: str | None
    created_at: datetime


class PaymentHistoryResponse(BaseModel):
    payments: list[PaymentResponse]

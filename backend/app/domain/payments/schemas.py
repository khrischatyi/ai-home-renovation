from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CreatePaymentIntent(BaseModel):
    project_id: UUID
    payment_type: str  # design_session, concierge_vetting, concierge_full, concierge_bundle


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    project_id: UUID
    stripe_payment_intent_id: str | None
    amount_cents: int
    payment_type: str
    status: str
    created_at: datetime


class PaymentHistoryResponse(BaseModel):
    payments: list[PaymentResponse]

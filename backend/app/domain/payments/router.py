from fastapi import APIRouter, Header, HTTPException, Request, status

from app.dependencies import CurrentUser, DbSession, OptionalUser, SettingsDep
from app.domain.payments.schemas import (
    CheckoutSessionResponse,
    CreateCheckoutSession,
    CreatePaymentIntent,
    PaymentHistoryResponse,
    PaymentResponse,
    PaymentStatusResponse,
)
from app.domain.payments.service import PaymentService
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/checkout-session",
    response_model=ApiResponse[CheckoutSessionResponse],
)
async def create_checkout_session(
    data: CreateCheckoutSession,
    db: DbSession,
    settings: SettingsDep,
    current_user: OptionalUser,
):
    """Create a Stripe Embedded Checkout Session for a project payment.

    Anonymous-safe: only requires that `project_id` refers to an existing
    project. Stripe itself enforces real payment authorization.
    """
    service = PaymentService(settings)
    result = await service.create_checkout_session(
        db,
        data,
        user_id=current_user.id if current_user else None,
    )
    return ApiResponse(data=result)


@router.get(
    "/session/{checkout_session_id}",
    response_model=ApiResponse[PaymentStatusResponse],
)
async def get_payment_status(
    checkout_session_id: str,
    db: DbSession,
    settings: SettingsDep,
):
    """Read-only status endpoint for the return page to poll."""
    service = PaymentService(settings)
    result = await service.get_status_by_checkout_session_id(db, checkout_session_id)
    return ApiResponse(data=result)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: DbSession,
    settings: SettingsDep,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
):
    """Stripe webhook endpoint with mandatory signature verification."""
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )
    payload = await request.body()
    service = PaymentService(settings)
    result = await service.handle_webhook(
        db, payload=payload, sig_header=stripe_signature
    )
    return result


@router.post("/create-intent", response_model=ApiResponse[PaymentResponse])
async def create_payment_intent(
    data: CreatePaymentIntent,
    db: DbSession,
    settings: SettingsDep,
    current_user: CurrentUser,
):
    """Legacy endpoint kept for existing callers (requires auth)."""
    service = PaymentService(settings)
    payment = await service.create_payment_intent(db, current_user.id, data)
    return ApiResponse(data=payment)


@router.get("/history", response_model=ApiResponse[PaymentHistoryResponse])
async def payment_history(db: DbSession, settings: SettingsDep, current_user: CurrentUser):
    service = PaymentService(settings)
    history = await service.get_payment_history(db, current_user.id)
    return ApiResponse(data=history)

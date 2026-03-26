from fastapi import APIRouter, Request

from app.dependencies import CurrentUser, DbSession, SettingsDep
from app.domain.payments.schemas import CreatePaymentIntent, PaymentHistoryResponse, PaymentResponse
from app.domain.payments.service import PaymentService
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-intent", response_model=ApiResponse[PaymentResponse])
async def create_payment_intent(
    data: CreatePaymentIntent,
    db: DbSession,
    settings: SettingsDep,
    current_user: CurrentUser,
):
    service = PaymentService(settings)
    payment = await service.create_payment_intent(db, current_user.id, data)
    return ApiResponse(data=payment)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: DbSession, settings: SettingsDep):
    payload = await request.json()
    service = PaymentService(settings)
    result = await service.handle_webhook(db, payload)
    return ApiResponse(data={"received": True})


@router.get("/history", response_model=ApiResponse[PaymentHistoryResponse])
async def payment_history(db: DbSession, settings: SettingsDep, current_user: CurrentUser):
    service = PaymentService(settings)
    history = await service.get_payment_history(db, current_user.id)
    return ApiResponse(data=history)

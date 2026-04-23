from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.payments.models import Payment


class PaymentRepository:
    async def create(self, db: AsyncSession, **kwargs) -> Payment:
        payment = Payment(**kwargs)
        db.add(payment)
        await db.flush()
        await db.refresh(payment)
        return payment

    async def get_by_id(self, db: AsyncSession, payment_id: UUID) -> Payment | None:
        result = await db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()

    async def get_by_stripe_session_id(
        self, db: AsyncSession, checkout_session_id: str
    ) -> Payment | None:
        result = await db.execute(
            select(Payment).where(
                Payment.stripe_checkout_session_id == checkout_session_id
            )
        )
        return result.scalar_one_or_none()

    async def get_by_stripe_intent_id(
        self, db: AsyncSession, payment_intent_id: str
    ) -> Payment | None:
        result = await db.execute(
            select(Payment).where(Payment.stripe_payment_intent_id == payment_intent_id)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        db: AsyncSession,
        payment_id: UUID,
        status: str,
        *,
        failure_reason: str | None = None,
        stripe_payment_intent_id: str | None = None,
    ) -> Payment | None:
        values: dict = {"status": status}
        if failure_reason is not None:
            values["failure_reason"] = failure_reason
        if stripe_payment_intent_id is not None:
            values["stripe_payment_intent_id"] = stripe_payment_intent_id
        await db.execute(update(Payment).where(Payment.id == payment_id).values(**values))
        await db.flush()
        return await self.get_by_id(db, payment_id)

    async def get_user_payments(self, db: AsyncSession, user_id: UUID) -> list[Payment]:
        result = await db.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
        )
        return list(result.scalars().all())

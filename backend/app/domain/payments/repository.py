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

    async def update_status(
        self, db: AsyncSession, payment_id: UUID, status: str
    ) -> Payment | None:
        await db.execute(
            update(Payment).where(Payment.id == payment_id).values(status=status)
        )
        await db.flush()
        return await self.get_by_id(db, payment_id)

    async def get_user_payments(self, db: AsyncSession, user_id: UUID) -> list[Payment]:
        result = await db.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
        )
        return list(result.scalars().all())

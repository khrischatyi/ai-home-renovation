from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.users.models import User


class UserRepository:
    async def get_by_id(self, db: AsyncSession, user_id: UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        email: str,
        hashed_password: str,
        full_name: str | None = None,
        password_set: bool = True,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            password_set=password_set,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def update(self, db: AsyncSession, user_id: UUID, **kwargs) -> User | None:
        await db.execute(
            update(User).where(User.id == user_id).values(**kwargs)
        )
        await db.flush()
        return await self.get_by_id(db, user_id)

    async def delete(self, db: AsyncSession, user_id: UUID) -> bool:
        result = await db.execute(delete(User).where(User.id == user_id))
        await db.flush()
        return result.rowcount > 0

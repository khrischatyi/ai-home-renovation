from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.domain.users.models import User
from app.domain.users.repository import UserRepository
from app.domain.users.schemas import UserCreate, UserResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.repo = UserRepository()

    def _hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, user_id: UUID) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {"sub": str(user_id), "exp": expire, "type": "access"}
        return jwt.encode(payload, self.settings.SECRET_KEY, algorithm=self.settings.ALGORITHM)

    def create_refresh_token(self, user_id: UUID) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
        return jwt.encode(payload, self.settings.SECRET_KEY, algorithm=self.settings.ALGORITHM)

    async def register(self, db: AsyncSession, data: UserCreate) -> User:
        existing = await self.repo.get_by_email(db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        hashed = self._hash_password(data.password)
        return await self.repo.create(db, email=data.email, hashed_password=hashed, full_name=data.full_name)

    async def authenticate(self, db: AsyncSession, email: str, password: str) -> tuple[User, str, str]:
        user = await self.repo.get_by_email(db, email)
        if user is None or not self._verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )
        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token(user.id)
        return user, access_token, refresh_token

    async def refresh_token(self, db: AsyncSession, refresh_token_value: str) -> tuple[User, str, str]:
        from jose import JWTError

        try:
            payload = jwt.decode(
                refresh_token_value,
                self.settings.SECRET_KEY,
                algorithms=[self.settings.ALGORITHM],
            )
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        user = await self.repo.get_by_id(db, UUID(user_id))
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        new_access = self.create_access_token(user.id)
        new_refresh = self.create_refresh_token(user.id)
        return user, new_access, new_refresh

    async def get_current_user(self, db: AsyncSession, user_id: UUID) -> UserResponse:
        user = await self.repo.get_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return UserResponse.model_validate(user)

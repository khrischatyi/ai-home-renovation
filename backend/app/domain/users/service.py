import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.domain.users.models import User
from app.domain.users.repository import UserRepository
from app.domain.users.schemas import UserCreate, UserResponse

logger = logging.getLogger(__name__)

# Fixed dev-mode reset code. Replace with an SES-delivered token when the
# real email provider lands.
DEV_RESET_CODE = "0000"

# bcrypt hard-limits the input to 72 bytes. Truncate ahead of time so the
# library never raises on our behalf.
_BCRYPT_MAX_BYTES = 72


def _to_bcrypt_bytes(password: str) -> bytes:
    encoded = password.encode("utf-8")
    return encoded[:_BCRYPT_MAX_BYTES]


class UserService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.repo = UserRepository()

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(_to_bcrypt_bytes(password), bcrypt.gensalt()).decode("utf-8")

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(
                _to_bcrypt_bytes(plain_password),
                hashed_password.encode("utf-8"),
            )
        except ValueError:
            return False

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
        return await self.repo.create(
            db,
            email=data.email,
            hashed_password=hashed,
            full_name=data.full_name,
            password_set=True,
        )

    async def ensure_from_intake(
        self, db: AsyncSession, email: str, full_name: str | None
    ) -> tuple[User, str, str]:
        """Create an account from intake info or reject if email already exists.

        Returns (user, access_token, refresh_token). Caller is responsible
        for setting cookies.

        If the email is already registered, raises HTTP 409 with a
        `needs_password` marker so the frontend can prompt for sign-in.
        """
        import secrets

        existing = await self.repo.get_by_email(db, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="needs_password",
            )

        # Throwaway password — user will set their own post-payment.
        throwaway = secrets.token_urlsafe(32)
        hashed = self._hash_password(throwaway)
        user = await self.repo.create(
            db,
            email=email,
            hashed_password=hashed,
            full_name=full_name,
            password_set=False,
        )
        access = self.create_access_token(user.id)
        refresh = self.create_refresh_token(user.id)
        return user, access, refresh

    async def claim_password(
        self, db: AsyncSession, user_id: UUID, new_password: str
    ) -> User:
        """Set a real password on an auto-created account."""
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters",
            )
        hashed = self._hash_password(new_password)
        updated = await self.repo.update(
            db, user_id, hashed_password=hashed, password_set=True
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return updated

    async def email_exists(self, db: AsyncSession, email: str) -> bool:
        return (await self.repo.get_by_email(db, email)) is not None

    async def request_password_reset(self, db: AsyncSession, email: str) -> None:
        """Kick off a password reset.

        Dev behavior: no email goes out; the fixed code `0000` always works.
        Prod behavior (future): mint a single-use token and hand it to Amazon
        SES. We intentionally return 200 even if the email isn't registered
        so we don't leak account existence.
        """
        user = await self.repo.get_by_email(db, email)
        if user is None:
            logger.info(
                "password-reset requested for unknown email %s (silent success)",
                email,
            )
            return
        logger.info(
            "password-reset requested for %s — dev code '%s' will work",
            email,
            DEV_RESET_CODE,
        )

    async def reset_password_with_code(
        self,
        db: AsyncSession,
        email: str,
        code: str,
        new_password: str,
    ) -> tuple[User, str, str]:
        """Validate the reset code and set a new password.

        Returns (user, access_token, refresh_token) so the caller can log
        the user straight in.
        """
        if code != DEV_RESET_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset code",
            )
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters",
            )
        user = await self.repo.get_by_email(db, email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account for that email",
            )

        hashed = self._hash_password(new_password)
        updated = await self.repo.update(
            db, user.id, hashed_password=hashed, password_set=True
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not reset password",
            )
        access = self.create_access_token(updated.id)
        refresh = self.create_refresh_token(updated.id)
        return updated, access, refresh

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

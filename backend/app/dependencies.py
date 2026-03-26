from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db


@lru_cache
def get_settings() -> Settings:
    return Settings()


DbSession = Annotated[AsyncSession, Depends(get_db)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


async def get_current_user(
    db: DbSession,
    settings: SettingsDep,
    access_token: str | None = Cookie(default=None),
) -> "UserResponse":
    from jose import JWTError, jwt

    from app.domain.users.repository import UserRepository
    from app.domain.users.schemas import UserResponse

    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    repo = UserRepository()
    user = await repo.get_by_id(db, UUID(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return UserResponse.model_validate(user)


async def get_current_user_optional(
    db: DbSession,
    settings: SettingsDep,
    access_token: str | None = Cookie(default=None),
) -> "UserResponse | None":
    if access_token is None:
        return None
    try:
        return await get_current_user(db, settings, access_token)
    except HTTPException:
        return None


from app.domain.users.schemas import UserResponse  # noqa: E402

CurrentUser = Annotated[UserResponse, Depends(get_current_user)]
OptionalUser = Annotated[UserResponse | None, Depends(get_current_user_optional)]

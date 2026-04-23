from fastapi import APIRouter, Cookie, Response

from app.config import Settings
from app.dependencies import CurrentUser, DbSession, SettingsDep
from app.domain.users.schemas import (
    CheckEmailRequest,
    CheckEmailResponse,
    ClaimPasswordRequest,
    EnsureFromIntakeRequest,
    RequestPasswordResetRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.domain.users.service import UserService
from app.schemas.response import ApiResponse

router = APIRouter()


def _cookie_secure(settings: Settings) -> bool:
    """Only mark cookies Secure off-HTTPS.

    On plain HTTP (local dev at http://127.0.0.1) browsers drop Secure
    cookies silently, which manifests as "registration succeeds but the
    user stays logged out". In DEBUG mode we disable Secure so cookies
    stick. Production (DEBUG=false) runs behind Caddy with HTTPS.
    """
    return not settings.DEBUG


def _set_auth_cookies(
    response: Response, access_token: str, refresh_token: str, settings: Settings
) -> None:
    secure = _cookie_secure(settings)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


def _clear_auth_cookies(response: Response, settings: Settings) -> None:
    secure = _cookie_secure(settings)
    response.delete_cookie(
        "access_token", httponly=True, secure=secure, samesite="lax", path="/"
    )
    response.delete_cookie(
        "refresh_token", httponly=True, secure=secure, samesite="lax", path="/"
    )


@router.post("/auth/register", response_model=ApiResponse[UserResponse])
async def register(data: UserCreate, db: DbSession, settings: SettingsDep, response: Response):
    service = UserService(settings)
    user = await service.register(db, data)
    access_token = service.create_access_token(user.id)
    refresh_token = service.create_refresh_token(user.id)
    _set_auth_cookies(response, access_token, refresh_token, settings)
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("/auth/login", response_model=ApiResponse[TokenResponse])
async def login(data: UserLogin, db: DbSession, settings: SettingsDep, response: Response):
    service = UserService(settings)
    user, access_token, refresh_token = await service.authenticate(db, data.email, data.password)
    _set_auth_cookies(response, access_token, refresh_token, settings)
    return ApiResponse(data=TokenResponse(access_token=access_token))


@router.post("/auth/check-email", response_model=ApiResponse[CheckEmailResponse])
async def check_email(data: CheckEmailRequest, db: DbSession, settings: SettingsDep):
    """Quick lookup used by the intake flow before creating an account."""
    service = UserService(settings)
    exists = await service.email_exists(db, data.email)
    return ApiResponse(data=CheckEmailResponse(exists=exists))


@router.post("/auth/ensure-from-intake", response_model=ApiResponse[UserResponse])
async def ensure_from_intake(
    data: EnsureFromIntakeRequest,
    db: DbSession,
    settings: SettingsDep,
    response: Response,
):
    """Create an account from intake info and sign the user in.

    Returns 409 with `detail="needs_password"` if the email already has an
    account — the frontend then prompts for sign-in.
    """
    service = UserService(settings)
    user, access, refresh = await service.ensure_from_intake(db, data.email, data.full_name)
    _set_auth_cookies(response, access, refresh, settings)
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("/auth/claim-password", response_model=ApiResponse[UserResponse])
async def claim_password(
    data: ClaimPasswordRequest,
    db: DbSession,
    settings: SettingsDep,
    current_user: CurrentUser,
):
    """Set a real password on an auto-created account (post-payment)."""
    service = UserService(settings)
    user = await service.claim_password(db, current_user.id, data.password)
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("/auth/request-password-reset")
async def request_password_reset(
    data: RequestPasswordResetRequest, db: DbSession, settings: SettingsDep
):
    """Kick off a password reset.

    In dev this just logs the fixed code (`0000`). In prod it would mint
    a token and send via SES. Always returns 200 so we don't leak whether
    the email is registered.
    """
    service = UserService(settings)
    await service.request_password_reset(db, data.email)
    return ApiResponse(data={"sent": True})


@router.post("/auth/reset-password", response_model=ApiResponse[UserResponse])
async def reset_password(
    data: ResetPasswordRequest,
    db: DbSession,
    settings: SettingsDep,
    response: Response,
):
    """Validate the reset code, set the new password, sign the user in."""
    service = UserService(settings)
    user, access, refresh = await service.reset_password_with_code(
        db, data.email, data.code, data.new_password
    )
    _set_auth_cookies(response, access, refresh, settings)
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("/auth/refresh", response_model=ApiResponse[TokenResponse])
async def refresh(
    db: DbSession,
    settings: SettingsDep,
    response: Response,
    refresh_token: str | None = Cookie(default=None),
):
    if refresh_token is None:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    service = UserService(settings)
    user, new_access, new_refresh = await service.refresh_token(db, refresh_token)
    _set_auth_cookies(response, new_access, new_refresh, settings)
    return ApiResponse(data=TokenResponse(access_token=new_access))


@router.post("/auth/logout")
async def logout(response: Response, settings: SettingsDep):
    _clear_auth_cookies(response, settings)
    return ApiResponse(data={"message": "Logged out"})


@router.get("/users/me", response_model=ApiResponse[UserResponse])
async def get_me(current_user: CurrentUser):
    return ApiResponse(data=current_user)


@router.patch("/users/me", response_model=ApiResponse[UserResponse])
async def update_me(data: UserUpdate, current_user: CurrentUser, db: DbSession, settings: SettingsDep):
    from app.domain.users.repository import UserRepository

    repo = UserRepository()
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        user = await repo.update(db, current_user.id, **update_data)
        return ApiResponse(data=UserResponse.model_validate(user))
    return ApiResponse(data=current_user)


@router.delete("/users/me")
async def delete_me(
    current_user: CurrentUser,
    db: DbSession,
    settings: SettingsDep,
    response: Response,
):
    from app.domain.users.repository import UserRepository

    repo = UserRepository()
    await repo.delete(db, current_user.id)
    _clear_auth_cookies(response, settings)
    return ApiResponse(data={"message": "Account deleted"})

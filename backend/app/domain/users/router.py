from fastapi import APIRouter, Cookie, Response

from app.dependencies import CurrentUser, DbSession, SettingsDep
from app.domain.users.schemas import UserCreate, UserLogin, UserResponse, UserUpdate, TokenResponse
from app.domain.users.service import UserService
from app.schemas.response import ApiResponse

router = APIRouter()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", httponly=True, secure=True, samesite="lax")
    response.delete_cookie("refresh_token", httponly=True, secure=True, samesite="lax")


@router.post("/auth/register", response_model=ApiResponse[UserResponse])
async def register(data: UserCreate, db: DbSession, settings: SettingsDep, response: Response):
    service = UserService(settings)
    user = await service.register(db, data)
    access_token = service.create_access_token(user.id)
    refresh_token = service.create_refresh_token(user.id)
    _set_auth_cookies(response, access_token, refresh_token)
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("/auth/login", response_model=ApiResponse[TokenResponse])
async def login(data: UserLogin, db: DbSession, settings: SettingsDep, response: Response):
    service = UserService(settings)
    user, access_token, refresh_token = await service.authenticate(db, data.email, data.password)
    _set_auth_cookies(response, access_token, refresh_token)
    return ApiResponse(data=TokenResponse(access_token=access_token))


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
    _set_auth_cookies(response, new_access, new_refresh)
    return ApiResponse(data=TokenResponse(access_token=new_access))


@router.post("/auth/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
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
async def delete_me(current_user: CurrentUser, db: DbSession, response: Response):
    from app.domain.users.repository import UserRepository

    repo = UserRepository()
    await repo.delete(db, current_user.id)
    _clear_auth_cookies(response)
    return ApiResponse(data={"message": "Account deleted"})

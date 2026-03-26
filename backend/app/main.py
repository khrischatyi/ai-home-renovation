from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.config import Settings
from app.dependencies import get_settings
from app.middleware.cors import setup_cors


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    yield
    # Shutdown
    from app.database import engine

    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    setup_cors(app, settings)

    # Import and include domain routers
    from app.domain.users.router import router as users_router
    from app.domain.contractors.router import router as contractors_router
    from app.domain.projects.router import router as projects_router
    from app.domain.payments.router import router as payments_router

    app.include_router(users_router, prefix="/api/v1")
    app.include_router(contractors_router, prefix="/api/v1")
    app.include_router(projects_router, prefix="/api/v1")
    app.include_router(payments_router, prefix="/api/v1")

    @app.get("/api/v1/health")
    async def health_check():
        return {"status": "healthy", "app": settings.APP_NAME}

    return app


app = create_app()

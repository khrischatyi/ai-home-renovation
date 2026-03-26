from uuid import UUID

from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, OptionalUser
from app.domain.projects.schemas import (
    CostEstimateResponse,
    ProjectContractorResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.domain.projects.service import ProjectService
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ApiResponse[ProjectResponse])
async def create_project(
    data: ProjectCreate,
    db: DbSession,
    current_user: OptionalUser,
):
    service = ProjectService()
    user_id = current_user.id if current_user else None
    project = await service.create_project(db, data, user_id=user_id)
    return ApiResponse(data=project)


@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def get_project(project_id: UUID, db: DbSession):
    service = ProjectService()
    project = await service.get_project(db, project_id)
    return ApiResponse(data=project)


@router.patch("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def update_project(project_id: UUID, data: ProjectUpdate, db: DbSession):
    service = ProjectService()
    project = await service.update_project(db, project_id, data)
    return ApiResponse(data=project)


@router.post("/{project_id}/match", response_model=ApiResponse[list[ProjectContractorResponse]])
async def match_contractors(project_id: UUID, db: DbSession):
    service = ProjectService()
    matches = await service.match_contractors(db, project_id)
    return ApiResponse(data=matches)


@router.get("/{project_id}/contractors", response_model=ApiResponse[list[ProjectContractorResponse]])
async def get_project_contractors(project_id: UUID, db: DbSession):
    service = ProjectService()
    contractors = await service.get_project_contractors(db, project_id)
    return ApiResponse(data=contractors)


@router.post("/estimates", response_model=ApiResponse[CostEstimateResponse])
async def get_estimate(data: ProjectCreate, db: DbSession):
    service = ProjectService()
    estimate = await service.get_cost_estimate(data.project_type, data.zip_code, data.scope)
    return ApiResponse(data=estimate)

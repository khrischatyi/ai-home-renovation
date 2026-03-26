from uuid import UUID

from fastapi import APIRouter, Query

from app.dependencies import DbSession
from app.domain.contractors.schemas import (
    ContractorListResponse,
    ContractorResponse,
    ContractorSearchParams,
    ReviewResponse,
)
from app.domain.contractors.service import ContractorService
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/contractors", tags=["contractors"])


@router.get("", response_model=ApiResponse[ContractorListResponse])
async def search_contractors(
    db: DbSession,
    zip_code: str | None = Query(default=None),
    project_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    service = ContractorService()
    params = ContractorSearchParams(
        zip_code=zip_code, project_type=project_type, page=page, per_page=per_page
    )
    result = await service.search_contractors(db, params)
    return ApiResponse(data=result)


@router.get("/{contractor_id}", response_model=ApiResponse[ContractorResponse])
async def get_contractor(contractor_id: UUID, db: DbSession):
    service = ContractorService()
    contractor = await service.get_contractor(db, contractor_id)
    return ApiResponse(data=contractor)


@router.get("/{contractor_id}/reviews", response_model=ApiResponse[list[ReviewResponse]])
async def get_reviews(contractor_id: UUID, db: DbSession):
    service = ContractorService()
    reviews = await service.get_reviews(db, contractor_id)
    return ApiResponse(data=reviews)

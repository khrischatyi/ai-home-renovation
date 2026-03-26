import math
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.contractors.models import Contractor
from app.domain.contractors.repository import ContractorRepository
from app.domain.contractors.schemas import (
    ContractorListResponse,
    ContractorResponse,
    ContractorSearchParams,
    ReviewResponse,
)
from app.domain.contractors.scoring import ContractorScoringEngine
from app.schemas.response import PaginationMeta


class ContractorService:
    def __init__(self) -> None:
        self.repo = ContractorRepository()
        self.scoring = ContractorScoringEngine()

    async def search_contractors(
        self, db: AsyncSession, params: ContractorSearchParams
    ) -> ContractorListResponse:
        contractors, total = await self.repo.search(
            db,
            zip_code=params.zip_code,
            specialty=params.project_type,
            page=params.page,
            per_page=params.per_page,
        )
        total_pages = math.ceil(total / params.per_page) if params.per_page > 0 else 0
        return ContractorListResponse(
            contractors=[ContractorResponse.model_validate(c) for c in contractors],
            pagination=PaginationMeta(
                page=params.page,
                per_page=params.per_page,
                total=total,
                total_pages=total_pages,
            ),
        )

    async def get_contractor(self, db: AsyncSession, contractor_id: UUID) -> ContractorResponse:
        contractor = await self.repo.get_by_id(db, contractor_id)
        if contractor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contractor not found",
            )
        return ContractorResponse.model_validate(contractor)

    async def get_top_matches(
        self, db: AsyncSession, zip_code: str, project_type: str
    ) -> list[ContractorResponse]:
        contractors = await self.repo.get_top_for_project(db, zip_code, project_type)
        return [ContractorResponse.model_validate(c) for c in contractors]

    async def get_reviews(self, db: AsyncSession, contractor_id: UUID) -> list[ReviewResponse]:
        contractor = await self.repo.get_by_id(db, contractor_id)
        if contractor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contractor not found",
            )
        reviews = await self.repo.get_reviews(db, contractor_id)
        return [ReviewResponse.model_validate(r) for r in reviews]

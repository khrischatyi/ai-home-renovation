import uuid
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.contractors.service import ContractorService
from app.domain.projects.cost_engine import CostEstimationEngine
from app.domain.projects.repository import ProjectRepository
from app.domain.projects.schemas import (
    CostEstimateResponse,
    ProjectContractorResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)


class ProjectService:
    def __init__(self) -> None:
        self.repo = ProjectRepository()
        self.cost_engine = CostEstimationEngine()
        self.contractor_service = ContractorService()

    async def create_project(
        self, db: AsyncSession, data: ProjectCreate, user_id: UUID | None = None
    ) -> ProjectResponse:
        session_id = uuid.uuid4()

        estimate = self.cost_engine.estimate(data.project_type, data.zip_code, data.scope)

        project = await self.repo.create(
            db,
            user_id=user_id,
            session_id=session_id,
            project_type=data.project_type,
            zip_code=data.zip_code,
            scope=data.scope,
            preferences=data.preferences,
            cost_estimate_low=estimate.low,
            cost_estimate_high=estimate.high,
            cost_confidence=estimate.confidence,
        )
        return ProjectResponse.model_validate(project)

    async def get_project(self, db: AsyncSession, project_id: UUID) -> ProjectResponse:
        project = await self.repo.get_by_id(db, project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
        return ProjectResponse.model_validate(project)

    async def update_project(
        self, db: AsyncSession, project_id: UUID, data: ProjectUpdate
    ) -> ProjectResponse:
        existing = await self.repo.get_by_id(db, project_id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        update_data = data.model_dump(exclude_unset=True)

        # Re-estimate cost if scope changed
        if "scope" in update_data:
            estimate = self.cost_engine.estimate(
                existing.project_type,
                existing.zip_code,
                update_data["scope"],
            )
            update_data["cost_estimate_low"] = estimate.low
            update_data["cost_estimate_high"] = estimate.high
            update_data["cost_confidence"] = estimate.confidence

        if update_data:
            project = await self.repo.update(db, project_id, **update_data)
        else:
            project = existing
        return ProjectResponse.model_validate(project)

    async def match_contractors(
        self, db: AsyncSession, project_id: UUID
    ) -> list[ProjectContractorResponse]:
        project = await self.repo.get_by_id(db, project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        top_contractors = await self.contractor_service.get_top_matches(
            db, project.zip_code, project.project_type
        )

        contractor_ids = [c.id for c in top_contractors]
        links = await self.repo.add_contractors(db, project_id, contractor_ids)

        # Update project status to results
        await self.repo.update(db, project_id, status="results")

        return [ProjectContractorResponse.model_validate(link) for link in links]

    async def get_project_contractors(
        self, db: AsyncSession, project_id: UUID
    ) -> list[ProjectContractorResponse]:
        project = await self.repo.get_by_id(db, project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
        links = await self.repo.get_project_contractors(db, project_id)
        return [ProjectContractorResponse.model_validate(link) for link in links]

    async def get_user_projects(
        self, db: AsyncSession, user_id: UUID
    ) -> list[ProjectResponse]:
        projects = await self.repo.get_user_projects(db, user_id)
        return [ProjectResponse.model_validate(p) for p in projects]

    async def get_cost_estimate(
        self, project_type: str, zip_code: str, scope: dict
    ) -> CostEstimateResponse:
        estimate = self.cost_engine.estimate(project_type, zip_code, scope)
        return CostEstimateResponse(
            low=estimate.low,
            high=estimate.high,
            confidence=estimate.confidence,
            project_type=project_type,
            zip_code=zip_code,
        )

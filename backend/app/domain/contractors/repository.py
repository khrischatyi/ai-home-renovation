from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.contractors.models import Contractor, ContractorReview


class ContractorRepository:
    async def get_by_id(self, db: AsyncSession, contractor_id: UUID) -> Contractor | None:
        result = await db.execute(select(Contractor).where(Contractor.id == contractor_id))
        return result.scalar_one_or_none()

    async def search(
        self,
        db: AsyncSession,
        zip_code: str | None = None,
        specialty: str | None = None,
        min_score: float = 0.0,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Contractor], int]:
        query = select(Contractor).where(
            Contractor.is_active.is_(True),
            Contractor.composite_score >= min_score,
        )

        if zip_code:
            query = query.where(
                (Contractor.zip_code == zip_code)
                | (Contractor.service_area_zips.any(zip_code))
            )

        if specialty:
            query = query.where(Contractor.specialties.any(specialty))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(Contractor.composite_score.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await db.execute(query)
        contractors = list(result.scalars().all())
        return contractors, total

    async def get_top_for_project(
        self,
        db: AsyncSession,
        zip_code: str,
        specialty: str,
        limit: int = 5,
    ) -> list[Contractor]:
        query = (
            select(Contractor)
            .where(
                Contractor.is_active.is_(True),
                (Contractor.zip_code == zip_code) | (Contractor.service_area_zips.any(zip_code)),
                Contractor.specialties.any(specialty),
            )
            .order_by(Contractor.composite_score.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_reviews(
        self, db: AsyncSession, contractor_id: UUID
    ) -> list[ContractorReview]:
        result = await db.execute(
            select(ContractorReview)
            .where(ContractorReview.contractor_id == contractor_id)
            .order_by(ContractorReview.review_date.desc())
        )
        return list(result.scalars().all())

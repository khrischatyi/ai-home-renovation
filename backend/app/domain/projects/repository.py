from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.projects.models import Project, ProjectContractor


class ProjectRepository:
    async def create(self, db: AsyncSession, **kwargs) -> Project:
        project = Project(**kwargs)
        db.add(project)
        await db.flush()
        await db.refresh(project)
        return project

    async def get_by_id(self, db: AsyncSession, project_id: UUID) -> Project | None:
        result = await db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def get_by_session(self, db: AsyncSession, session_id: UUID) -> list[Project]:
        result = await db.execute(
            select(Project)
            .where(Project.session_id == session_id)
            .order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, project_id: UUID, **kwargs) -> Project | None:
        await db.execute(
            update(Project).where(Project.id == project_id).values(**kwargs)
        )
        await db.flush()
        return await self.get_by_id(db, project_id)

    async def add_contractors(
        self,
        db: AsyncSession,
        project_id: UUID,
        contractor_ids: list[UUID],
    ) -> list[ProjectContractor]:
        links = []
        for rank, contractor_id in enumerate(contractor_ids, start=1):
            link = ProjectContractor(
                project_id=project_id,
                contractor_id=contractor_id,
                rank=rank,
            )
            db.add(link)
            links.append(link)
        await db.flush()
        return links

    async def get_user_projects(self, db: AsyncSession, user_id: UUID) -> list[Project]:
        result = await db.execute(
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_project_contractors(
        self, db: AsyncSession, project_id: UUID
    ) -> list[ProjectContractor]:
        result = await db.execute(
            select(ProjectContractor)
            .where(ProjectContractor.project_id == project_id)
            .order_by(ProjectContractor.rank)
        )
        return list(result.scalars().all())

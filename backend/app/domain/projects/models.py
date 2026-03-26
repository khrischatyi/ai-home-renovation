import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func, text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    project_type: Mapped[str] = mapped_column(String(50), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False)
    scope: Mapped[dict] = mapped_column(JSON, default=dict)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    cost_estimate_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost_estimate_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="intake", server_default=text("'intake'")
    )
    tier: Mapped[int] = mapped_column(Integer, default=1, server_default=text("1"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ProjectContractor(Base):
    __tablename__ = "project_contractors"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    contractor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

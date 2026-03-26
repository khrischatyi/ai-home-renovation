import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Contractor(Base):
    __tablename__ = "contractors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    service_area_zips: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    specialties: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    license_number: Mapped[str] = mapped_column(String(100), nullable=False)
    license_status: Mapped[str] = mapped_column(String(50), nullable=False)
    license_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    insurance_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    years_in_business: Mapped[int] = mapped_column(Integer, default=0)
    composite_score: Mapped[float] = mapped_column(Float, default=0.0)
    score_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    data_sources_count: Mapped[int] = mapped_column(Integer, default=0)
    last_data_refresh: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    reviews: Mapped[list["ContractorReview"]] = relationship(back_populates="contractor", lazy="selectin")


class ContractorReview(Base):
    __tablename__ = "contractor_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    contractor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    review_text: Mapped[str] = mapped_column(Text, nullable=False)
    review_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    contractor: Mapped["Contractor"] = relationship(back_populates="reviews")

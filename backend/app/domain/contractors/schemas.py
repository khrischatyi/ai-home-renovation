from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.response import PaginationMeta


class ContractorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_name: str
    slug: str
    phone: str
    email: str
    website: str | None
    zip_code: str
    service_area_zips: list[str]
    specialties: list[str]
    license_number: str
    license_status: str
    license_expiry: datetime | None
    insurance_verified: bool
    years_in_business: int
    composite_score: float
    score_breakdown: dict
    data_sources_count: int
    last_data_refresh: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ContractorListResponse(BaseModel):
    contractors: list[ContractorResponse]
    pagination: PaginationMeta


class ContractorSearchParams(BaseModel):
    zip_code: str | None = None
    project_type: str | None = None
    page: int = 1
    per_page: int = 20


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    contractor_id: UUID
    source: str
    rating: float
    review_text: str
    review_date: datetime
    fetched_at: datetime

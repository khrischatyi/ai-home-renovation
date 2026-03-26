from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    project_type: str
    zip_code: str
    scope: dict = {}
    preferences: dict = {}


class ProjectUpdate(BaseModel):
    scope: dict | None = None
    preferences: dict | None = None
    status: str | None = None
    tier: int | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    session_id: UUID
    project_type: str
    zip_code: str
    scope: dict
    preferences: dict
    cost_estimate_low: float | None
    cost_estimate_high: float | None
    cost_confidence: float | None
    status: str
    tier: int
    created_at: datetime
    updated_at: datetime


class ProjectContractorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    contractor_id: UUID
    rank: int
    matched_at: datetime


class CostEstimateResponse(BaseModel):
    low: float
    high: float
    confidence: float
    project_type: str
    zip_code: str

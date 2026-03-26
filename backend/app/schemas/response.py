from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class ApiResponse(BaseModel, Generic[T]):
    data: T | None = None
    error: str | None = None
    pagination: PaginationMeta | None = None

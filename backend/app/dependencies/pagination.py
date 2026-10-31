"""Pagination and sorting dependencies."""

from dataclasses import dataclass
from typing import Literal

from fastapi import Query


@dataclass
class PaginationParams:
    page: int
    page_size: int
    search: str | None
    sort_order: Literal["asc", "desc"]

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


async def get_pagination(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=255),
    sort_order: Literal["asc", "desc"] = Query(default="asc"),
) -> PaginationParams:
    return PaginationParams(
        page=page,
        page_size=page_size,
        search=search.strip() if search else None,
        sort_order=sort_order,
    )

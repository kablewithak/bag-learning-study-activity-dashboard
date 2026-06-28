from __future__ import annotations

from typing import Annotated
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_database_pool, require_api_key
from app.repositories.errors import GroupNotFoundError
from app.repositories.group_repository import GroupRepository
from app.schemas.common import ApiErrorResponse
from app.schemas.groups import GroupStatsResponse, GroupStudentsResponse

router = APIRouter(
    tags=["groups"],
    dependencies=[Depends(require_api_key)],
)


@router.get(
    "/groups/{group_id}/students",
    response_model=GroupStudentsResponse,
    responses={
        401: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
async def get_group_students(
    group_id: UUID,
    pool: Annotated[asyncpg.Pool, Depends(get_database_pool)],
) -> GroupStudentsResponse:
    repository = GroupRepository(pool)
    try:
        return await repository.get_group_students(str(group_id))
    except GroupNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        ) from error


@router.get(
    "/groups/{group_id}/stats",
    response_model=GroupStatsResponse,
    responses={
        401: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
)
async def get_group_stats(
    group_id: UUID,
    pool: Annotated[asyncpg.Pool, Depends(get_database_pool)],
) -> GroupStatsResponse:
    repository = GroupRepository(pool)
    try:
        return await repository.get_group_stats(str(group_id))
    except GroupNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        ) from error

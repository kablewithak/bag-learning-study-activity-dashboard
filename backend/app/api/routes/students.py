from __future__ import annotations

from typing import Annotated
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status

from app.api.dependencies import get_database_pool, require_api_key
from app.repositories.activity_repository import ActivityRepository
from app.repositories.errors import (
    IdempotencyConflictError,
    PersistenceStateError,
    StudentNotFoundError,
)
from app.schemas.activities import (
    ActivityCreateRequest,
    ActivityListResponse,
    ActivityResponse,
    ActivityType,
)
from app.schemas.common import ApiErrorResponse

router = APIRouter(
    tags=["students"],
    dependencies=[Depends(require_api_key)],
)


@router.get(
    "/students/{student_id}/activities",
    response_model=ActivityListResponse,
    responses={
        401: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
        422: {"description": "Invalid filter or pagination parameter."},
    },
)
async def list_student_activities(
    student_id: UUID,
    pool: Annotated[asyncpg.Pool, Depends(get_database_pool)],
    activity_type: Annotated[ActivityType | None, Query(alias="type")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ActivityListResponse:
    repository = ActivityRepository(pool)
    try:
        return await repository.list_for_student(student_id, activity_type, limit, offset)
    except StudentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        ) from error


@router.post(
    "/students/{student_id}/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        200: {"model": ActivityResponse, "description": "Idempotent replay."},
        401: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
        409: {"model": ApiErrorResponse},
        422: {"description": "Invalid activity payload or idempotency key."},
    },
)
async def create_student_activity(
    student_id: UUID,
    payload: ActivityCreateRequest,
    response: Response,
    pool: Annotated[asyncpg.Pool, Depends(get_database_pool)],
    idempotency_key: Annotated[UUID, Header(alias="X-Idempotency-Key")],
) -> ActivityResponse:
    repository = ActivityRepository(pool)
    try:
        result = await repository.create_or_replay(student_id, payload, idempotency_key)
    except StudentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        ) from error
    except IdempotencyConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Idempotency key was already used with different activity details.",
        ) from error
    except PersistenceStateError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The activity could not be persisted safely.",
        ) from error

    if not result.created:
        response.status_code = status.HTTP_200_OK
    return result.activity

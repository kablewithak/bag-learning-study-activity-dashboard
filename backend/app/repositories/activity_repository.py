from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from uuid import UUID

import asyncpg

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


@dataclass(frozen=True)
class ActivityWriteResult:
    activity: ActivityResponse
    created: bool


def create_request_fingerprint(student_id: UUID, payload: ActivityCreateRequest) -> str:
    """Hash the fields that define one activity-creation intent."""

    canonical_payload = {
        "score": payload.score,
        "student_id": str(student_id),
        "type": payload.type.value,
    }
    encoded_payload = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded_payload.encode("utf-8")).hexdigest()


class ActivityRepository:
    """Owns PostgreSQL reads and writes for activity records."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def list_for_student(
        self,
        student_id: UUID,
        activity_type: ActivityType | None,
        limit: int,
        offset: int,
    ) -> ActivityListResponse:
        async with self._pool.acquire() as connection:
            student_exists = await connection.fetchval(
                "SELECT EXISTS(SELECT 1 FROM students WHERE id = $1)",
                student_id,
            )
            if not student_exists:
                raise StudentNotFoundError

            rows = await connection.fetch(
                """
                SELECT id, student_id, type, score, created_at
                FROM activities
                WHERE student_id = $1
                  AND ($2::activity_type IS NULL OR type = $2::activity_type)
                ORDER BY created_at DESC, id DESC
                LIMIT $3 OFFSET $4
                """,
                student_id,
                activity_type.value if activity_type is not None else None,
                limit + 1,
                offset,
            )

        has_more = len(rows) > limit
        return ActivityListResponse(
            items=[self._to_activity_response(row) for row in rows[:limit]],
            limit=limit,
            offset=offset,
            has_more=has_more,
        )

    async def create_or_replay(
        self,
        student_id: UUID,
        payload: ActivityCreateRequest,
        idempotency_key: UUID,
    ) -> ActivityWriteResult:
        """Create once, replay safely, or reject a changed idempotent request."""

        fingerprint = create_request_fingerprint(student_id, payload)
        async with self._pool.acquire() as connection:
            try:
                async with connection.transaction():
                    student_exists = await connection.fetchval(
                        "SELECT EXISTS(SELECT 1 FROM students WHERE id = $1)",
                        student_id,
                    )
                    if not student_exists:
                        raise StudentNotFoundError

                    created_row = await connection.fetchrow(
                        """
                        INSERT INTO activities (
                            student_id,
                            type,
                            score,
                            idempotency_key,
                            request_fingerprint
                        )
                        VALUES ($1, $2::activity_type, $3, $4, $5)
                        ON CONFLICT (idempotency_key) DO NOTHING
                        RETURNING id, student_id, type, score, created_at
                        """,
                        student_id,
                        payload.type.value,
                        payload.score,
                        idempotency_key,
                        fingerprint,
                    )
                    if created_row is not None:
                        return ActivityWriteResult(
                            activity=self._to_activity_response(created_row),
                            created=True,
                        )

                    existing_row = await connection.fetchrow(
                        """
                        SELECT id, student_id, type, score, created_at, request_fingerprint
                        FROM activities
                        WHERE idempotency_key = $1
                        """,
                        idempotency_key,
                    )
                    if existing_row is None:
                        raise PersistenceStateError(
                            "Idempotency conflict did not resolve to a persisted activity."
                        )
                    if existing_row["request_fingerprint"] != fingerprint:
                        raise IdempotencyConflictError

                    return ActivityWriteResult(
                        activity=self._to_activity_response(existing_row),
                        created=False,
                    )
            except asyncpg.ForeignKeyViolationError as error:
                raise StudentNotFoundError from error

    @staticmethod
    def _to_activity_response(row: asyncpg.Record) -> ActivityResponse:
        return ActivityResponse(
            id=row["id"],
            student_id=row["student_id"],
            type=ActivityType(row["type"]),
            score=row["score"],
            created_at=row["created_at"],
        )

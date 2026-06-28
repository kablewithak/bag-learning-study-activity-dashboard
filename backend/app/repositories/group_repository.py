from __future__ import annotations

import asyncpg

from app.repositories.errors import GroupNotFoundError
from app.schemas.groups import GroupStudentsResponse, GroupSummary, StudentSummary


class GroupRepository:
    """Owns PostgreSQL reads for group and student membership data."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def get_group_students(self, group_id: str) -> GroupStudentsResponse:
        async with self._pool.acquire() as connection:
            group_row = await connection.fetchrow(
                """
                SELECT id, name
                FROM study_groups
                WHERE id = $1
                """,
                group_id,
            )
            if group_row is None:
                raise GroupNotFoundError

            student_rows = await connection.fetch(
                """
                SELECT id, name
                FROM students
                WHERE group_id = $1
                ORDER BY name ASC, id ASC
                """,
                group_id,
            )

        return GroupStudentsResponse(
            group=GroupSummary(id=group_row["id"], name=group_row["name"]),
            students=[StudentSummary(id=row["id"], name=row["name"]) for row in student_rows],
        )

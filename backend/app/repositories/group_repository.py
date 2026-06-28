from __future__ import annotations

import asyncpg

from app.repositories.errors import GroupNotFoundError
from app.schemas.groups import (
    ActivityTrendPoint,
    GroupStatsResponse,
    GroupStatsSummary,
    GroupStudentsResponse,
    GroupSummary,
    StudentActivityStats,
    StudentSummary,
)


class GroupRepository:
    """Owns PostgreSQL reads for group, membership, and group-statistics data."""

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

    async def get_group_stats(self, group_id: str) -> GroupStatsResponse:
        """Return SQL-aggregated student stats and a gap-free 14-day UTC trend."""

        async with self._pool.acquire() as connection:
            group_row = await connection.fetchrow(
                """
                SELECT
                    study_groups.id,
                    study_groups.name,
                    COUNT(students.id)::integer AS student_count
                FROM study_groups
                LEFT JOIN students ON students.group_id = study_groups.id
                WHERE study_groups.id = $1
                GROUP BY study_groups.id, study_groups.name
                """,
                group_id,
            )
            if group_row is None:
                raise GroupNotFoundError

            student_rows = await connection.fetch(
                """
                SELECT
                    students.id AS student_id,
                    students.name AS student_name,
                    COUNT(activities.id)::integer AS total_activities,
                    COUNT(activities.id) FILTER (
                        WHERE activities.type = 'lesson_completed'
                    )::integer AS lesson_completed_count,
                    COUNT(activities.id) FILTER (
                        WHERE activities.type = 'quiz_attempted'
                    )::integer AS quiz_attempted_count,
                    COUNT(activities.id) FILTER (
                        WHERE activities.type = 'note_added'
                    )::integer AS note_added_count,
                    AVG(activities.score) FILTER (
                        WHERE activities.type = 'quiz_attempted'
                          AND activities.score IS NOT NULL
                    ) AS average_quiz_score,
                    MAX(activities.created_at) AS last_active_at
                FROM students
                LEFT JOIN activities ON activities.student_id = students.id
                WHERE students.group_id = $1
                GROUP BY students.id, students.name
                ORDER BY students.name ASC, students.id ASC
                """,
                group_id,
            )

            trend_rows = await connection.fetch(
                """
                WITH calendar_days AS (
                    SELECT generate_series(
                        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 13,
                        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
                        INTERVAL '1 day'
                    )::date AS day
                ),
                daily_activity_counts AS (
                    SELECT
                        (activities.created_at AT TIME ZONE 'UTC')::date AS day,
                        COUNT(activities.id)::integer AS activity_count
                    FROM activities
                    INNER JOIN students ON students.id = activities.student_id
                    WHERE students.group_id = $1
                      AND activities.created_at >= (
                        ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 13)::timestamp
                        AT TIME ZONE 'UTC'
                      )
                      AND activities.created_at < (
                        ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date + 1)::timestamp
                        AT TIME ZONE 'UTC'
                      )
                    GROUP BY (activities.created_at AT TIME ZONE 'UTC')::date
                )
                SELECT
                    calendar_days.day,
                    COALESCE(daily_activity_counts.activity_count, 0)::integer AS activity_count
                FROM calendar_days
                LEFT JOIN daily_activity_counts
                    ON daily_activity_counts.day = calendar_days.day
                ORDER BY calendar_days.day ASC
                """,
                group_id,
            )

        return GroupStatsResponse(
            group=GroupStatsSummary(
                id=group_row["id"],
                name=group_row["name"],
                student_count=group_row["student_count"],
            ),
            students=[
                StudentActivityStats(
                    student_id=row["student_id"],
                    student_name=row["student_name"],
                    total_activities=row["total_activities"],
                    lesson_completed_count=row["lesson_completed_count"],
                    quiz_attempted_count=row["quiz_attempted_count"],
                    note_added_count=row["note_added_count"],
                    average_quiz_score=(
                        float(row["average_quiz_score"])
                        if row["average_quiz_score"] is not None
                        else None
                    ),
                    last_active_at=row["last_active_at"],
                )
                for row in student_rows
            ],
            activity_trend=[
                ActivityTrendPoint(day=row["day"], activity_count=row["activity_count"])
                for row in trend_rows
            ],
        )

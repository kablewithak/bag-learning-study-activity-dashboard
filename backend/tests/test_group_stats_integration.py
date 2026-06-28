from __future__ import annotations

import asyncio
import datetime
import os
from datetime import date, timedelta
from uuid import uuid4

import asyncpg

from app.repositories.group_repository import GroupRepository


def test_group_stats_includes_inactive_students_and_zero_activity_days() -> None:
    """Exercise PostgreSQL-only aggregate and generate_series behavior against a real DB."""

    asyncio.run(_assert_group_stats_behavior())


async def _assert_group_stats_behavior() -> None:
    database_url = os.environ["DATABASE_URL"]
    pool = await asyncpg.create_pool(database_url, min_size=1, max_size=1)
    group_id = uuid4()
    active_student_id = uuid4()
    inactive_student_id = uuid4()

    try:
        async with pool.acquire() as connection:
            today = await connection.fetchval(
                "SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date"
            )
            await connection.execute(
                "INSERT INTO study_groups (id, name) VALUES ($1, $2)",
                group_id,
                "Integration Test Group",
            )
            await connection.executemany(
                """
                INSERT INTO students (id, group_id, name)
                VALUES ($1, $2, $3)
                """,
                [
                    (active_student_id, group_id, "Active Student"),
                    (inactive_student_id, group_id, "Inactive Student"),
                ],
            )

            rows = [
                (
                    active_student_id,
                    "lesson_completed",
                    None,
                    _utc_datetime(today - timedelta(days=12)),
                    uuid4(),
                    "a" * 64,
                ),
                (
                    active_student_id,
                    "quiz_attempted",
                    80,
                    _utc_datetime(today - timedelta(days=3)),
                    uuid4(),
                    "b" * 64,
                ),
                (
                    active_student_id,
                    "quiz_attempted",
                    None,
                    _utc_datetime(today - timedelta(days=1)),
                    uuid4(),
                    "c" * 64,
                ),
                (
                    active_student_id,
                    "note_added",
                    None,
                    _utc_datetime(today),
                    uuid4(),
                    "d" * 64,
                ),
            ]
            await connection.executemany(
                """
                INSERT INTO activities (
                    student_id,
                    type,
                    score,
                    created_at,
                    idempotency_key,
                    request_fingerprint
                )
                VALUES ($1, $2::activity_type, $3, $4, $5, $6)
                """,
                rows,
            )

        result = await GroupRepository(pool).get_group_stats(str(group_id))

        assert result.group.id == group_id
        assert result.group.name == "Integration Test Group"
        assert result.group.student_count == 2

        stats_by_student_id = {student.student_id: student for student in result.students}
        active_stats = stats_by_student_id[active_student_id]
        inactive_stats = stats_by_student_id[inactive_student_id]

        assert active_stats.total_activities == 4
        assert active_stats.lesson_completed_count == 1
        assert active_stats.quiz_attempted_count == 2
        assert active_stats.note_added_count == 1
        assert active_stats.average_quiz_score == 80.0
        assert active_stats.last_active_at is not None

        assert inactive_stats.total_activities == 0
        assert inactive_stats.lesson_completed_count == 0
        assert inactive_stats.quiz_attempted_count == 0
        assert inactive_stats.note_added_count == 0
        assert inactive_stats.average_quiz_score is None
        assert inactive_stats.last_active_at is None

        assert len(result.activity_trend) == 14
        assert [point.day for point in result.activity_trend] == [
            today - timedelta(days=offset) for offset in range(13, -1, -1)
        ]
        trend_by_day = {point.day: point.activity_count for point in result.activity_trend}
        assert trend_by_day[today - timedelta(days=12)] == 1
        assert trend_by_day[today - timedelta(days=3)] == 1
        assert trend_by_day[today - timedelta(days=1)] == 1
        assert trend_by_day[today] == 1
        assert trend_by_day[today - timedelta(days=2)] == 0
    finally:
        async with pool.acquire() as connection:
            await connection.execute(
                "DELETE FROM activities WHERE student_id = ANY($1::uuid[])",
                [active_student_id, inactive_student_id],
            )
            await connection.execute("DELETE FROM students WHERE group_id = $1", group_id)
            await connection.execute("DELETE FROM study_groups WHERE id = $1", group_id)
        await pool.close()


def _utc_datetime(day: date) -> datetime.datetime:
    """Place fixture activities at midday UTC so date bucketing is unambiguous."""

    return datetime.datetime.combine(
        day,
        datetime.time(hour=12),
        tzinfo=datetime.UTC,
    )

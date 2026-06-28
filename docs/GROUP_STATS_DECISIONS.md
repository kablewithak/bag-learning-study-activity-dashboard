# Group Statistics Decisions

## Boundary

`GET /groups/{group_id}/stats` is a read-only, authenticated endpoint. The route owns HTTP status mapping and Pydantic response serialization. `GroupRepository` owns the PostgreSQL queries.

## Why SQL aggregation

The per-student table is aggregated in PostgreSQL with `COUNT`, `AVG`, `MAX`, `FILTER`, `GROUP BY`, and a `LEFT JOIN` from `students` to `activities`. This preserves students who have not yet recorded activity; an inner join would silently remove exactly the students an officer needs to notice.

## Why the trend uses `generate_series`

The trend query creates the 14 UTC calendar dates first, then left joins group-scoped daily activity counts. Zero-activity days therefore remain explicit output rows rather than disappearing and creating visual gaps in the frontend chart.

## Ordering and scope

Student rows are sorted by `student_name ASC, student_id ASC` so display order is stable. Trend rows are sorted chronologically. Both aggregates are strictly scoped through the requested group's student membership, avoiding cross-group activity leakage.

## Evidence

`test_group_stats_includes_inactive_students_and_zero_activity_days` runs against the Docker PostgreSQL service. It creates a temporary group with one active and one inactive student, proves aggregate values, proves the inactive row is retained, proves scored-only quiz averaging, and proves exactly 14 consecutive UTC dates with an explicit zero-count day.

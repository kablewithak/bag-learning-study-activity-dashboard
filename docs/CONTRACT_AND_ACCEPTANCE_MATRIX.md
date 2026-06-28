# Study Activity Dashboard - Contract and Acceptance Matrix

## Source-of-truth order

1. `Intern_Assessment.pdf`
2. `Study_Activity_Dashboard_PRD.md`
3. `Bag_Learning_SESSION_BRIEF.md`
4. Current repository and terminal evidence

The assessment describes an 8-14 hour take-home. The implementation is therefore planned against a 12-hour target, with a 14-hour maximum. Tier 3B begins only after the Tier 1 and Tier 2 core is working and validated.

## Architecture boundary

```text
React 18 + TypeScript + Vite + Tailwind
  -> typed frontend API client
  -> FastAPI route handlers
  -> Pydantic v2 schemas
  -> asyncpg repository layer
  -> PostgreSQL
```

## API contract

| Method | Path | Success | Required error behaviour |
|---|---|---:|---|
| `GET` | `/groups/{group_id}/students` | `200` | `401`, `404` |
| `GET` | `/students/{student_id}/activities` | `200` | `401`, `404`, `422` |
| `POST` | `/students/{student_id}/activities` | `201` or `200` replay | `401`, `404`, `409`, `422` |
| `GET` | `/groups/{group_id}/stats` | `200` | `401`, `404` |

## Non-negotiable invariants

- Every application endpoint requires `X-API-Key`.
- `score` may only exist for `quiz_attempted`, and must be an integer from 0 through 100.
- Pydantic validation and the PostgreSQL `CHECK` constraint both protect the score rule.
- Activity listing order is `created_at DESC, id DESC`.
- Listing uses offset pagination and a `limit + 1` query to determine `has_more`.
- Group statistics use PostgreSQL aggregation, not Python loops.
- Group statistics retain inactive students through a `LEFT JOIN`.
- The activity trend returns 14 UTC dates including zero-activity days.
- The database, not application memory, enforces idempotency-key uniqueness.
- A repeated idempotency key with a changed canonical payload returns `409`.

## Initial slice delivered in this commit

- Docker Compose PostgreSQL bootstrap
- schema, foreign keys, indexes, score `CHECK` constraint, and idempotency uniqueness
- deterministic group/student identity and 56 seeded activities across the current 14-day window
- exact startup, verification, and reset path in `README.md`

## Current proof state

| Area | Status | Evidence needed before it can be marked proven |
|---|---|---|
| Repository bootstrap | In progress | Local extraction and initial Git status |
| PostgreSQL schema | In progress | `docker compose up -d` plus SQL verification query |
| Deterministic seed data | In progress | Seed-count and group/student verification query |
| Backend | Not started | FastAPI app, tests, and API status-code evidence |
| Frontend | Not started | React route, build/typecheck, and browser evidence |
| Tier 3B idempotency | Not started | Concurrent-write test against PostgreSQL |

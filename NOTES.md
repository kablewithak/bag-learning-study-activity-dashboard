# NOTES

## Assessment scope

This repository implements a locally validated Study Activity Dashboard for the Bag Learning Software Development Intern take-home.

The demonstrated workflow is:

1. Open a seeded study group dashboard.
2. Inspect per-student activity statistics and a 14-day UTC trend.
3. Add a lesson, quiz attempt, or note activity.
4. See the student table and current-day trend refresh from PostgreSQL.
5. Recover a failed submit by retrying the exact original activity request.

## Architecture

- **Backend:** FastAPI, Pydantic v2, `asyncpg`, PostgreSQL 16.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack React Query.
- **Runtime:** Docker Compose for PostgreSQL, FastAPI, and Vite development service.
- **Data:** Deterministic synthetic seed data only.

The frontend calls relative `/api/...` paths. Vite forwards requests to FastAPI and injects the local shared API key at the development-server boundary. The API key is not embedded in browser TypeScript.

## Reliability decisions

### Typed API boundary

The backend exposes typed request and response contracts. Activity creation accepts only an activity type and an optional strict integer score. The database owns IDs and timestamps.

### Activity score rule

Scores are allowed only for `quiz_attempted`. A quiz score is optional but, when present, must be an integer from 0 to 100. The same invariant is enforced in Pydantic and PostgreSQL.

### Idempotent activity creation

`POST /students/{student_id}/activities` requires `X-Idempotency-Key`.

- New key + payload: `201 Created`
- Same key + same payload: `200 OK` with the original activity
- Same key + changed payload: `409 Conflict`

The database has a unique key constraint and the repository uses `INSERT ... ON CONFLICT DO NOTHING`, then reads and compares the original request fingerprint. This prevents duplicate rows from normal retry behavior.

The frontend retains the request identity after a recoverable submit failure. **Retry exact activity** is safe to use for that failed request. A later normal **Record activity** action deliberately creates a new request identity and therefore a new activity.

### Statistics and trend

The group statistics query is PostgreSQL-backed. It preserves inactive students with a `LEFT JOIN`, calculates scored-quiz averages only from non-null quiz scores, and generates an exact 14-day UTC trend using `generate_series`. Zero-activity days remain explicit instead of disappearing.

## Validation evidence

The project has been validated locally against deterministic synthetic data:

- backend pytest suite: `7 passed`;
- backend Ruff check: passing;
- frontend lint: passing;
- frontend TypeScript check: passing;
- frontend production build: passing;
- live dashboard load against PostgreSQL;
- activity submission refresh;
- idempotent retry behavior;
- table sort behavior;
- visible loading and failure/retry states;
- 14-day trend with explicit zero-day rendering.

## Deliberate non-claims

This is assessment software, not a production service.

It does not claim:

- production user authentication or authorization;
- customer-data use;
- deployment or monitoring;
- load testing;
- full audit logging;
- multi-tenant access controls;
- production incident response ownership.

## Resetting synthetic test data

Manual browser testing changes the local Docker volume. To return to deterministic seed data, run this from the repository root:

```powershell
docker compose down -v
docker compose up --build -d
```

Use that only when you intentionally want to remove this project's local PostgreSQL data.

# Study Activity Dashboard

A locally validated, assessment-only study activity dashboard for the Bag Learning Software Development Intern take-home. The project uses FastAPI, PostgreSQL, React, TypeScript, Vite, Tailwind CSS, and TanStack React Query.

## Current scope

This repository currently provides:

- PostgreSQL 16 with deterministic synthetic seed data;
- FastAPI plus explicit Pydantic v2 request and response models;
- a repository layer using parameterized `asyncpg` queries;
- shared `X-API-Key` authentication;
- group-student reads, activity listing/filtering/pagination, activity creation, and SQL-aggregated group statistics;
- database-enforced idempotent writes;
- a React dashboard with loading, failure/retry, sortable-table, add-activity, and 14-day activity-trend behavior;
- a Vite development proxy that injects the local API key server-side;
- a retained-idempotency-key retry path for recoverable activity-submit failures.

The repository is **not** production-ready, deployed, customer-data tested, load tested, or real-auth ready.

## Prerequisites

- Docker Desktop with Docker Compose v2;
- Git;
- optionally, Node.js 22+ for direct frontend checks outside Docker;
- optionally, Python 3.11+ for direct backend editor tooling.

## Start the complete local system

From the repository root:

```powershell
Copy-Item .env.example .env

docker compose up --build -d

docker compose ps
```

Open the dashboard:

```text
http://localhost:5173/groups/4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9
```

The API is available at `http://localhost:8000`, and interactive API documentation is at `http://localhost:8000/docs`. PostgreSQL initializes from `db/init/` only when its Docker volume is first created.

## Seeded dashboard target

The dashboard opens this seeded study group:

```text
4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9
```

The seeded group is **Engineering Economics Study Group**. It contains five synthetic students and 56 activity records across the most recent 14 UTC calendar days, including intentional zero-activity days.

## Add-activity behavior

The dashboard records `lesson_completed`, `quiz_attempted`, or `note_added` activities through the typed POST API.

- Quiz scores are optional but, when supplied, must be whole numbers from 0 through 100.
- Lesson and note activities never include a score.
- A fresh submission creates an idempotency key in the browser.
- A recoverable failed submission retains the exact student, payload, and idempotency key. **Retry exact activity** reuses that same request identity.
- A changed form intent receives a new idempotency key.
- A successful write invalidates the group-statistics query so the trend and student table refresh from PostgreSQL.

## Development proxy and API-key boundary

The React app calls only relative `/api/...` paths. During local development, Vite forwards those requests to FastAPI and adds `X-API-Key` from the frontend container environment. The key is therefore not present in browser source code or bundled TypeScript.

This pattern satisfies the assessment’s local shared-key requirement. It is **not** production user authentication or authorization. A production browser application would use user sessions or tokens while service credentials remain server-side.

## Direct API verification

The local API key is stored in `.env`. The example key is intentionally local-only and must never be committed as a real secret.

```powershell
$headers = @{
  "X-API-Key" = "local-development-api-key-change-me"
}

Invoke-RestMethod -Headers $headers -Uri "http://localhost:8000/groups/4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9/stats" |
  ConvertTo-Json -Depth 6
```

## Run validation

Backend checks:

```powershell
docker compose exec backend pytest

docker compose exec backend ruff check .
```

Frontend checks:

```powershell
docker compose exec frontend npm run lint

docker compose exec frontend npm run typecheck

docker compose exec frontend npm run build
```

## Reset local database data

This removes only the project Docker volume and recreates deterministic synthetic data:

```powershell
docker compose down -v
docker compose up --build -d
```

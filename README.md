# Study Activity Dashboard

A locally validated, assessment-only study activity dashboard for the Bag Learning Software Development Intern take-home. The project uses FastAPI, PostgreSQL, React, and TypeScript, but the frontend is added in a later slice.

## Current scope

This repository currently provides:

- PostgreSQL 16 with deterministic synthetic seed data;
- FastAPI plus explicit Pydantic v2 request and response models;
- a repository layer using parameterized `asyncpg` queries;
- shared `X-API-Key` authentication;
- group-student reads, activity listing/filtering/pagination, and activity creation;
- database-enforced idempotent writes.

The repository is **not** production-ready, deployed, customer-data tested, or real-auth ready.

## Prerequisites

- Docker Desktop with Docker Compose v2;
- Git;
- optionally, Python 3.11+ for local editor tooling.

## Start the database and API

From the repository root:

```powershell
Copy-Item .env.example .env

docker compose up --build -d

docker compose ps
```

The API is available at `http://localhost:8000`. PostgreSQL initializes from `db/init/` only when its Docker volume is first created.

## Seeded dashboard target

The future frontend dashboard will use this group ID:

```text
4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9
```

The seeded group is **Engineering Economics Study Group**. It contains five synthetic students and 56 activity records across the most recent 14 UTC calendar days, including intentional zero-activity days.

## Direct API verification

The local API key is stored in `.env`. The example key is intentionally local-only and must never be committed as a real secret.

```powershell
$headers = @{
  "X-API-Key" = "local-development-api-key-change-me"
}

Invoke-RestMethod -Headers $headers -Uri "http://localhost:8000/groups/4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9/students"
```

Create a new activity with a fresh idempotency key:

```powershell
$headers = @{
  "X-API-Key" = "local-development-api-key-change-me"
  "X-Idempotency-Key" = [guid]::NewGuid().ToString()
}

$body = @{
  type = "quiz_attempted"
  score = 85
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body `
  -Uri "http://localhost:8000/students/f03b9d4e-bf26-4b83-a0a4-c8f72d951b01/activities"
```

## Run validation

```powershell
docker compose exec backend pytest

docker compose exec backend ruff check .
```

## Reset local database data

This removes only the project Docker volume and recreates the deterministic synthetic data:

```powershell
docker compose down -v
docker compose up --build -d
```

## API-key boundary

The shared API key satisfies the assessment’s simple local protection requirement. It is **not** production user authentication or authorization. The frontend will call the backend through a Vite development proxy so the shared key does not enter the browser bundle; a production web application would instead use a user session or token while service credentials remain server-side.

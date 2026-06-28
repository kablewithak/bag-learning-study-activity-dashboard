# Bag Learning Study Activity Dashboard

A local, synthetic-data study-activity dashboard for the Bag Learning Software Development Intern take-home.

## Current scope

This repository currently contains the database foundation for the feature:

- PostgreSQL 16 through Docker Compose
- schema with foreign keys, indexes, a score-consistency `CHECK` constraint, and database-enforced idempotency-key uniqueness
- one stable study group, five stable students, and 56 seeded activities spread across the current 14 UTC calendar-day window

The FastAPI backend and React dashboard are intentionally added in the next implementation slices. This repository is not production-ready, deployed, customer-data tested, or real-auth ready.

## Stack

```text
Database: PostgreSQL 16
Backend (next slice): Python 3.11+, FastAPI, Pydantic v2, asyncpg
Frontend (later slice): React 18, TypeScript, Vite, Tailwind, TanStack React Query, Recharts
Runtime: Docker Compose
```

## Prerequisites

- Docker Desktop with Docker Compose v2
- Git
- Later slices will require Python 3.11+ and Node.js 20+

## Local startup: database foundation

1. Copy the environment template:

```powershell
Copy-Item .env.example .env
```

2. Start PostgreSQL and wait for the health check:

```powershell
docker compose up -d
docker compose ps
```

3. Confirm the seeded data:

```powershell
docker compose exec db psql -U study_activity -d study_activity -c "SELECT (SELECT count(*) FROM study_groups) AS groups, (SELECT count(*) FROM students) AS students, (SELECT count(*) FROM activities) AS activities;"
```

Expected result:

```text
groups | students | activities
-------+----------+-----------
1      | 5        | 56
```

4. Confirm the stable seeded group:

```powershell
docker compose exec db psql -U study_activity -d study_activity -c "SELECT id, name FROM study_groups;"
```

Dashboard route for the completed app:

```text
/groups/4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9
```

## Reset the local database

The initialisation scripts run only when PostgreSQL creates a fresh data volume. Resetting therefore removes the named Docker volume and reloads the schema and synthetic seed data.

```powershell
docker compose down -v
docker compose up -d
docker compose ps
```

## Local configuration boundary

`.env` is ignored by Git. The values in `.env.example` are local-only example values, not production credentials. The eventual Vite development proxy will inject the shared API key for local requests so the browser bundle does not contain it. That assessment-specific pattern is not production user authentication.

## Assessment maturity boundary

This project is being built for local validation with synthetic data. It will not claim production deployment, production-scale performance, customer-data validation, or real user authorization.

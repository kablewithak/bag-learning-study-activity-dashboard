# Backend Core Decisions

## Boundary

Routes own HTTP details. Pydantic v2 owns request and response validation. Repositories own parameterized PostgreSQL access. This keeps business rules out of UI code and SQL out of route handlers.

## Score validation

`score` uses `StrictInt`, so a JSON string such as `"85"` is rejected rather than silently coerced. Pydantic provides immediate `422` feedback, while the database `CHECK` constraint protects the same invariant if a future write path bypasses the API.

## Stable activity listing

The activity list retrieves `limit + 1` rows and exposes `has_more` without a total-count query. It orders by `created_at DESC, id DESC` so equal timestamps remain deterministic.

## Idempotency preparation

The backend accepts `X-Idempotency-Key`, hashes the canonical student/type/score intent, and uses PostgreSQL `UNIQUE(idempotency_key)` plus `ON CONFLICT DO NOTHING`. A replay with the same intent returns the original activity; a changed intent returns `409` without a new row.

## Current proof boundary

This slice is locally runnable and uses only deterministic synthetic data. The database-backed integration tests and frontend dashboard are still pending.

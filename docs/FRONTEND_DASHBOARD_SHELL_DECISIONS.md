# Frontend Dashboard Shell Decisions

## Boundary

The dashboard shell is intentionally narrow: `GET /groups/{group_id}/stats` is read through one typed API client, React Query owns server-state loading/retry/refetch behavior, and presentational components receive typed data only. UI components do not call `fetch` directly.

## API-key handling

The browser calls relative `/api` URLs. The Vite development proxy injects `X-API-Key` from the frontend container environment before forwarding requests to FastAPI. This avoids placing the assessment key in bundled browser code; it is still assessment-only local protection, not user authorization.

## Runtime response validation

The API client reads each response as `unknown`, maps non-success responses into `ApiClientError`, and validates the group, student, and trend shapes before returning typed data to React. This gives a deterministic failure state if the frontend/backend contract drifts.

## Query and retry policy

Dashboard reads retry once because a transient read failure is recoverable. The mutation policy is configured as `retry: false` globally because a future POST must preserve its idempotency-key semantics instead of generating a hidden automatic retry.

## Sorting and state integrity

Student sorting copies `students` before sorting. React Query cache data remains immutable, so UI ordering cannot silently corrupt the server-state cache. Total activities is the first sort field because it is non-null and unambiguous for every row.

## Deferred work

The add-activity form, mutation recovery flow, and Recharts trend visualization belong to the next slice. The current page makes that boundary visible rather than pretending the dashboard is complete.

# Activity Entry and Trend Decisions

## Scope

This slice completes the two remaining assessment-facing dashboard behaviors:

1. a user-entered activity write through the existing FastAPI idempotent-create boundary;
2. a visible, gap-free 14-day trend derived only from the group-statistics response.

It does not add new backend endpoints, auth modes, event queues, background work, realtime subscriptions, or third-party chart dependencies.

## Activity write boundary

The frontend calls:

```text
POST /api/students/{student_id}/activities
```

with a JSON payload matching the backend contract:

```json
{
  "type": "lesson_completed | quiz_attempted | note_added",
  "score": "integer 0..100 or null"
}
```

The Vite proxy injects the shared local API key server-side. The browser owns only the user-selected activity fields and the UUID-format idempotency key.

## Retained idempotency behavior

The form creates a request identity for a particular student and payload. It retains that identity after a recoverable failure.

- `Retry exact activity` resubmits the same student ID, typed payload, and idempotency key.
- Editing the student, type, or score represents a new intent and receives a fresh key.
- The form does not retry automatically. The user remains in control of a write that was not confirmed.
- A `409` is rendered as a conflict message rather than silently creating a second activity.

This matches the backend's database-enforced idempotency contract. A successful write may return `201`; a safe replay returns `200`.

## Score controls

The browser prevents obvious invalid states before sending a request:

- lesson/note activities always send `score: null`;
- quiz score is optional;
- supplied quiz scores must be digit-only, integral, and within 0–100.

The backend Pydantic validation and PostgreSQL CHECK constraint remain authoritative. Frontend validation improves feedback but does not replace server enforcement.

## Dashboard refresh

After a successful write, the form invalidates the `["group-stats", groupId]` React Query entry. The existing read contract then refreshes the table and trend from PostgreSQL. The client does not mutate local aggregate values optimistically.

That choice favors correctness and simple traceability over a speculative UI update.

## Trend visualization

The trend component uses the existing `activity_trend` API field.

- PostgreSQL has already guaranteed exactly 14 UTC date points with zero-count dates included.
- The chart uses no additional chart dependency; it is a compact, accessible DOM visualization with a text-derived `aria-label` and native hover tooltips.
- Zero counts remain visible as a small baseline mark rather than disappearing.
- The chart computes its scale from the received data and reports the peak count.

## Validation gates

The change is ready to land only after:

```text
backend pytest: pass
backend Ruff: pass
frontend lint: pass
frontend TypeScript check: pass
frontend production build: pass
```

Manual acceptance must also prove:

1. a valid lesson/note creates successfully;
2. a valid quiz with a score creates successfully;
3. an invalid score stays client-side;
4. a successful activity refreshes the table and trend;
5. a backend-stop submit exposes retry UI;
6. retry uses the preserved request and produces one physical PostgreSQL row;
7. the chart still renders exactly 14 day labels after a write.

## Non-claims

This is locally validated, synthetic-data validated assessment software. It is not production-ready user authentication, real-time analytics, audit-complete activity capture, or a general learning platform.

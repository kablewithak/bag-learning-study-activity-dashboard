# Demo Script

## 90-second assessment walkthrough

### 1. Problem and dashboard overview

“This is a Study Activity Dashboard built for a tutor or lecturer who needs to see which students are active, how they are performing on quizzes, and whether study activity is consistent over time.”

Open the seeded group dashboard.

Point out:

- Engineering Economics Study Group;
- five students;
- live PostgreSQL data label;
- sortable student activity table;
- 14-day activity trend.

### 2. Data-quality and statistics choices

“The dashboard is backed by PostgreSQL, not mock browser data. The group statistics query keeps inactive students visible and returns an exact 14-day UTC trend, including zero-activity days.”

Point to:

- zero-height or baseline trend days;
- activity totals;
- average quiz scores;
- last-active values.

### 3. Add an activity

Choose a student, select `Quiz attempted`, enter `88`, and submit.

Say:

“Activity creation goes through typed validation. Scores are allowed only for quizzes and must be whole numbers from 0 to 100.”

Point to the refreshed student total, quiz average, and current-day trend.

### 4. Retry safety

Explain without needing to repeat the full live failure test:

“Every create request has an idempotency key. If a submission fails because the backend is unavailable, the page preserves the exact request and exposes Retry exact activity. The backend creates the record once, replays the original result for the same request, and rejects a reused key with changed details.”

### 5. Close

“The system is locally validated with deterministic synthetic data. It is intentionally scoped to the assessment boundary, not presented as production authentication or a full learning-management platform.”

# Submission Checklist

## Code and repository

- [ ] `main` contains the merged final functional pull request.
- [ ] `git status` on `main` is clean.
- [ ] `.env` is untracked and never committed.
- [ ] `frontend/node_modules` and frontend build output are untracked.
- [ ] No temporary npm logs or extracted repair folders are staged.
- [ ] Final README, `NOTES.md`, and validation runbook are present.

## Validation

- [ ] Fresh-clone build completed.
- [ ] `docker compose exec backend pytest` passed.
- [ ] `docker compose exec backend ruff check .` passed.
- [ ] `docker compose exec frontend npm run lint` passed.
- [ ] `docker compose exec frontend npm run typecheck` passed.
- [ ] `docker compose exec frontend npm run build` passed.
- [ ] Frontend container stayed up.
- [ ] Dashboard opened on the documented seeded group route.
- [ ] 14-day trend showed explicit zero-activity days.
- [ ] Valid lesson and quiz creation refreshed the dashboard.
- [ ] Quiz score `101` was blocked.
- [ ] Backend-stop and Retry exact activity behavior was demonstrated.

## Submission material

- [ ] Capture one clean dashboard screenshot after fresh-clone validation.
- [ ] Keep the demo to about 90 seconds.
- [ ] State the maturity accurately: locally validated and synthetic-data validated.
- [ ] Do not claim deployment, customer-data use, or production readiness.
- [ ] Submit the repository link and any assessment-required notes.

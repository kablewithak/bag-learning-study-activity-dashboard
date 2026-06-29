# Clean-Clone Validation Runbook

This runbook verifies that the repository can be started and inspected from a fresh clone using only documented local prerequisites.

## Preconditions

- Docker Desktop with Docker Compose v2 is running.
- Git is available.
- Node.js 22+ is available if you need direct host frontend checks.
- You are signed in to GitHub or can clone the repository publicly.

## 1. Stop the existing project without deleting its data

From the existing repository root:

```powershell
docker compose stop
```

Do not run `docker compose down -v` in the existing working copy unless you intentionally want to reset its data.

## 2. Create a fresh clone beside the existing repository

From:

```text
C:\Users\kabom\Documents\Machine Learning\Machine Learning Workspace
```

run:

```powershell
Remove-Item -LiteralPath ".\bag-learning-study-activity-dashboard-clean-check" -Recurse -Force -ErrorAction SilentlyContinue

git clone https://github.com/kablewithak/bag-learning-study-activity-dashboard.git ".\bag-learning-study-activity-dashboard-clean-check"

Set-Location ".\bag-learning-study-activity-dashboard-clean-check"

git status

git --no-pager log -1 --oneline
```

Expected:

```text
On branch main
nothing to commit, working tree clean
```

## 3. Create the local environment file

```powershell
Copy-Item .env.example .env

Get-Content .\.env
```

Do not commit `.env`.

## 4. Build and start the fresh local stack

```powershell
docker compose up --build -d

Start-Sleep -Seconds 20

docker compose ps -a

docker compose logs frontend --tail 80
```

Expected service state:

```text
db         Up ... healthy
backend    Up ...
frontend   Up ...
```

## 5. Run the validation gate

```powershell
docker compose exec backend pytest

docker compose exec backend ruff check .

docker compose exec frontend npm run lint

docker compose exec frontend npm run typecheck

docker compose exec frontend npm run build
```

Expected backend evidence:

```text
7 passed
All checks passed!
```

## 6. Browser smoke check

Open:

```text
http://localhost:5173/groups/4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9
```

Confirm:

1. Engineering Economics Study Group appears.
2. The header says 5 students.
3. The 14-day trend chart renders 14 points.
4. The student table is visible.
5. A valid activity can be recorded.
6. A refresh updates the table and the current-day trend.
7. A quiz score of 101 is blocked in the browser.
8. Stopping the backend produces a visible error and retry action.

## 7. Record the clean-clone result

```powershell
git status

docker compose ps -a
```

Capture a final dashboard screenshot only after this fresh-clone verification.

## 8. Optional cleanup

The clean clone has its own Docker Compose project and fresh local database volume. When you are done with the clean clone:

```powershell
docker compose down -v

Set-Location ..

Remove-Item -LiteralPath ".\bag-learning-study-activity-dashboard-clean-check" -Recurse -Force
```

Then return to the original repository and restart it when needed:

```powershell
Set-Location ".\bag-learning-study-activity-dashboard"

docker compose start
```

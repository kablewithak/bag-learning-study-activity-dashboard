from __future__ import annotations

from fastapi import FastAPI

from app.api.routes.groups import router as groups_router
from app.api.routes.students import router as students_router
from app.db.pool import application_lifespan

app = FastAPI(
    title="Study Activity Dashboard API",
    version="0.1.0",
    description="Assessment-only API backed by PostgreSQL and deterministic synthetic data.",
    lifespan=application_lifespan,
)

app.include_router(groups_router)
app.include_router(students_router)

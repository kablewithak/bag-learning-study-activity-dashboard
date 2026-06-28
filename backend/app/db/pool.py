from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI

from app.core.config import get_settings


async def create_database_pool(database_url: str) -> asyncpg.Pool:
    """Create the bounded asyncpg pool used by repositories."""

    return await asyncpg.create_pool(
        dsn=database_url,
        min_size=1,
        max_size=5,
        command_timeout=10,
    )


@asynccontextmanager
async def application_lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.db_pool = await create_database_pool(settings.database_url)
    try:
        yield
    finally:
        await app.state.db_pool.close()

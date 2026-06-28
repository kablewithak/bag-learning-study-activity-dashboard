from __future__ import annotations

import secrets
from typing import Annotated

import asyncpg
from fastapi import Header, HTTPException, Request, status

from app.core.config import get_settings


async def require_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    """Reject missing or incorrect shared API keys before route execution."""

    expected_api_key = get_settings().api_key.get_secret_value()
    if x_api_key is None or not secrets.compare_digest(x_api_key, expected_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key.",
        )


def get_database_pool(request: Request) -> asyncpg.Pool:
    return request.app.state.db_pool

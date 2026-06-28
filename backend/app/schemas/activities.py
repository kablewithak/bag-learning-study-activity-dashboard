from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, StrictInt, model_validator


class ActivityType(StrEnum):
    LESSON_COMPLETED = "lesson_completed"
    QUIZ_ATTEMPTED = "quiz_attempted"
    NOTE_ADDED = "note_added"


class ActivityCreateRequest(BaseModel):
    """Client-controlled creation fields. IDs and timestamps stay server-owned."""

    model_config = ConfigDict(extra="forbid")

    type: ActivityType
    score: StrictInt | None = None

    @model_validator(mode="after")
    def validate_score_for_activity_type(self) -> ActivityCreateRequest:
        if self.type is not ActivityType.QUIZ_ATTEMPTED and self.score is not None:
            raise ValueError("score may only be provided when type is quiz_attempted")
        if self.score is not None and not 0 <= self.score <= 100:
            raise ValueError("score must be an integer from 0 to 100")
        return self


class ActivityResponse(BaseModel):
    id: UUID
    student_id: UUID
    type: ActivityType
    score: int | None
    created_at: datetime


class ActivityListResponse(BaseModel):
    items: list[ActivityResponse]
    limit: int
    offset: int
    has_more: bool

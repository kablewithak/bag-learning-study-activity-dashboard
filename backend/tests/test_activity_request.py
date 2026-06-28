from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.activities import ActivityCreateRequest, ActivityType


@pytest.mark.parametrize(
    "payload",
    [
        {"type": "lesson_completed", "score": 70},
        {"type": "note_added", "score": 0},
        {"type": "quiz_attempted", "score": -1},
        {"type": "quiz_attempted", "score": 101},
        {"type": "quiz_attempted", "score": "85"},
    ],
)
def test_create_activity_rejects_invalid_score_combinations(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        ActivityCreateRequest.model_validate(payload)


def test_create_activity_accepts_quiz_without_score() -> None:
    payload = ActivityCreateRequest.model_validate({"type": "quiz_attempted", "score": None})

    assert payload.type is ActivityType.QUIZ_ATTEMPTED
    assert payload.score is None

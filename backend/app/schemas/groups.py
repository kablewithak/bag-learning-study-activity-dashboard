from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class GroupSummary(BaseModel):
    id: UUID
    name: str


class StudentSummary(BaseModel):
    id: UUID
    name: str


class GroupStudentsResponse(BaseModel):
    group: GroupSummary
    students: list[StudentSummary]


class GroupStatsSummary(BaseModel):
    id: UUID
    name: str
    student_count: int


class StudentActivityStats(BaseModel):
    student_id: UUID
    student_name: str
    total_activities: int
    lesson_completed_count: int
    quiz_attempted_count: int
    note_added_count: int
    average_quiz_score: float | None
    last_active_at: datetime | None


class ActivityTrendPoint(BaseModel):
    day: date
    activity_count: int


class GroupStatsResponse(BaseModel):
    group: GroupStatsSummary
    students: list[StudentActivityStats]
    activity_trend: list[ActivityTrendPoint]

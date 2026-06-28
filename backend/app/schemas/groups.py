from __future__ import annotations

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

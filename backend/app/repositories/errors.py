from __future__ import annotations


class StudentNotFoundError(Exception):
    """The requested student does not exist."""


class GroupNotFoundError(Exception):
    """The requested group does not exist."""


class IdempotencyConflictError(Exception):
    """A key was reused with a different canonical request payload."""


class PersistenceStateError(Exception):
    """The database returned an unexpected persistence state."""

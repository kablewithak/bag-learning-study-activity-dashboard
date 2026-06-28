CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE activity_type AS ENUM (
    'lesson_completed',
    'quiz_attempted',
    'note_added'
);

CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    type activity_type NOT NULL,
    score SMALLINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idempotency_key UUID NOT NULL,
    request_fingerprint TEXT NOT NULL CHECK (char_length(request_fingerprint) = 64),
    CONSTRAINT activities_score_matches_type CHECK (
        (
            type = 'quiz_attempted'
            AND (score IS NULL OR score BETWEEN 0 AND 100)
        )
        OR (
            type IN ('lesson_completed', 'note_added')
            AND score IS NULL
        )
    ),
    CONSTRAINT activities_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX students_group_id_idx
    ON students(group_id);

CREATE INDEX activities_student_created_at_id_idx
    ON activities(student_id, created_at DESC, id DESC);

CREATE INDEX activities_created_at_idx
    ON activities(created_at DESC);

INSERT INTO study_groups (id, name)
VALUES (
    '4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9',
    'Engineering Economics Study Group'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, group_id, name)
VALUES
    ('f03b9d4e-bf26-4b83-a0a4-c8f72d951b01', '4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9', 'Aisha Patel'),
    ('a7b66ea6-3f56-418d-8923-78af95b15b02', '4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9', 'Sibusiso Ndlovu'),
    ('0d2ee849-95fd-498e-8741-5a09e3940f03', '4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9', 'Nandi Khumalo'),
    ('b043612d-a9f1-44e1-adf0-4fae9cb97404', '4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9', 'Joshua Maseko'),
    ('918c73ab-a107-4779-aac7-0cac3963aa05', '4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9', 'Lerato Molefe')
ON CONFLICT (id) DO NOTHING;

WITH seed_activity AS (
    SELECT
        activity_number,
        (ARRAY[
            'f03b9d4e-bf26-4b83-a0a4-c8f72d951b01'::UUID,
            'a7b66ea6-3f56-418d-8923-78af95b15b02'::UUID,
            '0d2ee849-95fd-498e-8741-5a09e3940f03'::UUID,
            'b043612d-a9f1-44e1-adf0-4fae9cb97404'::UUID,
            '918c73ab-a107-4779-aac7-0cac3963aa05'::UUID
        ])[((activity_number - 1) % 5) + 1] AS student_id,
        (ARRAY[0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13])[((activity_number - 1) % 12) + 1] AS day_offset,
        CASE
            WHEN activity_number % 3 = 0 THEN 'quiz_attempted'::activity_type
            WHEN activity_number % 3 = 1 THEN 'lesson_completed'::activity_type
            ELSE 'note_added'::activity_type
        END AS type
    FROM generate_series(1, 56) AS activity_number
)
INSERT INTO activities (
    id,
    student_id,
    type,
    score,
    created_at,
    idempotency_key,
    request_fingerprint
)
SELECT
    ('00000000-0000-4000-8000-' || lpad(activity_number::text, 12, '0'))::UUID,
    student_id,
    type,
    CASE
        WHEN type = 'quiz_attempted' AND activity_number % 4 <> 0
            THEN 55 + ((activity_number * 7) % 46)
        ELSE NULL
    END AS score,
    (
        date_trunc('day', NOW() AT TIME ZONE 'UTC')
        - INTERVAL '13 days'
        + (day_offset * INTERVAL '1 day')
        + ((8 + (activity_number % 9)) * INTERVAL '1 hour')
        + ((activity_number * 7 % 60) * INTERVAL '1 minute')
    ) AT TIME ZONE 'UTC' AS created_at,
    ('00000000-0000-4000-8000-' || lpad(activity_number::text, 12, '0'))::UUID,
    encode(digest(format('seed:%s:%s:%s', student_id, type, activity_number), 'sha256'), 'hex')
FROM seed_activity
ON CONFLICT (id) DO NOTHING;

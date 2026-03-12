-- Backfill activity logs for existing promises
INSERT INTO office_activity_log (
    office_holder_id,
    activity_type,
    title,
    description,
    reference_id,
    reference_type,
    created_by,
    created_at
)
SELECT 
    p.office_holder_id,
    'promise_created',
    'Made a New Promise', 
    'Promised: "' || p.title || '"',
    p.id,
    'promise',
    oh.user_id, -- Assuming office_holder.user_id created it (best guess for backfill)
    p.created_at
FROM office_promises p
JOIN office_holders oh ON p.office_holder_id = oh.id
WHERE NOT EXISTS (
    SELECT 1 FROM office_activity_log al 
    WHERE al.reference_id = p.id AND al.activity_type = 'promise_created'
);

-- Backfill activity logs for answered questions
INSERT INTO office_activity_log (
    office_holder_id,
    activity_type,
    title,
    description,
    reference_id,
    reference_type,
    created_by,
    created_at
)
SELECT 
    q.office_holder_id,
    'question_answered',
    'Answered a Question',
    'Answered: "' || SUBSTRING(q.question, 1, 60) || (CASE WHEN LENGTH(q.question) > 60 THEN '...' ELSE '' END) || '"',
    q.id,
    'question',
    q.answered_by, -- Use the actual user who answered
    q.answered_at
FROM office_questions q
WHERE q.answered_at IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM office_activity_log al 
    WHERE al.reference_id = q.id AND al.activity_type = 'question_answered'
);

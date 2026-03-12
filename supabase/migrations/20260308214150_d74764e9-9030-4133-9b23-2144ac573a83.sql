
INSERT INTO community_moderators (community_id, user_id, role)
VALUES ('e8856eeb-1169-4f7c-b7e8-eda0dbf3376d', 'ba07274d-aa96-4fc1-bc4e-5e5c9b379259', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO community_members (community_id, user_id)
VALUES ('e8856eeb-1169-4f7c-b7e8-eda0dbf3376d', 'ba07274d-aa96-4fc1-bc4e-5e5c9b379259')
ON CONFLICT DO NOTHING;

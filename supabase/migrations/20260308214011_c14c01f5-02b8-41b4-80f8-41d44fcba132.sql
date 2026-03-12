
-- Unlock channels first so cascade delete works
UPDATE channels SET is_locked = false
WHERE community_id IN (
  '704c7a93-c216-410c-8a2d-4a2e586d9129',
  'c55f3204-e2e4-481b-8dc8-2d22afde1543',
  '10aa3b31-b37d-495f-a449-c1f22b58afa1',
  '82ca785b-9b17-4692-ab8f-729d07ef00bf'
);

-- Now delete test communities
DELETE FROM communities WHERE id IN (
  '704c7a93-c216-410c-8a2d-4a2e586d9129',
  'c55f3204-e2e4-481b-8dc8-2d22afde1543',
  '10aa3b31-b37d-495f-a449-c1f22b58afa1',
  '82ca785b-9b17-4692-ab8f-729d07ef00bf'
);

-- Add admin role for Art of Business
INSERT INTO community_moderators (community_id, user_id, role)
VALUES ('67fcdd99-f047-4835-be30-b60e0b58ab69', '66033a0b-3540-4ccd-988e-4ddae3057f8c', 'admin')
ON CONFLICT DO NOTHING;

-- Add admin role for Wanaiq
INSERT INTO community_moderators (community_id, user_id, role)
VALUES ('d1d85aa0-7bba-4a46-a8bf-4c79a6487839', '66033a0b-3540-4ccd-988e-4ddae3057f8c', 'admin')
ON CONFLICT DO NOTHING;

-- Ensure membership for Art of Business
INSERT INTO community_members (community_id, user_id)
VALUES ('67fcdd99-f047-4835-be30-b60e0b58ab69', '66033a0b-3540-4ccd-988e-4ddae3057f8c')
ON CONFLICT DO NOTHING;

-- Ensure membership for Wanaiq
INSERT INTO community_members (community_id, user_id)
VALUES ('d1d85aa0-7bba-4a46-a8bf-4c79a6487839', '66033a0b-3540-4ccd-988e-4ddae3057f8c')
ON CONFLICT DO NOTHING;

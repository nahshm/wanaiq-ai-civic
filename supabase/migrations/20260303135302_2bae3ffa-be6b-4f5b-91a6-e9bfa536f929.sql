
-- Part 2: Expand user_persona enum with new values
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'youth_leader';
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'ngo_worker';
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'journalist';
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'business_owner';

-- Part 4: Add FK from leaderboard_scores to profiles for PostgREST join support
ALTER TABLE leaderboard_scores
ADD CONSTRAINT leaderboard_scores_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id);

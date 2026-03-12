
-- Enhance your existing profiles table
ALTER TABLE profiles
-- Basic Identity
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,

-- Location Context
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS constituency TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS coordinates JSONB, -- {lat, lng}

-- Civic Identity
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'citizen', 
  -- Options: 'citizen', 'youth_leader', 'community_organizer', 
  --          'journalist', 'official', 'ngo_worker', 'business_owner'
ADD COLUMN IF NOT EXISTS verified_role BOOLEAN DEFAULT false,

-- Interests & Preferences
ADD COLUMN IF NOT EXISTS interests TEXT[], 
  -- e.g., ['water', 'roads', 'education', 'health', 'youth_employment']
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB,

-- Civic Engagement Level
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expertise_areas TEXT[],

-- Activity Tracking
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_contributions INTEGER DEFAULT 0,

-- Metadata
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_county ON profiles(county);
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);


-- Create materialized view for user activity context
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_context AS
SELECT 
  u.id as user_id,
  -- Issue reporting history
  COUNT(DISTINCT i.id) FILTER (WHERE i.created_at > NOW() - INTERVAL '30 days') as issues_reported_30d,
  ARRAY_AGG(DISTINCT i.issue_type) FILTER (WHERE i.issue_type IS NOT NULL) as issue_types_reported,
  
  -- Promise tracking activity
  COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > NOW() - INTERVAL '30 days') as promises_tracked_30d,
  
  -- Community participation
  COUNT(DISTINCT post.id) FILTER (WHERE post.created_at > NOW() - INTERVAL '30 days') as posts_made_30d,
  COUNT(DISTINCT c.id) FILTER (WHERE c.created_at > NOW() - INTERVAL '30 days') as comments_made_30d,
  
  -- Following patterns
  ARRAY_AGG(DISTINCT pol.name) FILTER (WHERE pol.name IS NOT NULL) as politicians_following,
  
  -- Most active topics
  MODE() WITHIN GROUP (ORDER BY post.category) as most_active_category

FROM auth.users u
LEFT JOIN civic_issues i ON i.user_id = u.id
LEFT JOIN promise_votes pv ON pv.user_id = u.id
LEFT JOIN promises p ON p.id = pv.promise_id
LEFT JOIN posts post ON post.user_id = u.id
LEFT JOIN comments c ON c.user_id = u.id
LEFT JOIN user_follows uf ON uf.follower_id = u.id
LEFT JOIN politicians pol ON pol.id = uf.following_id
GROUP BY u.id;

-- Refresh strategy (run daily via cron job)
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_context(user_id);


-- Cache compiled user context for fast retrieval
CREATE TABLE IF NOT EXISTS user_context_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  context_json JSONB NOT NULL,
  compiled_prompt TEXT, -- Pre-compiled system prompt section (Optional in original SQL but good to have)
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to invalidate cache when profile changes
CREATE OR REPLACE FUNCTION invalidate_user_context_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_context_cache WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_update ON profiles;
CREATE TRIGGER on_profile_update
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION invalidate_user_context_cache();

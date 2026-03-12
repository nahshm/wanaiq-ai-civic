-- Migration: Enhanced Civic Action Features
-- Date: 2025-11-20
-- Adds community support, analytics, and achievements

-- 1. Community Support Features
ALTER TABLE civic_actions 
ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS civic_action_supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES civic_actions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(action_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_supporters_action ON civic_action_supporters(action_id);
CREATE INDEX IF NOT EXISTS idx_supporters_user ON civic_action_supporters(user_id);

ALTER TABLE civic_action_supporters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supporters"
ON civic_action_supporters FOR SELECT USING (true);

CREATE POLICY "Users can support actions"
ON civic_action_supporters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsupport actions"
ON civic_action_supporters FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update support_count
CREATE OR REPLACE FUNCTION update_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE civic_actions 
    SET support_count = support_count + 1 
    WHERE id = NEW.action_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE civic_actions 
    SET support_count = GREATEST(support_count - 1, 0)
    WHERE id = OLD.action_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_action_support_count
AFTER INSERT OR DELETE ON civic_action_supporters
FOR EACH ROW EXECUTE FUNCTION update_support_count();

-- 2. Analytics Views
CREATE OR REPLACE VIEW civic_action_analytics AS
SELECT 
  ward_id,
  constituency_id,
  county_id,
  category,
  status,
  COUNT(*) as issue_count,
  AVG(
    CASE 
      WHEN status = 'resolved' AND updated_at > created_at
      THEN EXTRACT(EPOCH FROM (updated_at - created_at))/86400
      ELSE NULL
    END
  ) as avg_days_to_resolve
FROM civic_actions
GROUP BY ward_id, constituency_id, county_id, category, status;

-- 3. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT,
  achievement_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their achievements"
ON user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Function to award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- First Issue
  IF (SELECT COUNT(*) FROM civic_actions WHERE user_id = NEW.user_id) = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (NEW.user_id, 'first_issue', 'Community Guardian', 'Reported your first civic issue')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Issue Hunter (5 issues)
  IF (SELECT COUNT(*) FROM civic_actions WHERE user_id = NEW.user_id) = 5 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (NEW.user_id, 'issue_hunter', 'Issue Hunter', 'Reported 5 civic issues')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Community Champion (10 issues)
  IF (SELECT COUNT(*) FROM civic_actions WHERE user_id = NEW.user_id) = 10 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (NEW.user_id, 'community_champion', 'Community Champion', 'Reported 10 civic issues')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_achievements_on_action
AFTER INSERT ON civic_actions
FOR EACH ROW EXECUTE FUNCTION check_and_award_achievements();

-- 4. Official Portal Features
ALTER TABLE civic_actions
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES officials(id);

CREATE TABLE IF NOT EXISTS official_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES civic_actions(id) ON DELETE CASCADE,
  official_id UUID REFERENCES officials(id),
  response_text TEXT,
  new_status TEXT,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE official_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view responses"
ON official_responses FOR SELECT USING (true);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_actions_status ON civic_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_category ON civic_actions(category);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON civic_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_support_count ON civic_actions(support_count DESC);
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON civic_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_action_updates_action_id ON civic_action_updates(action_id);

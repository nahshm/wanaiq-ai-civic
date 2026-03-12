-- Migration: Add verification, sentiment, and UGC features
-- Date: 2025-12-04
-- Description: Implements verification system, sentiment tracking, civic projects, campaign promises, and enhanced user profiles

-- ============================================================
-- 1. VERIFICATION SYSTEM TABLES
-- ============================================================

-- Main verifications table
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'project', 'promise')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('VERIFIED', 'DISPUTED', 'DEBUNKED', 'PENDING')),
  truth_score INTEGER DEFAULT 50 CHECK (truth_score >= 0 AND truth_score <= 100),
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, content_type)
);

-- Verification votes breakdown
CREATE TABLE IF NOT EXISTS public.verification_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('true', 'misleading', 'outdated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(verification_id, user_id)
);

-- Create indexes for verification lookups
CREATE INDEX IF NOT EXISTS idx_verifications_content ON public.verifications(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_verification_votes_verification ON public.verification_votes(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_votes_user ON public.verification_votes(user_id);

-- ============================================================
-- 2. SENTIMENT TRACKING TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sentiment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'project', 'promise')),
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  total_count INTEGER GENERATED ALWAYS AS (positive_count + neutral_count + negative_count) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, content_type)
);

-- Sentiment votes
CREATE TABLE IF NOT EXISTS public.sentiment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentiment_id UUID NOT NULL REFERENCES public.sentiment_scores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentiment_type VARCHAR(20) NOT NULL CHECK (sentiment_type IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sentiment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_scores_content ON public.sentiment_scores(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_sentiment ON public.sentiment_votes(sentiment_id);

-- ============================================================
-- 3. CIVIC PROJECTS (USER-GENERATED)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.civic_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'STALLED', 'ACTIVE', 'COMPLETED')),
  budget VARCHAR(100),
  location VARCHAR(200),
  image_url TEXT,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ward_id UUID REFERENCES public.wards(id),
  constituency_id UUID REFERENCES public.constituencies(id),
  county_id UUID REFERENCES public.counties(id),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_id UUID REFERENCES public.verifications(id),
  sentiment_id UUID REFERENCES public.sentiment_scores(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_civic_projects_submitted_by ON public.civic_projects(submitted_by);
CREATE INDEX IF NOT EXISTS idx_civic_projects_location ON public.civic_projects(ward_id, constituency_id, county_id);
CREATE INDEX IF NOT EXISTS idx_civic_projects_status ON public.civic_projects(status);

-- ============================================================
-- 4. CAMPAIGN PROMISES (USER-GENERATED)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.campaign_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  politician_id UUID NOT NULL REFERENCES public.officials(id) ON DELETE CASCADE,
  politician_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('KEPT', 'BROKEN', 'IN_PROGRESS', 'COMPROMISED')),
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_id UUID REFERENCES public.verifications(id),
  sentiment_id UUID REFERENCES public.sentiment_scores(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_promises_politician ON public.campaign_promises(politician_id);
CREATE INDEX IF NOT EXISTS idx_campaign_promises_submitted_by ON public.campaign_promises(submitted_by);
CREATE INDEX IF NOT EXISTS idx_campaign_promises_status ON public.campaign_promises(status);

-- ============================================================
-- 5. USER ACTIONS TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'JOIN_COMMUNITY', 'VERIFY_POST', 'VOTE_POLL', 'SUBMIT_REPORT', 
    'ATTEND_EVENT', 'CREATE_PROJECT', 'CREATE_PROMISE', 'CAST_VERIFICATION_VOTE'
  )),
  description TEXT,
  target_id UUID,
  target_name VARCHAR(255),
  target_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user ON public.user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON public.user_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON public.user_actions(action_type);

-- ============================================================
-- 6. ENHANCE USER PROFILES
-- ============================================================

-- Add profile fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'title') THEN
    ALTER TABLE public.profiles ADD COLUMN title VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'join_date') THEN
    ALTER TABLE public.profiles ADD COLUMN join_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================================
-- 7. FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to update verification truth score
CREATE OR REPLACE FUNCTION update_verification_truth_score()
RETURNS TRIGGER AS $$
BEGIN
  WITH vote_counts AS (
    SELECT 
      verification_id,
      SUM(CASE WHEN vote_type = 'true' THEN 1 ELSE 0 END) AS true_count,
      SUM(CASE WHEN vote_type = 'misleading' THEN 1 ELSE 0 END) AS misleading_count,
      SUM(CASE WHEN vote_type = 'outdated' THEN 1 ELSE 0 END) AS outdated_count,
      COUNT(*) AS total
    FROM public.verification_votes
    WHERE verification_id = NEW.verification_id
    GROUP BY verification_id
  )
  UPDATE public.verifications v
  SET 
    truth_score = LEAST(100, GREATEST(0, ROUND((vc.true_count::NUMERIC / NULLIF(vc.total, 0)) * 100))),
    total_votes = vc.total,
    status = CASE 
      WHEN (vc.true_count::NUMERIC / NULLIF(vc.total, 0)) > 0.8 THEN 'VERIFIED'
      WHEN (vc.true_count::NUMERIC / NULLIF(vc.total, 0)) < 0.4 THEN 'DISPUTED'
      WHEN vc.misleading_count > vc.true_count THEN 'DISPUTED'
      ELSE v.status
    END,
    updated_at = NOW()
  FROM vote_counts vc
  WHERE v.id = vc.verification_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for verification score updates
DROP TRIGGER IF EXISTS trigger_update_verification_score ON public.verification_votes;
CREATE TRIGGER trigger_update_verification_score
  AFTER INSERT OR UPDATE OR DELETE ON public.verification_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_truth_score();

-- Function to log user actions automatically
CREATE OR REPLACE FUNCTION log_user_action_from_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_actions (user_id, action_type, description, target_id, target_name, target_type)
  VALUES (
    NEW.submitted_by,
    'CREATE_PROJECT',
    'Reported civic project: ' || NEW.title,
    NEW.id,
    NEW.title,
    'civic_project'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_project_creation ON public.civic_projects;
CREATE TRIGGER trigger_log_project_creation
  AFTER INSERT ON public.civic_projects
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action_from_project();

-- Function to log promise creation
CREATE OR REPLACE FUNCTION log_user_action_from_promise()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_actions (user_id, action_type, description, target_id, target_name, target_type)
  VALUES (
    NEW.submitted_by,
    'CREATE_PROMISE',
    'Logged campaign promise: ' || NEW.title,
    NEW.id,
    NEW.title,
    'campaign_promise'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_promise_creation ON public.campaign_promises;
CREATE TRIGGER trigger_log_promise_creation
  AFTER INSERT ON public.campaign_promises
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action_from_promise();

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Verifications are viewable by everyone" ON public.verifications;
DROP POLICY IF EXISTS "Users can cast verification votes" ON public.verification_votes;
DROP POLICY IF EXISTS "Users can view verification votes" ON public.verification_votes;
DROP POLICY IF EXISTS "Users can update their own verification votes" ON public.verification_votes;
DROP POLICY IF EXISTS "Sentiment scores are viewable by everyone" ON public.sentiment_scores;
DROP POLICY IF EXISTS "Users can cast sentiment votes" ON public.sentiment_votes;
DROP POLICY IF EXISTS "Sentiment votes are viewable by everyone" ON public.sentiment_votes;
DROP POLICY IF EXISTS "Civic projects are viewable by everyone" ON public.civic_projects;
DROP POLICY IF EXISTS "Authenticated users can create civic projects" ON public.civic_projects;
DROP POLICY IF EXISTS "Users can update their own civic projects" ON public.civic_projects;
DROP POLICY IF EXISTS "Campaign promises are viewable by everyone" ON public.campaign_promises;
DROP POLICY IF EXISTS "Authenticated users can create campaign promises" ON public.campaign_promises;
DROP POLICY IF EXISTS "Users can update their own campaign promises" ON public.campaign_promises;
DROP POLICY IF EXISTS "Users can view their own actions" ON public.user_actions;
DROP POLICY IF EXISTS "System can insert user actions" ON public.user_actions;

-- Verifications: Everyone can read
CREATE POLICY "Verifications are viewable by everyone" 
  ON public.verifications FOR SELECT 
  USING (true);

-- Verification votes: Anyone authenticated can vote
CREATE POLICY "Users can cast verification votes" 
  ON public.verification_votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view verification votes" 
  ON public.verification_votes FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own verification votes" 
  ON public.verification_votes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Sentiment: Everyone can read
CREATE POLICY "Sentiment scores are viewable by everyone" 
  ON public.sentiment_scores FOR SELECT 
  USING (true);

CREATE POLICY "Users can cast sentiment votes" 
  ON public.sentiment_votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sentiment votes are viewable by everyone" 
  ON public.sentiment_votes FOR SELECT 
  USING (true);

-- Civic Projects: Everyone can read, authenticated users can create
CREATE POLICY "Civic projects are viewable by everyone" 
  ON public.civic_projects FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create civic projects" 
  ON public.civic_projects FOR INSERT 
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own civic projects" 
  ON public.civic_projects FOR UPDATE 
  USING (auth.uid() = submitted_by);

-- Campaign Promises: Everyone can read, authenticated users can create
CREATE POLICY "Campaign promises are viewable by everyone" 
  ON public.campaign_promises FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create campaign promises" 
  ON public.campaign_promises FOR INSERT 
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own campaign promises" 
  ON public.campaign_promises FOR UPDATE 
  USING (auth.uid() = submitted_by);

-- User Actions: Users can read their own actions
CREATE POLICY "Users can view their own actions" 
  ON public.user_actions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user actions" 
  ON public.user_actions FOR INSERT 
  WITH CHECK (true);

-- ============================================================
-- 9. SEED INITIAL DATA
-- ============================================================

-- Create verification entries for existing posts (optional, can be done async)
-- This will be handled by application logic

COMMENT ON TABLE public.verifications IS 'Stores community verification data for posts, comments, projects, and promises';
COMMENT ON TABLE public.verification_votes IS 'Individual user votes on verification accuracy';
COMMENT ON TABLE public.sentiment_scores IS 'Aggregated sentiment scores for content';
COMMENT ON TABLE public.civic_projects IS 'User-reported civic infrastructure projects';
COMMENT ON TABLE public.campaign_promises IS 'User-tracked political campaign promises';
COMMENT ON TABLE public.user_actions IS 'Log of user civic actions for activity timeline';

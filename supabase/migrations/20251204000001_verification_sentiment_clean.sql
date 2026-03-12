-- Migration: Verification & Sentiment System (Clean Integration)
-- Date: 2025-12-04
-- Description: Adds verification voting, sentiment tracking, and campaign promises
--              Integrates cleanly with existing user_actions and government_projects

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
-- 3. CAMPAIGN PROMISES (USER-GENERATED)
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
-- 4. EXTEND EXISTING TABLES
-- ============================================================

-- Add verification/sentiment to existing government_projects
ALTER TABLE public.government_projects 
ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES public.verifications(id),
ADD COLUMN IF NOT EXISTS sentiment_id UUID REFERENCES public.sentiment_scores(id);

-- Add verification/sentiment to posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES public.verifications(id),
ADD COLUMN IF NOT EXISTS sentiment_id UUID REFERENCES public.sentiment_scores(id);

-- Add verification/sentiment to comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES public.verifications(id),
ADD COLUMN IF NOT EXISTS sentiment_id UUID REFERENCES public.sentiment_scores(id);

-- Enhance user profiles (check if fields exist first)
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
-- 5. FUNCTIONS AND TRIGGERS
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
    WHERE verification_id = COALESCE(NEW.verification_id, OLD.verification_id)
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for verification score updates
DROP TRIGGER IF EXISTS trigger_update_verification_score ON public.verification_votes;
CREATE TRIGGER trigger_update_verification_score
  AFTER INSERT OR UPDATE OR DELETE ON public.verification_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_truth_score();

-- Function to update sentiment counts
CREATE OR REPLACE FUNCTION update_sentiment_counts()
RETURNS TRIGGER AS $$
BEGIN
  WITH sentiment_counts AS (
    SELECT 
      sentiment_id,
      SUM(CASE WHEN sentiment_type = 'positive' THEN 1 ELSE 0 END) AS pos_count,
      SUM(CASE WHEN sentiment_type = 'neutral' THEN 1 ELSE 0 END) AS neu_count,
      SUM(CASE WHEN sentiment_type = 'negative' THEN 1 ELSE 0 END) AS neg_count
    FROM public.sentiment_votes
    WHERE sentiment_id = COALESCE(NEW.sentiment_id, OLD.sentiment_id)
    GROUP BY sentiment_id
  )
  UPDATE public.sentiment_scores s
  SET 
    positive_count = sc.pos_count,
    neutral_count = sc.neu_count,
    negative_count = sc.neg_count,
    updated_at = NOW()
  FROM sentiment_counts sc
  WHERE s.id = sc.sentiment_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for sentiment count updates
DROP TRIGGER IF EXISTS trigger_update_sentiment_counts ON public.sentiment_votes;
CREATE TRIGGER trigger_update_sentiment_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.sentiment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_sentiment_counts();

-- Function to log promise creation to existing user_actions
CREATE OR REPLACE FUNCTION log_promise_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id, metadata)
  VALUES (
    NEW.submitted_by,
    'promise_logged',
    5,
    'promise',
    NEW.id,
    jsonb_build_object(
      'title', NEW.title,
      'politician_id', NEW.politician_id,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_promise_creation ON public.campaign_promises;
CREATE TRIGGER trigger_log_promise_creation
  AFTER INSERT ON public.campaign_promises
  FOR EACH ROW
  EXECUTE FUNCTION log_promise_creation();

-- Function to log verification votes to existing user_actions
CREATE OR REPLACE FUNCTION log_verification_vote()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id,
    'verification_vote_cast',
    2,
    'verification',
    NEW.verification_id,
    jsonb_build_object('vote_type', NEW.vote_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_verification_vote ON public.verification_votes;
CREATE TRIGGER trigger_log_verification_vote
  AFTER INSERT ON public.verification_votes
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_vote();

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_promises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Verifications are viewable by everyone" ON public.verifications;
DROP POLICY IF EXISTS "Users can cast verification votes" ON public.verification_votes;
DROP POLICY IF EXISTS "Users can view verification votes" ON public.verification_votes;
DROP POLICY IF EXISTS "Users can update their own verification votes" ON public.verification_votes;
DROP POLICY IF EXISTS "Sentiment scores are viewable by everyone" ON public.sentiment_scores;
DROP POLICY IF EXISTS "Users can cast sentiment votes" ON public.sentiment_votes;
DROP POLICY IF EXISTS "Sentiment votes are viewable by everyone" ON public.sentiment_votes;
DROP POLICY IF EXISTS "Campaign promises are viewable by everyone" ON public.campaign_promises;
DROP POLICY IF EXISTS "Authenticated users can create campaign promises" ON public.campaign_promises;
DROP POLICY IF EXISTS "Users can update their own campaign promises" ON public.campaign_promises;

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

-- ============================================================
-- 7. COMMENTS
-- ============================================================

COMMENT ON TABLE public.verifications IS 'Community-driven verification system for posts, comments, projects, and promises';
COMMENT ON TABLE public.verification_votes IS 'Individual user votes on content accuracy';
COMMENT ON TABLE public.sentiment_scores IS 'Aggregated sentiment scores for content';
COMMENT ON TABLE public.campaign_promises IS 'User-tracked political campaign promises';

COMMENT ON COLUMN public.government_projects.verification_id IS 'Links to community verification data';
COMMENT ON COLUMN public.government_projects.sentiment_id IS 'Links to community sentiment tracking';
COMMENT ON COLUMN public.posts.verification_id IS 'Links to community verification data';
COMMENT ON COLUMN public.posts.sentiment_id IS 'Links to community sentiment tracking';

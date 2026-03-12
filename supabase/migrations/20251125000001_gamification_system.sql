-- Migration: Gamification System
-- Description: Quests, Badges, Leaderboards, Challenges, and Skill Endorsements

-- ============================================
-- 1. QUESTS SYSTEM
-- ============================================

-- Quest Templates/Library
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('reporting', 'attendance', 'engagement', 'content', 'learning')),
    points INTEGER NOT NULL DEFAULT 10,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('photo', 'social_proof', 'official', 'automatic')),
    requirements JSONB DEFAULT '{}', -- Specific requirements (e.g., min photos, GPS accuracy)
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
    is_active BOOLEAN DEFAULT TRUE,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Quest Progress
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'pending_verification', 'completed', 'rejected')) DEFAULT 'active',
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    evidence JSONB DEFAULT '{}', -- Photos, GPS, links, etc.
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_user_quests_user_id ON public.user_quests(user_id);
CREATE INDEX idx_user_quests_status ON public.user_quests(status);

-- ============================================
-- 2. BADGES SYSTEM
-- ============================================

-- Badge Definitions
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    category TEXT NOT NULL CHECK (category IN ('fact_checker', 'community_reporter', 'policy_analyst', 'voting_champion', 'civic_educator')),
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
    requirements JSONB NOT NULL, -- { "action": "fact_check", "count": 5 }
    points_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges (Earned)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- Progress toward next tier
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_awarded ON public.user_badges(awarded_at DESC);

-- ============================================
-- 3. LEADERBOARDS
-- ============================================

-- Leaderboard Scores (Materialized View / Cache)
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_type TEXT CHECK (location_type IN ('ward', 'constituency', 'county', 'national')),
    location_value TEXT,
    period TEXT NOT NULL CHECK (period IN ('all_time', 'monthly', 'weekly')),
    total_points INTEGER DEFAULT 0,
    rank INTEGER,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, location_type, location_value, period)
);

CREATE INDEX idx_leaderboard_location ON public.leaderboard_scores(location_type, location_value, period);
CREATE INDEX idx_leaderboard_rank ON public.leaderboard_scores(period, rank);

-- ============================================
-- 4. CHALLENGES SYSTEM
-- ============================================

-- Challenge Definitions
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('photo_contest', 'report_challenge', 'fact_check_marathon', 'budget_analysis')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    voting_end_date TIMESTAMPTZ, -- 2 days after end_date typically
    rules JSONB DEFAULT '{}',
    reward_description TEXT,
    reward_points INTEGER DEFAULT 100,
    status TEXT CHECK (status IN ('upcoming', 'active', 'voting', 'completed')) DEFAULT 'upcoming',
    banner_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Submissions
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission JSONB NOT NULL, -- Content, photos, analysis, etc.
    votes INTEGER DEFAULT 0,
    rank INTEGER,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'winner')) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_challenge_submissions_challenge ON public.challenge_submissions(challenge_id);
CREATE INDEX idx_challenge_submissions_votes ON public.challenge_submissions(votes DESC);

-- Challenge Votes
CREATE TABLE IF NOT EXISTS public.challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- ============================================
-- 5. SKILL ENDORSEMENTS
-- ============================================

-- Skill Definitions
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN ('budget_analysis', 'community_organizing', 'legal_knowledge', 'policy_research', 'media_relations', 'project_management')),
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Skills (Claims)
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    endorsement_count INTEGER DEFAULT 0,
    credibility_score DECIMAL(5,2) DEFAULT 0.0, -- Weighted score
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Skill Endorsements
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_skill_id UUID NOT NULL REFERENCES public.user_skills(id) ON DELETE CASCADE,
    endorsed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(3,1) DEFAULT 1.0, -- 1.0 regular, 2.0 expert, 3.0 official
    endorsement_note TEXT,
    endorsed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_skill_id, endorsed_by)
);

CREATE INDEX idx_skill_endorsements_user ON public.skill_endorsements(endorsed_by);

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update quest progress
CREATE OR REPLACE FUNCTION public.complete_quest()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Award points
        INSERT INTO public.user_actions (user_id, action_type, action_value, entity_type, entity_id)
        SELECT NEW.user_id, 'quest_completed', q.points, 'quest', NEW.quest_id
        FROM public.quests q
        WHERE q.id = NEW.quest_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_quest_complete ON public.user_quests;
CREATE TRIGGER on_quest_complete
    AFTER UPDATE OF status ON public.user_quests
    FOR EACH ROW
    EXECUTE FUNCTION public.complete_quest();

-- Function to award badges based on user_actions
CREATE OR REPLACE FUNCTION public.check_badge_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_badge_id UUID;
    v_current_count INTEGER;
    v_required_count INTEGER;
BEGIN
    -- Check Fact Checker badges
    IF NEW.action_type = 'fact_check_submitted' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.user_actions
        WHERE user_id = NEW.user_id AND action_type = 'fact_check_submitted';

        -- Bronze (5), Silver (20), Gold (50), Platinum (100)
        FOR v_badge_id, v_required_count IN 
            SELECT b.id, (b.requirements->>'count')::INTEGER
            FROM public.badges b
            WHERE b.category = 'fact_checker' AND b.is_active = TRUE
        LOOP
            IF v_current_count >= v_required_count THEN
                INSERT INTO public.user_badges (user_id, badge_id, progress)
                VALUES (NEW.user_id, v_badge_id, v_current_count)
                ON CONFLICT (user_id, badge_id) DO UPDATE SET progress = v_current_count;
            END IF;
        END LOOP;
    END IF;

    -- Check Community Reporter badges
    IF NEW.action_type = 'project_submitted' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.user_actions
        WHERE user_id = NEW.user_id AND action_type = 'project_submitted';

        FOR v_badge_id, v_required_count IN 
            SELECT b.id, (b.requirements->>'count')::INTEGER
            FROM public.badges b
            WHERE b.category = 'community_reporter' AND b.is_active = TRUE
        LOOP
            IF v_current_count >= v_required_count THEN
                INSERT INTO public.user_badges (user_id, badge_id, progress)
                VALUES (NEW.user_id, v_badge_id, v_current_count)
                ON CONFLICT (user_id, badge_id) DO UPDATE SET progress = v_current_count;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_badges ON public.user_actions;
CREATE TRIGGER check_badges
    AFTER INSERT ON public.user_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_badge_progress();

-- Function to update challenge vote counts
CREATE OR REPLACE FUNCTION public.update_challenge_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.challenge_submissions
    SET votes = (
        SELECT COUNT(*) FROM public.challenge_votes WHERE submission_id = NEW.submission_id
    )
    WHERE id = NEW.submission_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_challenge_vote ON public.challenge_votes;
CREATE TRIGGER on_challenge_vote
    AFTER INSERT OR DELETE ON public.challenge_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_votes();

-- Function to update skill credibility on endorsement
CREATE OR REPLACE FUNCTION public.update_skill_credibility()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_skills
    SET 
        endorsement_count = (SELECT COUNT(*) FROM public.skill_endorsements WHERE user_skill_id = NEW.user_skill_id),
        credibility_score = (SELECT COALESCE(SUM(weight), 0) FROM public.skill_endorsements WHERE user_skill_id = NEW.user_skill_id)
    WHERE id = NEW.user_skill_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_skill_endorsement ON public.skill_endorsements;
CREATE TRIGGER on_skill_endorsement
    AFTER INSERT ON public.skill_endorsements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_skill_credibility();

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Quests (Public Read)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are viewable by everyone" ON public.quests FOR SELECT USING (is_active = TRUE);

-- User Quests (Users can view and update their own)
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quests" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quests" ON public.user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quests" ON public.user_quests FOR UPDATE USING (auth.uid() = user_id);

-- Badges (Public Read)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (is_active = TRUE);

-- User Badges (Users can view their own and others)
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (TRUE);

-- Leaderboards (Public Read)
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboards are viewable by everyone" ON public.leaderboard_scores FOR SELECT USING (TRUE);

-- Challenges (Public Read)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges FOR SELECT USING (TRUE);

-- Challenge Submissions (Public Read, Users can insert their own)
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Submissions are viewable by everyone" ON public.challenge_submissions FOR SELECT USING (TRUE);
CREATE POLICY "Users can submit to challenges" ON public.challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenge Votes (Users can vote)
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can vote on submissions" ON public.challenge_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view votes" ON public.challenge_votes FOR SELECT USING (TRUE);

-- Skills (Public Read)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (is_active = TRUE);

-- User Skills (Public Read, Users can claim)
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User skills are viewable by everyone" ON public.user_skills FOR SELECT USING (TRUE);
CREATE POLICY "Users can claim skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skill Endorsements (Public Read, Users can endorse)
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Endorsements are viewable by everyone" ON public.skill_endorsements FOR SELECT USING (TRUE);
CREATE POLICY "Users can endorse skills" ON public.skill_endorsements FOR INSERT WITH CHECK (auth.uid() = endorsed_by);

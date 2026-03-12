-- Civic Profile 2.0 - Database Foundation
-- Phase 1: Core tables for impact scores, expertise, customizations, and official scorecards

-- ============================================================
-- 1. CIVIC IMPACT SCORES
-- Tracks user's overall civic impact and level
-- ============================================================

CREATE TABLE IF NOT EXISTS civic_impact_scores (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Impact Rating (0-100)
    impact_rating INTEGER DEFAULT 0 CHECK (impact_rating >= 0 AND impact_rating <= 100),
    
    -- Trust Level
    trust_tier TEXT DEFAULT 'resident' CHECK (trust_tier IN (
        'resident',           -- Default for all users
        'verified_resident',  -- Verified their location
        'verified_user',      -- Verified identity but not official
        'verified_official'   -- Verified government official
    )),
    
    -- GOAT Level System (gamification)
    goat_level INTEGER DEFAULT 1 CHECK (goat_level >= 1),
    goat_title TEXT DEFAULT 'Street Monitor',
    goat_xp INTEGER DEFAULT 0,  -- Experience points toward next level
    
    -- Component Scores (for transparency)
    actions_score INTEGER DEFAULT 0,      -- From civic actions taken
    resolution_score INTEGER DEFAULT 0,   -- From issues resolved
    community_score INTEGER DEFAULT 0,    -- From community engagement
    reliability_score INTEGER DEFAULT 0,  -- From verification accuracy
    
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_civic_impact_rating ON civic_impact_scores(impact_rating DESC);
CREATE INDEX IF NOT EXISTS idx_civic_goat_level ON civic_impact_scores(goat_level DESC);

-- ============================================================
-- 2. USER EXPERTISE
-- LinkedIn-style endorsements for civic skills
-- ============================================================

CREATE TABLE IF NOT EXISTS user_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Expertise type
    expertise_type TEXT NOT NULL CHECK (expertise_type IN (
        'budget_analyst',       -- Understands budgets and finances
        'pothole_reporter',     -- Reports infrastructure issues
        'legal_eagle',          -- Constitutional/legal knowledge
        'community_organizer',  -- Organizes community events
        'fact_checker',         -- Verifies information accuracy
        'policy_analyst',       -- Analyzes government policies
        'election_monitor',     -- Monitors elections
        'environment_guardian', -- Environmental issues
        'education_advocate',   -- Education-related issues
        'health_champion'       -- Health-related issues
    )),
    
    -- Verification
    endorsement_count INTEGER DEFAULT 0,
    verified_actions_count INTEGER DEFAULT 0,  -- Validated by system
    is_verified BOOLEAN DEFAULT FALSE,         -- Met threshold for verification
    verified_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, expertise_type)
);

-- Index for expertise lookups
CREATE INDEX IF NOT EXISTS idx_user_expertise_user ON user_expertise(user_id);
CREATE INDEX IF NOT EXISTS idx_user_expertise_verified ON user_expertise(is_verified) WHERE is_verified = true;

-- ============================================================
-- 3. EXPERTISE ENDORSEMENTS
-- Track who endorsed whom for what skill
-- ============================================================

CREATE TABLE IF NOT EXISTS expertise_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expertise_id UUID NOT NULL REFERENCES user_expertise(id) ON DELETE CASCADE,
    endorser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Optional message
    message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(expertise_id, endorser_id)
);

-- ============================================================
-- 4. PROFILE CUSTOMIZATIONS
-- Discord-style personalization options
-- ============================================================

CREATE TABLE IF NOT EXISTS profile_customizations (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Theme
    theme TEXT DEFAULT 'dark' CHECK (theme IN (
        'light', 'dark',
        -- County themes (free)
        'county_nairobi', 'county_mombasa', 'county_kisumu', 'county_nakuru',
        -- Premium/Earned themes
        'constitution_gold', 'activist_red', 'eco_green', 'civic_blue'
    )),
    
    -- Avatar Frame Animation
    frame_animation TEXT CHECK (frame_animation IN (
        NULL,           -- No animation
        'ballot_spin',  -- Spinning ballot box
        'flag_wave',    -- Kenyan flag wave
        'stars_glow',   -- Glowing stars
        'civic_pulse',  -- Pulsing civic colors
        'verified_shine' -- Special for verified users
    )),
    
    -- Accent Color (hex)
    accent_color TEXT DEFAULT '#3B82F6',  -- Default blue
    
    -- Banner Animation
    banner_animation_url TEXT,  -- URL to animated banner (GIF/Video)
    
    -- Profile Music (for Townhall intro)
    walkout_sound_url TEXT,
    
    -- Premium Features
    has_premium_features BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. OFFICIAL SCORECARDS
-- Public service report card for government officials
-- ============================================================

CREATE TABLE IF NOT EXISTS official_scorecards (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Promise Tracking
    promises_total INTEGER DEFAULT 0,
    promises_kept INTEGER DEFAULT 0,
    promises_broken INTEGER DEFAULT 0,
    promises_in_progress INTEGER DEFAULT 0,
    promise_kept_percent INTEGER DEFAULT 0 CHECK (promise_kept_percent >= 0 AND promise_kept_percent <= 100),
    
    -- Project Tracking
    projects_total INTEGER DEFAULT 0,
    projects_stalled INTEGER DEFAULT 0,
    projects_active INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    projects_cancelled INTEGER DEFAULT 0,
    
    -- Attendance (if applicable)
    attendance_sessions_total INTEGER DEFAULT 0,
    attendance_sessions_present INTEGER DEFAULT 0,
    attendance_percent INTEGER DEFAULT 0 CHECK (attendance_percent >= 0 AND attendance_percent <= 100),
    
    -- Responsiveness
    total_citizen_queries INTEGER DEFAULT 0,
    queries_responded INTEGER DEFAULT 0,
    avg_response_hours INTEGER,  -- Average hours to respond
    
    -- Overall Grade (calculated)
    overall_grade TEXT CHECK (overall_grade IN ('A', 'B', 'C', 'D', 'F', NULL)),
    
    -- Metadata
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. GOAT LEVEL DEFINITIONS
-- Reference table for level progression
-- ============================================================

CREATE TABLE IF NOT EXISTS goat_levels (
    level INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    xp_required INTEGER NOT NULL,
    description TEXT,
    badge_color TEXT DEFAULT '#3B82F6'  -- Badge accent color
);

-- Seed GOAT levels
INSERT INTO goat_levels (level, title, xp_required, description, badge_color) VALUES
    (1, 'Street Monitor', 0, 'Just getting started', '#6B7280'),
    (2, 'Block Watcher', 100, 'Keeping an eye on your block', '#6B7280'),
    (3, 'Estate Sentinel', 300, 'Protecting your estate', '#22C55E'),
    (4, 'Village Voice', 600, 'Speaking for your village', '#22C55E'),
    (5, 'Ward Guardian', 1000, 'Guardian of your ward', '#22C55E'),
    (10, 'Constituency Champion', 3000, 'Champion of your constituency', '#3B82F6'),
    (20, 'County Crusader', 10000, 'Crusading across the county', '#3B82F6'),
    (30, 'Regional Legend', 25000, 'A legend in the region', '#8B5CF6'),
    (40, 'National Hero', 50000, 'Hero of the nation', '#F59E0B'),
    (50, 'Civic GOAT', 100000, 'Greatest Of All Time', '#EF4444')
ON CONFLICT (level) DO NOTHING;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Civic Impact Scores
ALTER TABLE civic_impact_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view impact scores" ON civic_impact_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own impact score" ON civic_impact_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update impact scores" ON civic_impact_scores
    FOR UPDATE USING (true);  -- Updated by system functions

-- User Expertise
ALTER TABLE user_expertise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view expertise" ON user_expertise
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own expertise" ON user_expertise
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Expertise Endorsements
ALTER TABLE expertise_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view endorsements" ON expertise_endorsements
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can endorse" ON expertise_endorsements
    FOR INSERT WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "Users can delete own endorsements" ON expertise_endorsements
    FOR DELETE USING (auth.uid() = endorser_id);

-- Profile Customizations
ALTER TABLE profile_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view customizations" ON profile_customizations
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own customizations" ON profile_customizations
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Official Scorecards
ALTER TABLE official_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view scorecards" ON official_scorecards
    FOR SELECT USING (true);

CREATE POLICY "System can manage scorecards" ON official_scorecards
    FOR ALL USING (true);  -- Managed by system

-- GOAT Levels (read-only reference)
ALTER TABLE goat_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view goat levels" ON goat_levels
    FOR SELECT USING (true);

-- ============================================================
-- 8. TRIGGER: Update endorsement count
-- ============================================================

CREATE OR REPLACE FUNCTION update_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_expertise
        SET 
            endorsement_count = endorsement_count + 1,
            is_verified = CASE WHEN endorsement_count + 1 >= 10 THEN true ELSE is_verified END,
            verified_at = CASE WHEN endorsement_count + 1 >= 10 AND verified_at IS NULL THEN NOW() ELSE verified_at END,
            updated_at = NOW()
        WHERE id = NEW.expertise_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_expertise
        SET 
            endorsement_count = GREATEST(0, endorsement_count - 1),
            updated_at = NOW()
        WHERE id = OLD.expertise_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_endorsement_count ON expertise_endorsements;
CREATE TRIGGER trigger_update_endorsement_count
    AFTER INSERT OR DELETE ON expertise_endorsements
    FOR EACH ROW
    EXECUTE FUNCTION update_endorsement_count();

-- ============================================================
-- 9. FUNCTION: Calculate Impact Rating
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_impact_rating(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_actions_score INTEGER := 0;
    v_resolution_score INTEGER := 0;
    v_community_score INTEGER := 0;
    v_reliability_score INTEGER := 0;
    v_total_score INTEGER := 0;
    v_actions_count INTEGER;
    v_resolved_count INTEGER;
    v_endorsements_received INTEGER;
    v_verified_expertise_count INTEGER;
BEGIN
    -- Calculate actions score (max 30 points)
    SELECT COUNT(*) INTO v_actions_count
    FROM civic_actions WHERE user_id = p_user_id;
    v_actions_score := LEAST(v_actions_count * 2, 30);
    
    -- Calculate resolution score (max 30 points)
    SELECT COUNT(*) INTO v_resolved_count
    FROM civic_actions WHERE user_id = p_user_id AND status = 'resolved';
    v_resolution_score := LEAST(v_resolved_count * 5, 30);
    
    -- Calculate community score (max 25 points)
    SELECT COALESCE(SUM(endorsement_count), 0) INTO v_endorsements_received
    FROM user_expertise WHERE user_id = p_user_id;
    v_community_score := LEAST(v_endorsements_received, 25);
    
    -- Calculate reliability score (max 15 points)
    SELECT COUNT(*) INTO v_verified_expertise_count
    FROM user_expertise WHERE user_id = p_user_id AND is_verified = true;
    v_reliability_score := LEAST(v_verified_expertise_count * 5, 15);
    
    -- Total (max 100)
    v_total_score := v_actions_score + v_resolution_score + v_community_score + v_reliability_score;
    
    -- Update civic_impact_scores
    INSERT INTO civic_impact_scores (
        user_id, impact_rating, actions_score, resolution_score, 
        community_score, reliability_score, calculated_at, updated_at
    )
    VALUES (
        p_user_id, v_total_score, v_actions_score, v_resolution_score,
        v_community_score, v_reliability_score, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        impact_rating = v_total_score,
        actions_score = v_actions_score,
        resolution_score = v_resolution_score,
        community_score = v_community_score,
        reliability_score = v_reliability_score,
        calculated_at = NOW(),
        updated_at = NOW();
    
    RETURN v_total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION calculate_impact_rating TO authenticated;

-- ============================================================
-- 10. FUNCTION: Calculate GOAT Level
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_goat_level(p_xp INTEGER)
RETURNS TABLE (level INTEGER, title TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT gl.level, gl.title
    FROM goat_levels gl
    WHERE gl.xp_required <= p_xp
    ORDER BY gl.xp_required DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 11. COMMENTS
-- ============================================================

COMMENT ON TABLE civic_impact_scores IS 'Core table for user civic impact ratings and GOAT levels';
COMMENT ON TABLE user_expertise IS 'User skills with endorsement tracking, like LinkedIn for civic engagement';
COMMENT ON TABLE profile_customizations IS 'Discord-style profile personalization options';
COMMENT ON TABLE official_scorecards IS 'Public service report cards for government officials';
COMMENT ON TABLE goat_levels IS 'Reference table for GOAT level progression system';

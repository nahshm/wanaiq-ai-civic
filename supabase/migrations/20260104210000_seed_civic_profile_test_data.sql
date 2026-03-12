-- Seed data for Civic Profile 2.0 testing
-- Seeding for user: biasharabyob (66033a0b-3540-4ccd-988e-4ddae3057f8c)

DO $$
DECLARE
    v_user_id UUID := '66033a0b-3540-4ccd-988e-4ddae3057f8c';
    v_expertise_id UUID;
BEGIN
    RAISE NOTICE 'Seeding Civic Profile 2.0 data for user: %', v_user_id;

    -- 1. Seed Civic Impact Score
    INSERT INTO civic_impact_scores (
        user_id, 
        impact_rating, 
        trust_tier, 
        goat_level, 
        goat_title, 
        goat_xp,
        actions_score,
        resolution_score,
        community_score,
        reliability_score
    )
    VALUES (
        v_user_id,
        75,
        'verified_official',
        5,
        'Ward Guardian',
        1200,
        25,
        20,
        18,
        12
    )
    ON CONFLICT (user_id) DO UPDATE SET
        impact_rating = 75,
        trust_tier = 'verified_official',
        goat_level = 5,
        goat_title = 'Ward Guardian',
        goat_xp = 1200,
        actions_score = 25,
        resolution_score = 20,
        community_score = 18,
        reliability_score = 12;

    -- 2. Seed User Expertise (multiple skills)
    -- Budget Analyst
    INSERT INTO user_expertise (user_id, expertise_type, endorsement_count, verified_actions_count, is_verified)
    VALUES (v_user_id, 'budget_analyst', 25, 8, true)
    ON CONFLICT (user_id, expertise_type) DO UPDATE SET
        endorsement_count = 25, verified_actions_count = 8, is_verified = true;

    -- Pothole Reporter
    INSERT INTO user_expertise (user_id, expertise_type, endorsement_count, verified_actions_count, is_verified)
    VALUES (v_user_id, 'pothole_reporter', 42, 15, true)
    ON CONFLICT (user_id, expertise_type) DO UPDATE SET
        endorsement_count = 42, verified_actions_count = 15, is_verified = true;

    -- Legal Eagle
    INSERT INTO user_expertise (user_id, expertise_type, endorsement_count, verified_actions_count, is_verified)
    VALUES (v_user_id, 'legal_eagle', 18, 5, true)
    ON CONFLICT (user_id, expertise_type) DO UPDATE SET
        endorsement_count = 18, verified_actions_count = 5, is_verified = true;

    -- Community Organizer
    INSERT INTO user_expertise (user_id, expertise_type, endorsement_count, verified_actions_count, is_verified)
    VALUES (v_user_id, 'community_organizer', 12, 3, false)
    ON CONFLICT (user_id, expertise_type) DO UPDATE SET
        endorsement_count = 12, verified_actions_count = 3, is_verified = false;

    -- Fact Checker
    INSERT INTO user_expertise (user_id, expertise_type, endorsement_count, verified_actions_count, is_verified)
    VALUES (v_user_id, 'fact_checker', 8, 2, false)
    ON CONFLICT (user_id, expertise_type) DO UPDATE SET
        endorsement_count = 8, verified_actions_count = 2, is_verified = false;

    -- 3. Seed Profile Customization
    INSERT INTO profile_customizations (
        user_id,
        theme,
        frame_animation,
        accent_color,
        has_premium_features
    )
    VALUES (
        v_user_id,
        'county_nairobi',
        'ballot_spin',
        '#22C55E',
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        theme = 'county_nairobi',
        frame_animation = 'ballot_spin',
        accent_color = '#22C55E',
        has_premium_features = true;

    -- 4. Seed Official Scorecard (if verified official)
    INSERT INTO official_scorecards (
        user_id,
        promises_total,
        promises_kept,
        promises_broken,
        promises_in_progress,
        promise_kept_percent,
        projects_total,
        projects_stalled,
        projects_active,
        projects_completed,
        projects_cancelled,
        attendance_sessions_total,
        attendance_sessions_present,
        attendance_percent,
        total_citizen_queries,
        queries_responded,
        avg_response_hours,
        overall_grade
    )
    VALUES (
        v_user_id,
        15,      -- promises_total
        8,       -- promises_kept
        2,       -- promises_broken
        5,       -- promises_in_progress
        53,      -- promise_kept_percent
        12,      -- projects_total
        2,       -- projects_stalled
        4,       -- projects_active
        5,       -- projects_completed
        1,       -- projects_cancelled
        50,      -- attendance_sessions_total
        43,      -- attendance_sessions_present
        86,      -- attendance_percent
        120,     -- total_citizen_queries
        95,      -- queries_responded
        36,      -- avg_response_hours (1.5 days)
        'B'      -- overall_grade
    )
    ON CONFLICT (user_id) DO UPDATE SET
        promises_total = 15,
        promises_kept = 8,
        promises_broken = 2,
        promises_in_progress = 5,
        promise_kept_percent = 53,
        projects_total = 12,
        projects_stalled = 2,
        projects_active = 4,
        projects_completed = 5,
        projects_cancelled = 1,
        attendance_sessions_total = 50,
        attendance_sessions_present = 43,
        attendance_percent = 86,
        total_citizen_queries = 120,
        queries_responded = 95,
        avg_response_hours = 36,
        overall_grade = 'B';

    RAISE NOTICE 'Successfully seeded test data for user: %', v_user_id;

END $$;

-- Verify the seeded data
SELECT 'Impact Scores:' as section, COUNT(*) as count FROM civic_impact_scores;
SELECT 'User Expertise:' as section, COUNT(*) as count FROM user_expertise;
SELECT 'Profile Customizations:' as section, COUNT(*) as count FROM profile_customizations;
SELECT 'Official Scorecards:' as section, COUNT(*) as count FROM official_scorecards;
SELECT 'GOAT Levels:' as section, COUNT(*) as count FROM goat_levels;

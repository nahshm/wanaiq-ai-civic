-- Seed Data: Initial Quests, Badges, and Skills
-- Run this after the main gamification migration

-- ============================================
-- 1. SEED QUESTS
-- ============================================

INSERT INTO public.quests (title, description, category, points, verification_type, difficulty, icon, requirements) VALUES
-- Reporting Quests
('Report Your First Issue', 'Report a civic issue in your community (pothole, broken streetlight, etc.)', 'reporting', 10, 'automatic', 'easy', '🚨', '{"min_photos": 1}'),
('Photo Documentation Pro', 'Submit 3 high-quality photos documenting a civic issue with GPS location', 'reporting', 15, 'photo', 'medium', '📸', '{"min_photos": 3, "require_gps": true}'),
('Community Inspector', 'Report 10 different civic issues in your ward', 'reporting', 50, 'automatic', 'hard', '🔍', '{"report_count": 10}'),

-- Attendance Quests
('Town Hall Attendee', 'Attend a town hall meeting or public forum', 'attendance', 25, 'photo', 'medium', '🏛️', '{"require_gps": true, "min_photos": 1}'),
('Community Meeting Regular', 'Attend 3 community meetings in a month', 'attendance', 50, 'social_proof', 'hard', '👥', '{"meeting_count": 3}'),

-- Engagement Quests
('Voice Your Opinion', 'Comment on 5 different policy discussions or projects', 'engagement', 15, 'automatic', 'easy', '💬', '{"comment_count": 5}'),
('Democratic Voter', 'Vote on 10 community issues or challenge submissions', 'engagement', 20, 'automatic', 'medium', '🗳️', '{"vote_count": 10}'),
('Policy Analyst', 'Write a detailed analysis of a government policy or budget', 'engagement', 30, 'official', 'hard', '📊', '{"min_words": 500}'),

-- Content Quests
('First Project Post', 'Submit your first community project report', 'content', 10, 'automatic', 'easy', '📝', '{}'),
('Fact Checker Initiate', 'Submit your first fact-check on a project update', 'content', 15, 'automatic', 'medium', '✓', '{}'),
('Evidence Gatherer', 'Upload comprehensive evidence (photos, videos, documents) for a project', 'content', 20, 'automatic', 'medium', '📁', '{"min_media": 3, "min_documents": 1}'),

-- Learning Quests
('Civic Education 101', 'Complete the basic civic education module', 'learning', 15, 'automatic', 'easy', '🎓', '{}'),
('Budget Basics', 'Learn how to read and analyze government budgets', 'learning', 20, 'automatic', 'medium', '💰', '{}'),
('Know Your Rights', 'Complete the civic rights and responsibilities course', 'learning', 25, 'automatic', 'medium', '⚖️', '{}');

-- ============================================
-- 2. SEED BADGES
-- ============================================

-- Fact Checker Badges
INSERT INTO public.badges (name, description, icon, category, tier, requirements, points_reward) VALUES
('Fact Checker - Bronze', 'Verified 5 community reports', '🥉', 'fact_checker', 'bronze', '{"action": "fact_check_submitted", "count": 5}', 10),
('Fact Checker - Silver', 'Verified 20 community reports', '🥈', 'fact_checker', 'silver', '{"action": "fact_check_submitted", "count": 20}', 25),
('Fact Checker - Gold', 'Verified 50 community reports', '🥇', 'fact_checker', 'gold', '{"action": "fact_check_submitted", "count": 50}', 50),
('Fact Checker - Platinum', 'Verified 100 community reports', '💎', 'fact_checker', 'platinum', '{"action": "fact_check_submitted", "count": 100}', 100),

-- Community Reporter Badges
('Community Reporter - Bronze', 'Submitted 3 project reports', '🥉', 'community_reporter', 'bronze', '{"action": "project_submitted", "count": 3}', 10),
('Community Reporter - Silver', 'Submitted 10 project reports', '🥈', 'community_reporter', 'silver', '{"action": "project_submitted", "count": 10}', 25),
('Community Reporter - Gold', 'Submitted 25 project reports', '🥇', 'community_reporter', 'gold', '{"action": "project_submitted", "count": 25}', 50),
('Community Reporter - Platinum', 'Submitted 50 project reports', '💎', 'community_reporter', 'platinum', '{"action": "project_submitted", "count": 50}', 100),

-- Policy Analyst Badge

('Policy Analyst - Bronze', 'Analyzed 5 government policies', '🥉', 'policy_analyst', 'bronze', '{"action": "policy_analyzed", "count": 5}', 10),
('Policy Analyst - Silver', 'Analyzed 20 government policies', '🥈', 'policy_analyst', 'silver', '{"action": "policy_analyzed", "count": 20}', 25),
('Policy Analyst - Gold', 'Analyzed 50 government policies', '🥇', 'policy_analyst', 'gold', '{"action": "policy_analyzed", "count": 50}', 50),
('Policy Analyst - Platinum', 'Analyzed 100 government policies', '💎', 'policy_analyst', 'platinum', '{"action": "policy_analyzed", "count": 100}', 100),

-- Voting Champion Badges
('Voting Champion - Bronze', 'Voted on 10 community issues', '🥉', 'voting_champion', 'bronze', '{"action": "vote_cast", "count": 10}', 10),
('Voting Champion - Silver', 'Voted on 50 community issues', '🥈', 'voting_champion', 'silver', '{"action": "vote_cast", "count": 50}', 25),
('Voting Champion - Gold', 'Voted on 100 community issues', '🥇', 'voting_champion', 'gold', '{"action": "vote_cast", "count": 100}', 50),
('Voting Champion - Platinum', 'Voted on 250 community issues', '💎', 'voting_champion', 'platinum', '{"action": "vote_cast", "count": 250}', 100),

-- Civic Educator Badges
('Civic Educator - Bronze', 'Helped educate 5 community members', '🥉', 'civic_educator', 'bronze', '{"action": "education_content", "count": 5}', 10),
('Civic Educator - Silver', 'Helped educate 20 community members', '🥈', 'civic_educator', 'silver', '{"action": "education_content", "count": 20}', 25),
('Civic Educator - Gold', 'Helped educate 50 community members', '🥇', 'civic_educator', 'gold', '{"action": "education_content", "count": 50}', 50),
('Civic Educator - Platinum', 'Helped educate 100 community members', '💎', 'civic_educator', 'platinum', '{"action": "education_content", "count": 100}', 100);

-- ============================================
-- 3. SEED SKILLS
-- ============================================

INSERT INTO public.skills (name, category, description, icon) VALUES
('Budget Analysis', 'budget_analysis', 'Ability to read, analyze, and interpret government budgets and financial documents', '💰'),
('Community Organizing', 'community_organizing', 'Experience in mobilizing and organizing community members for civic action', '👥'),
('Legal Knowledge', 'legal_knowledge', 'Understanding of Kenyan law, civic rights, and legal processes', '⚖️'),
('Policy Research', 'policy_research', 'Skill in researching, analyzing, and interpreting government policies', '📊'),
('Media Relations', 'media_relations', 'Ability to communicate civic issues effectively through media channels', '📰'),
('Project Management', 'project_management', 'Experience managing civic or community development projects', '📋'),
('Data Analysis', 'budget_analysis', 'Proficiency in analyzing civic data and presenting insights', '📈'),
('Public Speaking', 'community_organizing', 'Ability to speak effectively at public forums and community meetings', '🎤'),
('Grant Writing', 'project_management', 'Experience writing proposals for community projects and funding', '✍️'),
('Conflict Resolution', 'community_organizing', 'Skill in mediating and resolving community disputes', '🤝');

-- ============================================
-- 4. SAMPLE CHALLENGE (Optional)
-- ============================================

-- INSERT INTO public.challenges (title, description, category, start_date, end_date, voting_end_date, reward_description, reward_points, status) VALUES
-- ('December 2024 - Pothole Documentation Challenge', 
--  'Document the most potholes in your ward with high-quality photos and GPS coordinates. Winner gets recognition and bonus points!',
--  'photo_contest',
--  '2024-12-01 00:00:00+03',
--  '2024-12-28 23:59:59+03',
--  '2024-12-31 23:59:59+03',
--  'Featured in community highlights + 200 bonus points',
--  200,
--  'active');

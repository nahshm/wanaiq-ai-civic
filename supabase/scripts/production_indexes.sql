-- =========================================================
-- PRODUCTION INDEX CREATION (Run manually, NOT as migration)
-- =========================================================
-- 
-- Use this file when you have millions of rows and need 
-- to create indexes without blocking writes.
--
-- Run these statements ONE AT A TIME in Supabase SQL Editor
-- (not in a transaction/migration)
-- =========================================================

-- 1. Geographic community lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communities_type_location 
ON communities(type, location_type, location_value);

-- 2. Membership checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_members_user_community 
ON community_members(user_id, community_id);

-- 3. Active members timestamp filter  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_members_community_lastseen 
ON community_active_members(community_id, last_seen_at);

-- 4. Channel lookups by community
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channels_community 
ON channels(community_id);

-- 5. Posts by community with ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_community_created 
ON posts(community_id, created_at DESC);

-- Performance Indexes Migration
-- Adds missing indexes to dramatically improve query performance

-- 1. Geographic community lookups (currently slow)
-- Used heavily in fetchGeographicCommunities for location-based queries
CREATE INDEX IF NOT EXISTS idx_communities_type_location 
ON communities(type, location_type, location_value);

-- 2. Membership checks (called on every page load)
-- Composite index for fast user-community membership validation
CREATE INDEX IF NOT EXISTS idx_community_members_user_community 
ON community_members(user_id, community_id);

-- 3. Active members timestamp filter (powers online count)
-- Optimizes the get_online_member_count function's 15-minute window query
CREATE INDEX IF NOT EXISTS idx_active_members_community_lastseen 
ON community_active_members(community_id, last_seen_at);

-- 4. Channel lookups by community (used in Community.tsx)
CREATE INDEX IF NOT EXISTS idx_channels_community 
ON channels(community_id);

-- 5. Posts by community with ordering (used in fetchChannelData)
CREATE INDEX IF NOT EXISTS idx_posts_community_created 
ON posts(community_id, created_at DESC);


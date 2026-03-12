-- Add Feed Channel and Baraza Voice Channel to Communities
-- Migration: Adds 'feed' channel at top (user posts) and 'baraza' voice channel

-- 1. Update seed_community_channels function to include feed and baraza
CREATE OR REPLACE FUNCTION seed_community_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- FEED CHANNEL - User posts (appears at top, above Information)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'community-feed', 'feed', 'FEED', TRUE, 0, 'User posts and community updates');
    
    -- CORE LOCKED CHANNELS (Standard Civic Suite)
    
    -- Announcements (Read-only for members)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'announcements', 'announcement', 'INFO', TRUE, 1, 'Official updates from leadership');
    
    -- Project Tracker (Forum for structured tracking)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'project-tracker', 'forum', 'MONITORING', TRUE, 2, 'Track government projects and development');
    
    -- Public Forum (General discussion)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'public-forum', 'forum', 'ENGAGEMENT', TRUE, 3, 'Open community discussions');
    
    -- OPTIONAL DEFAULT CHANNELS (Can be deleted by admin)
    
    -- General Chat
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'general-chat', 'chat', 'ENGAGEMENT', FALSE, 4, 'Casual conversations');
    
    -- Baraza - Audio/Video Community Hall
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'baraza', 'voice', 'ENGAGEMENT', FALSE, 5, 'Community voice and video gatherings');
    
    -- Leaders Grid (Monitoring)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'our-leaders', 'feed', 'MONITORING', FALSE, 6, 'View elected officials and office holders');
    
    -- Promises Watch (Monitoring)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'promises-watch', 'feed', 'MONITORING', FALSE, 7, 'Track campaign promises and commitments');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add feed channel and baraza to existing communities
DO $$
DECLARE
    comm RECORD;
BEGIN
    FOR comm IN SELECT id FROM communities LOOP
        -- Add community-feed if missing (at top with position 0)
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'community-feed', 'feed', 'FEED', TRUE, 0, 'User posts and community updates'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'community-feed');
        
        -- Add baraza if missing
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'baraza', 'voice', 'ENGAGEMENT', FALSE, 5, 'Community voice and video gatherings'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'baraza');
        
        -- Mark feed channel as locked
        UPDATE channels SET is_locked = TRUE 
        WHERE community_id = comm.id AND name = 'community-feed';
    END LOOP;
END $$;

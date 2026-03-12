-- Update seed_community_channels to include intros and projects-watch
CREATE OR REPLACE FUNCTION seed_community_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- FEED CHANNEL - User posts (appears at top, above Information)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'community-feed', 'feed', 'FEED', TRUE, 0, 'User posts and community updates');
    
    -- INFO CHANNELS
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'intros', 'text', 'INFO', FALSE, 1, 'Introduce yourself to the community');

    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'announcements', 'announcement', 'INFO', TRUE, 2, 'Official updates from leadership');
    
    -- MONITORING CHANNELS
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'our-leaders', 'feed', 'MONITORING', FALSE, 3, 'View elected officials and office holders');

    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'projects-watch', 'feed', 'MONITORING', FALSE, 4, 'Track government projects and development');

    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'promises-watch', 'feed', 'MONITORING', FALSE, 5, 'Track campaign promises and commitments');

    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'project-tracker', 'forum', 'MONITORING', TRUE, 6, 'Track government projects and development');
    
    -- ENGAGEMENT CHANNELS
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'general-chat', 'chat', 'ENGAGEMENT', FALSE, 7, 'Casual conversations');
    
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'baraza', 'video', 'ENGAGEMENT', FALSE, 8, 'Community voice and video gatherings');

    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'public-forum', 'forum', 'ENGAGEMENT', TRUE, 9, 'Open community discussions');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Backfill: Add intros and projects-watch to communities missing them
DO $$
DECLARE
    comm RECORD;
BEGIN
    FOR comm IN SELECT id FROM communities LOOP
        -- Add intros if missing
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'intros', 'text', 'INFO', FALSE, 1, 'Introduce yourself to the community'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'intros');
        
        -- Add projects-watch if missing
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'projects-watch', 'feed', 'MONITORING', FALSE, 4, 'Track government projects and development'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'projects-watch');

        -- Fix baraza type from 'voice' to 'video' if needed
        UPDATE channels SET type = 'video' 
        WHERE community_id = comm.id AND name = 'baraza' AND type = 'voice';
    END LOOP;
END $$;
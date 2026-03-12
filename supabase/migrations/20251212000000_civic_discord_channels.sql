-- Civic Discord Channel System Redesign
-- Implements: Forum Channels, Fixed Core Channels, Thread Support

-- 1. Drop and recreate channel type constraint with new types
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_type_check;
ALTER TABLE channels ADD CONSTRAINT channels_type_check 
  CHECK (type IN ('announcement', 'forum', 'chat', 'feed', 'text', 'voice', 'video'));

-- 2. Add is_locked column for core channels that cannot be deleted
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS emoji_prefix TEXT;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- 3. Create forum_threads table for forum channel discussions
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_forum_threads_channel ON forum_threads(channel_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_community ON forum_threads(community_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);

-- 4. Create forum_replies table for thread replies
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);

-- 5. Enable RLS on new tables
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Forum threads: Anyone can view
CREATE POLICY "View forum threads"
ON forum_threads FOR SELECT
USING (true);

-- Forum threads: Members can create
CREATE POLICY "Members can create forum threads"
ON forum_threads FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM community_members
        WHERE community_id = forum_threads.community_id
        AND user_id = auth.uid()
    )
);

-- Forum threads: Authors and mods can update
CREATE POLICY "Authors and mods can update threads"
ON forum_threads FOR UPDATE
TO authenticated
USING (
    author_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM community_moderators
        WHERE community_id = forum_threads.community_id
        AND user_id = auth.uid()
    )
);

-- Forum replies: Anyone can view
CREATE POLICY "View forum replies"
ON forum_replies FOR SELECT
USING (true);

-- Forum replies: Authenticated users can create
CREATE POLICY "Authenticated users can create replies"
ON forum_replies FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM forum_threads t
        JOIN community_members m ON m.community_id = t.community_id
        WHERE t.id = forum_replies.thread_id
        AND m.user_id = auth.uid()
    )
);

-- 6. Update seed_community_channels function with Standard Civic Suite
CREATE OR REPLACE FUNCTION seed_community_channels()
RETURNS TRIGGER AS $$
BEGIN
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
    
    -- Leaders Grid (Monitoring)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'our-leaders', 'feed', 'MONITORING', FALSE, 5, 'View elected officials and office holders');
    
    -- Promises Watch (Monitoring)
    INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
    VALUES (NEW.id, 'promises-watch', 'feed', 'MONITORING', FALSE, 6, 'Track campaign promises and commitments');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Update existing communities with new core channels
DO $$
DECLARE
    comm RECORD;
BEGIN
    FOR comm IN SELECT id FROM communities LOOP
        -- Add announcements if missing
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'announcements', 'announcement', 'INFO', TRUE, 1, 'Official updates from leadership'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'announcements');
        
        -- Add project-tracker if missing
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'project-tracker', 'forum', 'MONITORING', TRUE, 2, 'Track government projects and development'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'project-tracker');
        
        -- Add public-forum if missing
        INSERT INTO channels (community_id, name, type, category, is_locked, position, description)
        SELECT comm.id, 'public-forum', 'forum', 'ENGAGEMENT', TRUE, 3, 'Open community discussions'
        WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'public-forum');
        
        -- Mark existing core channels as locked
        UPDATE channels SET is_locked = TRUE 
        WHERE community_id = comm.id AND name IN ('announcements', 'project-tracker', 'public-forum');
    END LOOP;
END $$;

-- 8. Function to update reply count on thread
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count + 1, last_reply_at = NOW()
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count - 1
        WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_forum_reply_change ON forum_replies;
CREATE TRIGGER on_forum_reply_change
AFTER INSERT OR DELETE ON forum_replies
FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- 9. Prevent deletion of locked channels
CREATE OR REPLACE FUNCTION prevent_locked_channel_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_locked = TRUE THEN
        RAISE EXCEPTION 'Cannot delete locked core channel: %', OLD.name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_channel_delete ON channels;
CREATE TRIGGER on_channel_delete
BEFORE DELETE ON channels
FOR EACH ROW EXECUTE FUNCTION prevent_locked_channel_deletion();

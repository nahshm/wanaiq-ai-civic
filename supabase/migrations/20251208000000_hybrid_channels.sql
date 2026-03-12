-- Migration: Create channels and update chat_messages linkage
-- Description: Supports Hybrid Feed/Chat model

-- 1. Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('feed', 'text', 'voice', 'announcement', 'video')), -- Added 'feed' and 'video'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fix: Ensure 'category' column exists if table was created previously without it
ALTER TABLE channels ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'ENGAGEMENT';

-- Fix: Update type constraint to include 'feed' and 'video' (Drop old constraint if exists)
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_type_check;
ALTER TABLE channels ADD CONSTRAINT channels_type_check CHECK (type IN ('feed', 'text', 'voice', 'announcement', 'video'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_channels_community ON channels(community_id);

-- 2. Update chat_messages schema
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
ALTER COLUMN room_id DROP NOT NULL; -- Make room_id optional since we might message a channel

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);

-- 3. RLS Policies for Channels
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Everyone can view public channels of a community
CREATE POLICY "View community channels"
ON channels FOR SELECT
USING (
  EXISTs (
    SELECT 1 FROM communities
    WHERE id = channels.community_id
  )
);

-- Only admins/mods can manage channels
CREATE POLICY "Manage community channels"
ON channels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM community_moderators
    WHERE community_id = channels.community_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);

-- 4. RLS Update for Chat Messages (to allow Channel chatting)
-- Allow VIEWING messages if you have access to the channel (public community or member)
CREATE POLICY "View channel messages"
ON chat_messages FOR SELECT
USING (
  channel_id IS NOT NULL AND (
    EXISTS (
       SELECT 1 FROM channels c
       JOIN communities comm ON c.community_id = comm.id
       WHERE c.id = chat_messages.channel_id
       -- Logic: If it's your community (you are a member) OR it's public? 
       -- For now, simplest is: if you can see the channel, you can see messages.
    )
  )
);

-- Allow SENDING messages
CREATE POLICY "Send channel messages"
ON chat_messages FOR INSERT
WITH CHECK (
  channel_id IS NOT NULL AND (
    EXISTS (
       -- Must be a member of the community to chat
       SELECT 1 FROM channels c
       JOIN community_members cm ON c.community_id = cm.community_id
       WHERE c.id = chat_messages.channel_id
       AND cm.user_id = auth.uid()
    )
    AND
    -- Check for read-only channels (announcements)
    NOT EXISTS (
       SELECT 1 FROM channels c
       WHERE c.id = chat_messages.channel_id
       AND c.type = 'announcement'
       AND NOT EXISTS (
         -- Unless you are a moderator
         SELECT 1 FROM community_moderators mod
         WHERE mod.community_id = c.community_id
         AND mod.user_id = auth.uid()
       )
    )
  )
);

-- 5. Seed Default Channels function
CREATE OR REPLACE FUNCTION seed_community_channels()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. FEEDS
  INSERT INTO channels (community_id, name, type, category) VALUES
  (NEW.id, 'Home', 'feed', 'FEEDS');

  -- 2. INFO
  INSERT INTO channels (community_id, name, type, category) VALUES
  (NEW.id, 'announcements', 'announcement', 'INFO'),
  (NEW.id, 'community-guidelines', 'text', 'INFO'), -- Read only mostly
  (NEW.id, 'faqs', 'text', 'INFO');

  -- 3. ENGAGEMENT
  INSERT INTO channels (community_id, name, type, category) VALUES
  (NEW.id, 'intros', 'text', 'INFO'), -- User screenshot shows Intros in INFO
  (NEW.id, 'general-chat', 'text', 'ENGAGEMENT'),
  (NEW.id, 'baraza', 'video', 'ENGAGEMENT'); -- For Live Streams

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new communities
DROP TRIGGER IF EXISTS on_community_created_seed_channels ON communities;
CREATE TRIGGER on_community_created_seed_channels
AFTER INSERT ON communities
FOR EACH ROW
EXECUTE FUNCTION seed_community_channels();

-- Backfill existing communities (Be careful not to duplicate if re-running)
DO $$
DECLARE
  comm RECORD;
BEGIN
  FOR comm IN SELECT id FROM communities LOOP
    -- feed
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'Home', 'feed', 'FEEDS'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'Home');

    -- announcements
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'announcements', 'announcement', 'INFO'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'announcements');

    -- intros
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'intros', 'text', 'INFO'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'intros');
    
    -- general
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'general-chat', 'text', 'ENGAGEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'general-chat');

    -- baraza
     INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'baraza', 'video', 'ENGAGEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'baraza');
    
    -- monitoring: our-leaders
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'our-leaders', 'text', 'MONITORING'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'our-leaders');
    
    -- monitoring: projects-watch
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'projects-watch', 'text', 'MONITORING'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'projects-watch');
    
    -- monitoring: promises-watch
    INSERT INTO channels (community_id, name, type, category)
    SELECT comm.id, 'promises-watch', 'text', 'MONITORING'
    WHERE NOT EXISTS (SELECT 1 FROM channels WHERE community_id = comm.id AND name = 'promises-watch');
  END LOOP;
END;
$$;

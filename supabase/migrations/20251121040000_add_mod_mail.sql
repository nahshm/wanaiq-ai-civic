-- Mod Mail System Migration

-- 1. Create table for mod mail threads
CREATE TABLE IF NOT EXISTS mod_mail_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The user who started the thread
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'archived', 'spam')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mod_mail_threads_community ON mod_mail_threads(community_id);
CREATE INDEX IF NOT EXISTS idx_mod_mail_threads_user ON mod_mail_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_mail_threads_status ON mod_mail_threads(status);

-- 2. Create table for mod mail messages
CREATE TABLE IF NOT EXISTS mod_mail_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES mod_mail_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- For mod-only notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for messages
CREATE INDEX IF NOT EXISTS idx_mod_mail_messages_thread ON mod_mail_messages(thread_id);

-- 3. RLS Policies for mod_mail_threads
ALTER TABLE mod_mail_threads ENABLE ROW LEVEL SECURITY;

-- Users can view threads they created
CREATE POLICY "Users can view own mod mail threads"
ON mod_mail_threads FOR SELECT
USING (auth.uid() = user_id);

-- Moderators can view all threads in their community
CREATE POLICY "Moderators can view community mod mail threads"
ON mod_mail_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_moderators
    WHERE community_id = mod_mail_threads.community_id
    AND user_id = auth.uid()
  )
);

-- Users can create threads
CREATE POLICY "Users can create mod mail threads"
ON mod_mail_threads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Moderators can update threads (e.g., archive)
CREATE POLICY "Moderators can update mod mail threads"
ON mod_mail_threads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM community_moderators
    WHERE community_id = mod_mail_threads.community_id
    AND user_id = auth.uid()
  )
);

-- 4. RLS Policies for mod_mail_messages
ALTER TABLE mod_mail_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their own threads (excluding internal notes)
CREATE POLICY "Users can view messages in own threads"
ON mod_mail_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mod_mail_threads
    WHERE id = mod_mail_messages.thread_id
    AND user_id = auth.uid()
  )
  AND is_internal = FALSE
);

-- Moderators can view all messages in their community threads
CREATE POLICY "Moderators can view all messages"
ON mod_mail_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mod_mail_threads t
    JOIN community_moderators m ON t.community_id = m.community_id
    WHERE t.id = mod_mail_messages.thread_id
    AND m.user_id = auth.uid()
  )
);

-- Users can send messages to their own threads
CREATE POLICY "Users can send messages to own threads"
ON mod_mail_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mod_mail_threads
    WHERE id = mod_mail_messages.thread_id
    AND user_id = auth.uid()
  )
  AND auth.uid() = sender_id
  AND is_internal = FALSE
);

-- Moderators can send messages to threads in their community
CREATE POLICY "Moderators can send messages"
ON mod_mail_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mod_mail_threads t
    JOIN community_moderators m ON t.community_id = m.community_id
    WHERE t.id = mod_mail_messages.thread_id
    AND m.user_id = auth.uid()
  )
  AND auth.uid() = sender_id
);

-- 5. Trigger to update updated_at on thread when new message is sent
CREATE OR REPLACE FUNCTION update_mod_mail_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mod_mail_threads
  SET updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mod_mail_thread_timestamp
AFTER INSERT ON mod_mail_messages
FOR EACH ROW
EXECUTE FUNCTION update_mod_mail_thread_timestamp();

-- System-Wide Chat Migration

-- 1. Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT, -- Nullable for direct chats, required for named groups
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON chat_participants(room_id);

-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 4. RLS Policies

-- chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Users can view rooms they are participants in
CREATE POLICY "Users can view their chat rooms"
ON chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = chat_rooms.id
    AND user_id = auth.uid()
  )
);

-- Users can create rooms (logic usually handled by backend/function to ensure participants are added, but allowing insert for now)
CREATE POLICY "Users can create chat rooms"
ON chat_rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- chat_participants
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants of rooms they are in
CREATE POLICY "Users can view participants of their rooms"
ON chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = chat_participants.room_id
    AND cp.user_id = auth.uid()
  )
);

-- Users can join rooms (or be added) - simplified for now
CREATE POLICY "Users can add participants"
ON chat_participants FOR INSERT
WITH CHECK (
  -- Allow if user is adding themselves OR if they are already in the room (adding others)
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = chat_participants.room_id
    AND cp.user_id = auth.uid()
  )
  -- Also allow if it's a new room creation (handled by transaction usually, but RLS is tricky here without function)
);

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in rooms they are in
CREATE POLICY "Users can view messages in their rooms"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
);

-- Users can send messages to rooms they are in
CREATE POLICY "Users can send messages to their rooms"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
  AND auth.uid() = sender_id
);

-- 5. Trigger to update room updated_at on new message
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_room_timestamp
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_timestamp();

-- Fix Chat RLS Policies - Complete Fix (No Recursion)

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view participants of their rooms" ON chat_participants;
DROP POLICY IF EXISTS "Users can view participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can add themselves as participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own participant records" ON chat_participants;
DROP POLICY IF EXISTS "Users can add themselves" ON chat_participants;
DROP POLICY IF EXISTS "Users can update own participant records" ON chat_participants;
DROP POLICY IF EXISTS "Users can view their rooms" ON chat_rooms;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS user_is_room_participant(UUID, UUID);

-- Create a SECURITY DEFINER function to check room membership (bypasses RLS)
CREATE OR REPLACE FUNCTION user_is_room_participant(room_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chat_participants
    WHERE room_id = room_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- chat_participants policies (simplified - no recursion!)
-- Users can only see their own participant records
CREATE POLICY "Users can view own participant records"
ON chat_participants FOR SELECT
USING (user_id = auth.uid());

-- Users can add themselves OR anyone if they're creating a new room
CREATE POLICY "Users can add participants"
ON chat_participants FOR INSERT
WITH CHECK (true); -- Simplified: allow any authenticated user to add participants

-- Users can update their own records (for last_read_at)
CREATE POLICY "Users can update own participant records"
ON chat_participants FOR UPDATE
USING (user_id = auth.uid());

-- chat_rooms policies (using SECURITY DEFINER function)
CREATE POLICY "Users can view their rooms"
ON chat_rooms FOR SELECT
USING (user_is_room_participant(id, auth.uid()));

-- Allow any authenticated user to create rooms
CREATE POLICY "Authenticated users can create rooms"
ON chat_rooms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- chat_messages policies (using SECURITY DEFINER function)
CREATE POLICY "Users can view messages in their rooms"
ON chat_messages FOR SELECT
USING (user_is_room_participant(room_id, auth.uid()));

CREATE POLICY "Users can send messages"
ON chat_messages FOR INSERT
WITH CHECK (
  user_is_room_participant(room_id, auth.uid()) AND
  sender_id = auth.uid()
);

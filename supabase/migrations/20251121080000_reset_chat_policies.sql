-- Complete RLS reset for chat_rooms
-- This will drop ALL policies and recreate them cleanly

-- Drop ALL existing policies on chat_rooms
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_rooms' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON chat_rooms';
    END LOOP;
END $$;

-- Now create fresh, simple policies
CREATE POLICY "allow_authenticated_select"
ON chat_rooms FOR SELECT
TO authenticated
USING (user_is_room_participant(id, auth.uid()));

CREATE POLICY "allow_authenticated_insert"
ON chat_rooms FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

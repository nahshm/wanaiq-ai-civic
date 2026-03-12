-- Simplify chat_rooms INSERT policy even further

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON chat_rooms;

-- Create the simplest possible INSERT policy - just check authentication
CREATE POLICY "Allow authenticated inserts"
ON chat_rooms FOR INSERT
TO authenticated
WITH CHECK (true);

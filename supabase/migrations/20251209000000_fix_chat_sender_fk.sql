-- Migration: Fix chat_messages foreign key to profiles
-- Description: Explicitly adds FK to allow embedding sender profiles.
-- Clean up bad data first to avoid FK violations.

-- 1. Remove orphaned messages (where sender does not exist in profiles)
-- This is necessary because existing bad data will block the constraint creation.
DELETE FROM chat_messages 
WHERE sender_id NOT IN (SELECT id FROM profiles);

-- 2. Drop existing constraint if it exists (to ensure clean slate)
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;

-- 3. Add explicit Foreign Key to profiles
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';

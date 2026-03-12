
-- Add updated_at column to chat_messages for edit tracking
-- The column already exists per the schema, but let's ensure it and add edited_at for explicit edit flag
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;

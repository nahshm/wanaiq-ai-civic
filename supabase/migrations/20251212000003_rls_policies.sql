-- Add RLS policies for chat_messages and forum_replies
-- These policies allow proper CRUD operations for authenticated users

-- =====================
-- CHAT_MESSAGES POLICIES
-- =====================

-- Allow anyone to view chat messages (for channel members)
CREATE POLICY "Anyone can view chat messages"
ON public.chat_messages FOR SELECT
USING (true);

-- Allow authenticated users to insert messages
CREATE POLICY "Authenticated users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Allow users to update their own messages (for reactions)
CREATE POLICY "Users can update own messages"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = sender_id);

-- =====================
-- FORUM_REPLIES POLICIES
-- =====================

-- Allow anyone to view forum replies
CREATE POLICY "Anyone can view forum replies"
ON public.forum_replies FOR SELECT
USING (true);

-- Allow authenticated users to post replies
CREATE POLICY "Authenticated users can post replies"
ON public.forum_replies FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Allow users to delete their own replies
CREATE POLICY "Users can delete own replies"
ON public.forum_replies FOR DELETE
USING (auth.uid() = author_id);

-- Allow users to update their own replies
CREATE POLICY "Users can update own replies"
ON public.forum_replies FOR UPDATE
USING (auth.uid() = author_id);

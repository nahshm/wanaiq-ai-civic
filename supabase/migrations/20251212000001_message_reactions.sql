-- Message Reactions Table
-- Stores emoji reactions on chat messages

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each user can only react with the same emoji once per message
    UNIQUE(message_id, user_id, emoji)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view reactions
CREATE POLICY "Reactions are viewable by everyone"
    ON public.message_reactions FOR SELECT
    USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
    ON public.message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
    ON public.message_reactions FOR DELETE
    USING (auth.uid() = user_id);

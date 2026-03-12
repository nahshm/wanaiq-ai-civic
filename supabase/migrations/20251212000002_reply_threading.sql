-- Add reply threading to chat messages and reactions to forum replies

-- 1. Add reply_to column to chat_messages for threading
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages(reply_to_id);

-- 2. Forum Reply Reactions Table
CREATE TABLE IF NOT EXISTS public.forum_reply_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reply_id UUID NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(reply_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_forum_reply_reactions_reply_id ON public.forum_reply_reactions(reply_id);

-- 3. Forum Thread Reactions Table (for upvoting threads)
CREATE TABLE IF NOT EXISTS public.forum_thread_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(thread_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_forum_thread_reactions_thread_id ON public.forum_thread_reactions(thread_id);

-- Enable RLS
ALTER TABLE public.forum_reply_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_reply_reactions
CREATE POLICY "Forum reply reactions are viewable by everyone"
    ON public.forum_reply_reactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add forum reply reactions"
    ON public.forum_reply_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own forum reply reactions"
    ON public.forum_reply_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for forum_thread_reactions
CREATE POLICY "Forum thread reactions are viewable by everyone"
    ON public.forum_thread_reactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add forum thread reactions"
    ON public.forum_thread_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own forum thread reactions"
    ON public.forum_thread_reactions FOR DELETE
    USING (auth.uid() = user_id);

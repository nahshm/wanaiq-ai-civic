-- Create table for storing RAG chat history and analytics
CREATE TABLE IF NOT EXISTS rag_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    query TEXT NOT NULL,
    answer TEXT,
    sources JSONB, -- Array of source objects
    ai_confidence FLOAT,
    language TEXT DEFAULT 'en', -- 'en' or 'sw'
    processing_time_ms INTEGER,
    feedback_rating INTEGER, -- 1-5 stars from user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics and history retrieval
CREATE INDEX IF NOT EXISTS idx_rag_history_session ON rag_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_history_user ON rag_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_created_at ON rag_chat_history(created_at DESC);

-- RLS Policies
ALTER TABLE rag_chat_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own rag history" ON rag_chat_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (Edge Functions) can insert
-- (Implicitly allowed if using service role key, but for client-side inserts if needed:)
CREATE POLICY "Users can insert own rag history" ON rag_chat_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. AI Configurations (stores provider keys - service role only)
CREATE TABLE public.ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_slug TEXT UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    models JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

-- No public policies - service role only access

-- 2. Moderation Logs
CREATE TABLE public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL,
    content_preview TEXT,
    verdict TEXT NOT NULL CHECK (verdict IN ('APPROVED', 'NEEDS_REVISION', 'BLOCKED')),
    reason TEXT,
    ai_confidence REAL,
    model_used TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own moderation logs"
ON public.moderation_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Service role inserts via edge function (no insert policy for anon/authenticated)

-- 3. Routing Logs
CREATE TABLE public.routing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issue_description TEXT NOT NULL,
    location TEXT,
    issue_type TEXT,
    department_slug TEXT,
    department_name TEXT,
    severity INTEGER CHECK (severity BETWEEN 1 AND 10),
    confidence REAL,
    recommended_actions JSONB,
    model_used TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.routing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routing logs"
ON public.routing_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. Vectors (RAG knowledge base)
CREATE TABLE public.vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    source_type TEXT,
    source_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vectors"
ON public.vectors FOR SELECT TO authenticated
USING (true);

-- Create index for vector similarity search
CREATE INDEX vectors_embedding_idx ON public.vectors
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. RAG Chat History
CREATE TABLE public.rag_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB,
    model_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rag_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own chat history"
ON public.rag_chat_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.rag_chat_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RPC for vector similarity search
CREATE OR REPLACE FUNCTION public.match_documents(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        v.id,
        v.content,
        v.metadata,
        1 - (v.embedding <=> query_embedding) AS similarity
    FROM vectors v
    WHERE 1 - (v.embedding <=> query_embedding) > match_threshold
    ORDER BY v.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Timestamp trigger for ai_configurations
CREATE TRIGGER update_ai_configurations_updated_at
BEFORE UPDATE ON public.ai_configurations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

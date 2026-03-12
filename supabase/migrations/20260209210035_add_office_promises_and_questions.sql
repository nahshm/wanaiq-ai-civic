-- Create office_promises table for tracking official's public commitments
CREATE TABLE IF NOT EXISTS public.office_promises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_holder_id UUID NOT NULL REFERENCES public.office_holders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- infrastructure, education, healthcare, etc.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Create office_questions table for citizen Q&A
CREATE TABLE IF NOT EXISTS public.office_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_holder_id UUID NOT NULL REFERENCES public.office_holders(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    asked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_answer CHECK (
        (answer IS NOT NULL AND answered_at IS NOT NULL AND answered_by IS NOT NULL) OR
        (answer IS NULL AND answered_at IS NULL AND answered_by IS NULL)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_office_promises_holder ON public.office_promises(office_holder_id);
CREATE INDEX IF NOT EXISTS idx_office_promises_status ON public.office_promises(status);
CREATE INDEX IF NOT EXISTS idx_office_promises_created ON public.office_promises(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_office_questions_holder ON public.office_questions(office_holder_id);
CREATE INDEX IF NOT EXISTS idx_office_questions_asked_by ON public.office_questions(asked_by);
CREATE INDEX IF NOT EXISTS idx_office_questions_answered ON public.office_questions(answered_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_office_questions_upvotes ON public.office_questions(upvotes DESC);

-- Enable RLS
ALTER TABLE public.office_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for office_promises
CREATE POLICY "Anyone can view promises"
    ON public.office_promises FOR SELECT
    USING (true);

CREATE POLICY "Office holders can create their own promises"
    ON public.office_promises FOR INSERT
    WITH CHECK (
        office_holder_id IN (
            SELECT id FROM public.office_holders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Office holders can update their own promises"
    ON public.office_promises FOR UPDATE
    USING (
        office_holder_id IN (
            SELECT id FROM public.office_holders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Office holders can delete their own promises"
    ON public.office_promises FOR DELETE
    USING (
        office_holder_id IN (
            SELECT id FROM public.office_holders WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for office_questions
CREATE POLICY "Anyone can view questions"
    ON public.office_questions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can ask questions"
    ON public.office_questions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND asked_by = auth.uid());

CREATE POLICY "Question askers can update their own questions (within 15 minutes)"
    ON public.office_questions FOR UPDATE
    USING (
        asked_by = auth.uid() AND
        asked_at > NOW() - INTERVAL '15 minutes' AND
        answer IS NULL
    );

CREATE POLICY "Office holders can answer questions directed at them"
    ON public.office_questions FOR UPDATE
    USING (
        office_holder_id IN (
            SELECT id FROM public.office_holders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Question askers can delete their own unanswered questions"
    ON public.office_questions FOR DELETE
    USING (asked_by = auth.uid() AND answer IS NULL);

-- Function to automatically update updated_at on promises
CREATE OR REPLACE FUNCTION update_office_promises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_office_promises_updated_at
    BEFORE UPDATE ON public.office_promises
    FOR EACH ROW
    EXECUTE FUNCTION update_office_promises_updated_at();

-- Grant permissions
GRANT SELECT ON public.office_promises TO anon, authenticated;
GRANT SELECT ON public.office_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.office_promises TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.office_questions TO authenticated;

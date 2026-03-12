-- Set up trigger for updated_at early so it can be used by both tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create institution_handlers table first
CREATE TABLE IF NOT EXISTS public.institution_handlers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.government_institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_institution_handlers_institution_id ON public.institution_handlers(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_handlers_user_id ON public.institution_handlers(user_id);

ALTER TABLE public.institution_handlers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view institution handlers"
    ON public.institution_handlers
    FOR SELECT
    USING (true);

-- Adding updated_at trigger for institution_handlers
CREATE TRIGGER handle_institution_handlers_updated_at
    BEFORE UPDATE ON public.institution_handlers
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Add policy to allow admins to manage handlers
CREATE POLICY "Admins can manage institution handlers"
    ON public.institution_handlers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Create institution_updates table for official broadcast messages
CREATE TABLE IF NOT EXISTS public.institution_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.government_institutions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_institution_updates_institution_id ON public.institution_updates(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_updates_created_at ON public.institution_updates(created_at DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE public.institution_updates ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can read updates
CREATE POLICY "Anyone can view institution updates"
    ON public.institution_updates
    FOR SELECT
    USING (true);

-- 2. Only assigned institution handlers can create updates
CREATE POLICY "Assigned handlers can create updates"
    ON public.institution_updates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.institution_handlers ih
            WHERE ih.user_id = auth.uid()
            AND ih.institution_id = institution_id
            AND ih.status = 'active'
        )
    );

-- 3. Only the original author can update their posts (assuming they are still active handlers)
CREATE POLICY "Authors can update their own posts"
    ON public.institution_updates
    FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.institution_handlers ih
            WHERE ih.user_id = auth.uid()
            AND ih.institution_id = institution_id
            AND ih.status = 'active'
        )
    );

-- 4. Only the original author can delete their posts
CREATE POLICY "Authors can delete their own posts"
    ON public.institution_updates
    FOR DELETE
    USING (author_id = auth.uid());

-- Function already created at the top of the file.

CREATE TRIGGER handle_institution_updates_updated_at
    BEFORE UPDATE ON public.institution_updates
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Add policy to allow admins to manage updates
CREATE POLICY "Admins can manage institution updates"
    ON public.institution_updates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Add policy to allow assigned institution handlers to manage updates
CREATE POLICY "Assigned handlers can manage updates"
    ON public.institution_updates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_handlers ih
            WHERE ih.user_id = auth.uid()
            AND ih.institution_id = institution_updates.institution_id
        )
    );

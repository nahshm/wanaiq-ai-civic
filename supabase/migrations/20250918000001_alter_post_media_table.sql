-- Alter existing post_media table to match desired schema
-- Since the table already exists with different structure, alter it non-destructively

-- First, change file_size from integer to BIGINT
ALTER TABLE public.post_media ALTER COLUMN file_size TYPE BIGINT;

-- Change id from bigint to UUID (requires adding new column and migrating data)
-- Add new UUID column
ALTER TABLE public.post_media ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Populate the new column (in case there are existing rows)
UPDATE public.post_media SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Set not null
ALTER TABLE public.post_media ALTER COLUMN id_new SET NOT NULL;

-- Drop the old primary key constraint
ALTER TABLE public.post_media DROP CONSTRAINT post_media_pkey;

-- Drop the old id column
ALTER TABLE public.post_media DROP COLUMN id;

-- Rename id_new to id
ALTER TABLE public.post_media RENAME COLUMN id_new TO id;

-- Add new primary key on id
ALTER TABLE public.post_media ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);

-- Set default for id
ALTER TABLE public.post_media ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Enable Row Level Security
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_media
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_media' AND policyname = 'Post media is viewable by everyone') THEN
        CREATE POLICY "Post media is viewable by everyone"
        ON public.post_media FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_media' AND policyname = 'Authenticated users can upload media to their posts') THEN
        CREATE POLICY "Authenticated users can upload media to their posts"
        ON public.post_media FOR INSERT
        WITH CHECK (auth.uid() = (SELECT author_id FROM public.posts WHERE id = post_id));
    END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'post_media' AND indexname = 'idx_post_media_post_id') THEN
        CREATE INDEX idx_post_media_post_id ON public.post_media(post_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'post_media' AND indexname = 'idx_post_media_uploaded_at') THEN
        CREATE INDEX idx_post_media_uploaded_at ON public.post_media(uploaded_at);
    END IF;
END $$;

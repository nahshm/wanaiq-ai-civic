-- Add detailed fields to officials table
ALTER TABLE public.officials
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS committees JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb;

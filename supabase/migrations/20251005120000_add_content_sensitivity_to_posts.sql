-- Add content sensitivity and NGO verification fields to posts table
-- Migration: Add content sensitivity system to posts
-- Date: 2025-10-05

-- Add contentSensitivity column with enum values
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS content_sensitivity TEXT DEFAULT 'public'
CHECK (content_sensitivity IN ('public', 'sensitive', 'crisis'));

-- Add isNgoVerified column for NGO verification
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_ngo_verified BOOLEAN DEFAULT FALSE;

-- Create index for content sensitivity for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_content_sensitivity ON public.posts(content_sensitivity);

-- Create index for NGO verified posts
CREATE INDEX IF NOT EXISTS idx_posts_is_ngo_verified ON public.posts(is_ngo_verified);

-- Update RLS policies to include new columns (no changes needed as they inherit from table policies)
-- The existing policies already allow users to insert/update their own posts

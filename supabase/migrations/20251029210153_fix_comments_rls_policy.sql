-- Fix comments RLS policies to allow proper joins with profiles
-- The issue is that the comments table needs to allow joins with profiles for the foreign key relationship

-- Drop existing policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create new policies that allow proper joins
CREATE POLICY "Comments are viewable by everyone"
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = author_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = author_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = author_id AND auth.role() = 'authenticated');

-- Allow the profiles join for comments
CREATE POLICY "Allow profiles join for comments"
ON public.profiles FOR SELECT
USING (true);

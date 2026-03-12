CREATE TABLE public.education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT DEFAULT 'beginner',
  author_id UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  assignment_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.education_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage education content"
ON public.education_content FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Published education content is readable"
ON public.education_content FOR SELECT TO authenticated
USING (status = 'published');

CREATE POLICY "Assigned users can update their content"
ON public.education_content FOR UPDATE TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());
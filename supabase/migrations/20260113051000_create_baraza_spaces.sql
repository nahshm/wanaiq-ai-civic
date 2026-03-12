-- Create baraza_spaces table for live audio spaces feature
CREATE TABLE IF NOT EXISTS public.baraza_spaces (
  space_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_baraza_spaces_host_user ON public.baraza_spaces(host_user_id);
CREATE INDEX IF NOT EXISTS idx_baraza_spaces_is_live ON public.baraza_spaces(is_live);
CREATE INDEX IF NOT EXISTS idx_baraza_spaces_created_at ON public.baraza_spaces(created_at DESC);

-- Enable RLS
ALTER TABLE public.baraza_spaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Baraza spaces are viewable by everyone" ON public.baraza_spaces
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own baraza spaces" ON public.baraza_spaces
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Users can update their own baraza spaces" ON public.baraza_spaces
  FOR UPDATE USING (auth.uid() = host_user_id);

CREATE POLICY "Users can delete their own baraza spaces" ON public.baraza_spaces
  FOR DELETE USING (auth.uid() = host_user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_baraza_spaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_baraza_spaces_updated_at
  BEFORE UPDATE ON public.baraza_spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_baraza_spaces_updated_at();

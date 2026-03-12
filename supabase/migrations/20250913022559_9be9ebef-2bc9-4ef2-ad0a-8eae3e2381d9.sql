-- Create enum for official levels
CREATE TYPE public.official_level AS ENUM ('executive', 'governor', 'senator', 'mp', 'women_rep', 'mca');

-- Create enum for promise status
CREATE TYPE public.promise_status AS ENUM ('completed', 'ongoing', 'not_started', 'cancelled');

-- Create table for government officials
CREATE TABLE public.officials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  level official_level NOT NULL,
  constituency TEXT,
  county TEXT,
  party TEXT,
  photo_url TEXT,
  manifesto_url TEXT,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for development promises
CREATE TABLE public.development_promises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  official_id UUID NOT NULL REFERENCES public.officials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status promise_status NOT NULL DEFAULT 'not_started',
  budget_allocated DECIMAL(15,2),
  budget_used DECIMAL(15,2),
  funding_source TEXT,
  contractor TEXT,
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  location TEXT,
  beneficiaries_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for promise updates/progress reports
CREATE TABLE public.promise_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promise_id UUID NOT NULL REFERENCES public.development_promises(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_percentage INTEGER,
  amount_spent DECIMAL(15,2),
  photos JSONB,
  documents JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promise_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (transparency)
CREATE POLICY "Officials are viewable by everyone" 
ON public.officials 
FOR SELECT 
USING (true);

CREATE POLICY "Development promises are viewable by everyone" 
ON public.development_promises 
FOR SELECT 
USING (true);

CREATE POLICY "Promise updates are viewable by everyone" 
ON public.promise_updates 
FOR SELECT 
USING (true);

-- Create policies for authenticated users to add updates
CREATE POLICY "Authenticated users can add promise updates" 
ON public.promise_updates 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX idx_officials_level ON public.officials(level);
CREATE INDEX idx_officials_county ON public.officials(county);
CREATE INDEX idx_promises_official_id ON public.development_promises(official_id);
CREATE INDEX idx_promises_status ON public.development_promises(status);
CREATE INDEX idx_promises_category ON public.development_promises(category);
CREATE INDEX idx_promise_updates_promise_id ON public.promise_updates(promise_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_officials_updated_at
BEFORE UPDATE ON public.officials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promises_updated_at
BEFORE UPDATE ON public.development_promises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
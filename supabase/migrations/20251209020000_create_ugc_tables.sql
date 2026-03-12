-- Migration: Create UGC tables (Projects & Promises)
-- Description: Adds tables for 'projects-watch' and 'promises-watch' features.

-- 1. Government Projects
CREATE TABLE IF NOT EXISTS government_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'stalled', 'cancelled')),
  
  -- Location Scope
  county TEXT, -- e.g. "Nairobi"
  constituency TEXT,
  ward TEXT,
  
  budget_allocated NUMERIC,
  budget_spent NUMERIC,
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE government_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view projects" ON government_projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON government_projects FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 2. Development Promises (Campaign Promises)
CREATE TABLE IF NOT EXISTS development_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'KEPT', 'BROKEN')),
  
  -- Location Scope
  county TEXT,
  constituency TEXT,
  ward TEXT,
  
  -- Linked Official (Optional)
  official_id UUID REFERENCES officials(id), -- Note: using 'officials' table if it exists, or update later to 'government_positions' Holder?
  -- For now, allow null or generic linking.
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE development_promises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view promises" ON development_promises FOR SELECT USING (true);
CREATE POLICY "Users can create promises" ON development_promises FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 3. Notify
NOTIFY pgrst, 'reload config';

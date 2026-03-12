-- Migration: Create missing tables for OfficeHub features
-- Description: Creates offices, office_manifestos, and office_proposals tables with RLS and triggers.

BEGIN;

-- 1. Ensure public.offices exists and has the necessary columns
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES public.government_positions(id) ON DELETE CASCADE UNIQUE
);

-- Safely add columns we know are needed (won't error if they exist)
ALTER TABLE public.offices 
    ADD COLUMN IF NOT EXISTS position_code TEXT,
    ADD COLUMN IF NOT EXISTS country_code TEXT,
    ADD COLUMN IF NOT EXISTS jurisdiction_name TEXT,
    ADD COLUMN IF NOT EXISTS governance_level TEXT,
    ADD COLUMN IF NOT EXISTS budget_info JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS resolutions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_offices_position_id ON public.offices(position_id);

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offices' AND policyname = 'Anyone can view offices') THEN
        CREATE POLICY "Anyone can view offices" ON public.offices FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offices' AND policyname = 'Office holders can update offices') THEN
        CREATE POLICY "Office holders can update offices" ON public.offices FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.office_holders 
                WHERE office_holders.position_id = offices.position_id 
                AND office_holders.user_id = auth.uid() 
                AND office_holders.is_active = true
            )
        );
    END IF;
END $$;

-- Backfill offices for existing positions
INSERT INTO public.offices (position_id, position_code, country_code, jurisdiction_name, governance_level)
SELECT id, position_code, country_code, jurisdiction_name, governance_level 
FROM public.government_positions
ON CONFLICT (position_id) DO NOTHING;

-- Trigger to auto-create office for new positions
CREATE OR REPLACE FUNCTION public.create_office_for_position()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.offices (position_id, position_code, country_code, jurisdiction_name, governance_level) 
    VALUES (NEW.id, NEW.position_code, NEW.country_code, NEW.jurisdiction_name, NEW.governance_level);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_position_created ON public.government_positions;
CREATE TRIGGER on_position_created
    AFTER INSERT ON public.government_positions
    FOR EACH ROW EXECUTE FUNCTION public.create_office_for_position();

-- 2. office_manifestos
CREATE TABLE IF NOT EXISTS public.office_manifestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    office_holder_id UUID REFERENCES public.office_holders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    year INTEGER,
    is_pinned BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_office_manifestos_office ON public.office_manifestos(office_id);
CREATE INDEX IF NOT EXISTS idx_office_manifestos_holder ON public.office_manifestos(office_holder_id);

ALTER TABLE public.office_manifestos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_manifestos' AND policyname = 'Anyone can view manifestos') THEN
        CREATE POLICY "Anyone can view manifestos" ON public.office_manifestos FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_manifestos' AND policyname = 'Authenticated users can upload manifestos') THEN
        CREATE POLICY "Authenticated users can upload manifestos" ON public.office_manifestos FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_manifestos' AND policyname = 'Uploaders can delete their manifestos') THEN
        CREATE POLICY "Uploaders can delete their manifestos" ON public.office_manifestos FOR DELETE 
        USING (uploaded_by = auth.uid());
    END IF;
END $$;

-- 3. office_proposals
CREATE TABLE IF NOT EXISTS public.office_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    holder_response TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_office_proposals_office ON public.office_proposals(office_id);
CREATE INDEX IF NOT EXISTS idx_office_proposals_user ON public.office_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_office_proposals_status ON public.office_proposals(status);

ALTER TABLE public.office_proposals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_proposals' AND policyname = 'Anyone can view proposals') THEN
        CREATE POLICY "Anyone can view proposals" ON public.office_proposals FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_proposals' AND policyname = 'Authenticated users can create proposals') THEN
        CREATE POLICY "Authenticated users can create proposals" ON public.office_proposals FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_proposals' AND policyname = 'Anyone can upvote proposals') THEN
        CREATE POLICY "Anyone can upvote proposals" ON public.office_proposals FOR UPDATE 
        USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Ensure updated_at triggers exist
CREATE OR REPLACE FUNCTION update_office_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_offices_updated_at ON public.offices;
CREATE TRIGGER trigger_update_offices_updated_at BEFORE UPDATE ON public.offices FOR EACH ROW EXECUTE FUNCTION update_office_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_manifestos_updated_at ON public.office_manifestos;
CREATE TRIGGER trigger_update_manifestos_updated_at BEFORE UPDATE ON public.office_manifestos FOR EACH ROW EXECUTE FUNCTION update_office_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_proposals_updated_at ON public.office_proposals;
CREATE TRIGGER trigger_update_proposals_updated_at BEFORE UPDATE ON public.office_proposals FOR EACH ROW EXECUTE FUNCTION update_office_tables_updated_at();

-- Reload schema caches
NOTIFY pgrst, 'reload schema';

COMMIT;

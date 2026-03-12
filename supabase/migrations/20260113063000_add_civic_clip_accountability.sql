-- Add accountability features to civic_clips table
ALTER TABLE public.civic_clips
ADD COLUMN IF NOT EXISTS fact_check_status TEXT DEFAULT 'unverified' 
CHECK (fact_check_status IN ('verified', 'disputed', 'pending', 'unverified')),

ADD COLUMN IF NOT EXISTS official_response TEXT DEFAULT 'none' 
CHECK (official_response IN ('responded', 'awaiting', 'none')),

ADD COLUMN IF NOT EXISTS source_citation_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN civic_clips.fact_check_status IS 'Status of fact checking: verified, disputed, pending, unverified';
COMMENT ON COLUMN civic_clips.official_response IS 'Status of official response: responded, awaiting, none';
COMMENT ON COLUMN civic_clips.source_citation_url IS 'URL to source citation if available';

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_civic_clips_fact_check ON public.civic_clips(fact_check_status);

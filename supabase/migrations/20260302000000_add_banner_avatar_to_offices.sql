-- Migration: Add banner_url and avatar_url columns to government_positions and government_institutions
-- This allows office holders and institution handlers to set custom branding.
-- When unset, the UI falls back to the linked community banner/avatar.

-- government_positions: custom banner/avatar set by the verified office holder
ALTER TABLE public.government_positions
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

COMMENT ON COLUMN public.government_positions.banner_url IS 'Custom banner image for this office position (1920x384px recommended). Falls back to linked community banner if null.';
COMMENT ON COLUMN public.government_positions.custom_avatar_url IS 'Custom avatar for this office position. Falls back to holder profile avatar or placeholder.';

-- government_institutions: custom banner/avatar set by verified institution handlers
ALTER TABLE public.government_institutions
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

COMMENT ON COLUMN public.government_institutions.banner_url IS 'Custom banner image for this institution (1920x384px recommended). Falls back to linked community banner if null.';
COMMENT ON COLUMN public.government_institutions.custom_avatar_url IS 'Custom avatar for this institution. Falls back to placeholder if null.';

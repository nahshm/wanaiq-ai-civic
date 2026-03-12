-- Migration: Add Civic Action Hub Tables and Enhance Officials
-- Date: 2025-11-20

-- 1. Enhance officials table with proper location IDs and Ward support
ALTER TABLE officials 
ADD COLUMN IF NOT EXISTS ward text,
ADD COLUMN IF NOT EXISTS ward_id uuid REFERENCES wards(id),
ADD COLUMN IF NOT EXISTS constituency_id uuid REFERENCES constituencies(id),
ADD COLUMN IF NOT EXISTS county_id uuid REFERENCES counties(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_officials_ward_id ON officials(ward_id);
CREATE INDEX IF NOT EXISTS idx_officials_constituency_id ON officials(constituency_id);
CREATE INDEX IF NOT EXISTS idx_officials_county_id ON officials(county_id);

-- 2. Create Civic Actions table
CREATE TABLE IF NOT EXISTS civic_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Action Details
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'water', 'roads', 'security', 'bursary', etc.
    action_type TEXT NOT NULL DEFAULT 'report_issue', -- 'report_issue', 'track_project', 'feedback'
    action_level TEXT NOT NULL DEFAULT 'ward', -- 'ward', 'constituency', 'county', 'national'
    
    -- Status Tracking
    status TEXT DEFAULT 'submitted', -- 'submitted', 'acknowledged', 'in_progress', 'resolved', 'rejected'
    case_number TEXT UNIQUE, -- Auto-generated e.g., NBI-2024-1234
    urgency TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Location Data (Snapshot at time of creation)
    ward_id UUID REFERENCES wards(id),
    constituency_id UUID REFERENCES constituencies(id),
    county_id UUID REFERENCES counties(id),
    location_text TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Media
    media_urls TEXT[],
    
    -- Engagement
    upvotes INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Civic Action Updates (Audit Trail)
CREATE TABLE IF NOT EXISTS civic_action_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES civic_actions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id), -- Who made the update (user or official)
    
    previous_status TEXT,
    new_status TEXT,
    comment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE civic_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_action_updates ENABLE ROW LEVEL SECURITY;

-- Policies for civic_actions
CREATE POLICY "Civic actions are viewable by everyone if public"
ON civic_actions FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create civic actions"
ON civic_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions"
ON civic_actions FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for civic_action_updates
CREATE POLICY "Updates are viewable by everyone"
ON civic_action_updates FOR SELECT
USING (true);

CREATE POLICY "Users can create updates"
ON civic_action_updates FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 5. Trigger to auto-generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Format: [CATEGORY]-[YEAR]-[RANDOM] e.g., WAT-2025-X8Y9
    NEW.case_number := UPPER(SUBSTRING(NEW.category, 1, 3)) || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(NEW.id::text), 1, 4));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_case_number
    BEFORE INSERT ON civic_actions
    FOR EACH ROW
    EXECUTE FUNCTION generate_case_number();

-- 6. Trigger to update updated_at
CREATE TRIGGER update_civic_actions_updated_at
    BEFORE UPDATE ON civic_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

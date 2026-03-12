-- =====================================================
-- Template-Driven Geographic Data: Phase 1 Migration
-- =====================================================
-- Creates polymorphic administrative_divisions table
-- to replace hardcoded counties/constituencies/wards
-- Supports 1-5 level hierarchies for global scaling
-- =====================================================

-- 1. Create polymorphic administrative_divisions table
CREATE TABLE IF NOT EXISTS administrative_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Country association
    country_code VARCHAR(3) NOT NULL REFERENCES country_governance_templates(country_code),
    
    -- Division identity
    division_code VARCHAR(50), -- ISO 3166-2 or local code (e.g., "US-CA", "KE-30")
    name VARCHAR(200) NOT NULL,
    name_local VARCHAR(200), -- Native script name
    
    -- Hierarchical positioning
    governance_level VARCHAR(50) NOT NULL, -- "state", "county", "prefecture", etc.
    level_index INTEGER NOT NULL CHECK (level_index BETWEEN 1 AND 5),
    parent_id UUID REFERENCES administrative_divisions(id) ON DELETE CASCADE,
    
    -- Metadata
    population INTEGER,
    area_sq_km DECIMAL(10, 2),
    metadata JSONB DEFAULT '{}'::jsonb, -- Extensible country-specific fields
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_division_code UNIQUE(country_code, division_code),
    CONSTRAINT unique_division_name_per_parent UNIQUE(country_code, parent_id, name)
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_div_country ON administrative_divisions(country_code);
CREATE INDEX IF NOT EXISTS idx_admin_div_level ON administrative_divisions(governance_level);
CREATE INDEX IF NOT EXISTS idx_admin_div_level_idx ON administrative_divisions(level_index);
CREATE INDEX IF NOT EXISTS idx_admin_div_parent ON administrative_divisions(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_div_country_level ON administrative_divisions(country_code, governance_level);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_administrative_division_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_administrative_division_timestamp ON administrative_divisions;
CREATE TRIGGER set_administrative_division_timestamp
    BEFORE UPDATE ON administrative_divisions
    FOR EACH ROW
    EXECUTE FUNCTION update_administrative_division_timestamp();

-- 4. Migrate existing Kenya data to new schema
-- Counties (Level 1)
INSERT INTO administrative_divisions (
    country_code,
    division_code,
    name,
    governance_level,
    level_index,
    population,
    parent_id
)
SELECT 
    'KE' as country_code,
    'KE-' || LPAD(ROW_NUMBER() OVER (ORDER BY name)::TEXT, 2, '0') as division_code,
    name,
    'county' as governance_level,
    1 as level_index,
    population,
    NULL as parent_id
FROM counties
WHERE country = 'KE' OR country = 'Kenya'
ON CONFLICT (country_code, division_code) DO NOTHING;

-- Constituencies (Level 2)
INSERT INTO administrative_divisions (
    country_code,
    division_code,
    name,
    governance_level,
    level_index,
    population,
    parent_id
)
SELECT 
    'KE' as country_code,
    'KE-CONST-' || c.id as division_code,
    c.name,
    'constituency' as governance_level,
    2 as level_index,
    c.population,
    ad.id as parent_id
FROM constituencies c
INNER JOIN counties co ON c.county_id = co.id
INNER JOIN administrative_divisions ad ON ad.name = co.name 
    AND ad.country_code = 'KE' 
    AND ad.governance_level = 'county'
WHERE co.country = 'KE' OR co.country = 'Kenya'
ON CONFLICT (country_code, division_code) DO NOTHING;

-- Wards (Level 3)
INSERT INTO administrative_divisions (
    country_code,
    division_code,
    name,
    governance_level,
    level_index,
    population,
    parent_id
)
SELECT 
    'KE' as country_code,
    'KE-WARD-' || w.id as division_code,
    w.name,
    'ward' as governance_level,
    3 as level_index,
    w.population,
    ad.id as parent_id
FROM wards w
INNER JOIN constituencies c ON w.constituency_id = c.id
INNER JOIN administrative_divisions ad ON ad.division_code = 'KE-CONST-' || c.id
    AND ad.country_code = 'KE'
    AND ad.governance_level = 'constituency'
ON CONFLICT (country_code, division_code) DO NOTHING;

-- 5. Drop old tables (data is now safely in administrative_divisions)
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS constituencies CASCADE;
DROP TABLE IF EXISTS counties CASCADE;

-- 6. Create backward-compatible views
-- This allows existing code to continue working during migration
CREATE OR REPLACE VIEW counties AS
SELECT 
    id::uuid as id,
    name,
    country_code as country,
    population,
    created_at
FROM administrative_divisions
WHERE governance_level = 'county';

CREATE OR REPLACE VIEW constituencies AS
SELECT 
    ad.id::uuid as id,
    ad.name,
    ad.parent_id as county_id,
    ad.population,
    ad.created_at,
    -- Join to parent county for backward compatibility
    jsonb_build_object('name', parent.name) as counties
FROM administrative_divisions ad
LEFT JOIN administrative_divisions parent ON ad.parent_id = parent.id
WHERE ad.governance_level = 'constituency';

CREATE OR REPLACE VIEW wards AS
SELECT 
    ad.id::uuid as id,
    ad.name,
    ad.parent_id as constituency_id,
    ad.population,
    ad.created_at,
    -- Join to parent constituency for backward compatibility
    jsonb_build_object(
        'name', parent.name,
        'counties', jsonb_build_object('name', grandparent.name)
    ) as constituencies
FROM administrative_divisions ad
LEFT JOIN administrative_divisions parent ON ad.parent_id = parent.id
LEFT JOIN administrative_divisions grandparent ON parent.parent_id = grandparent.id
WHERE ad.governance_level = 'ward';

-- 7. Add RLS policies for secure access
ALTER TABLE administrative_divisions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view administrative divisions"
    ON administrative_divisions FOR SELECT
    USING (true);

-- Authenticated users can insert (for submissions)
CREATE POLICY "Authenticated users can suggest divisions"
    ON administrative_divisions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "Admins can update divisions"
    ON administrative_divisions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete divisions"
    ON administrative_divisions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

COMMENT ON TABLE administrative_divisions IS 'Polymorphic table for global administrative hierarchies supporting 1-5 governance levels';
COMMENT ON COLUMN administrative_divisions.governance_level IS 'Template-defined level name (e.g., state, province, prefecture, county, lga)';
COMMENT ON COLUMN administrative_divisions.level_index IS 'Numeric hierarchy position (1=top-level, 5=deepest)';
COMMENT ON COLUMN administrative_divisions.parent_id IS 'Self-referencing FK for hierarchical relationships';
COMMENT ON COLUMN administrative_divisions.metadata IS 'JSONB field for country-specific attributes (e.g., state_code for USA, pincode for India)';

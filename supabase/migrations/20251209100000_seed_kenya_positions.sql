-- Migration: Seed Kenya Governance Template and Positions
-- Description: Populates Kenya's governance structure with all 47 counties, 
-- key national positions, and sets up the framework for UGC office claims.
-- IMPORTANT: This seeds OFFICES (permanent), NOT holders (temporary/UGC).

-- ==========================================
-- 1. KENYA GOVERNANCE TEMPLATE
-- ==========================================

INSERT INTO country_governance_templates (
    country_code,
    country_name,
    flag_emoji,
    governance_system,
    is_verified,
    submitted_by
) VALUES (
    'KE',
    'Kenya',
    '🇰🇪',
    '{
        "levels": ["nation", "county", "constituency", "ward"],
        "nation": {
            "positions": ["President", "Deputy President", "Cabinet Secretary"],
            "count": 1
        },
        "county": {
            "positions": ["Governor", "Deputy Governor", "Senator", "Women Representative"],
            "count": 47
        },
        "constituency": {
            "positions": ["Member of Parliament"],
            "count": 290
        },
        "ward": {
            "positions": ["Member of County Assembly"],
            "count": 1450
        }
    }'::jsonb,
    true,  -- Pre-verified as platform default
    NULL   -- System created
) ON CONFLICT (country_code) DO UPDATE SET
    governance_system = EXCLUDED.governance_system,
    is_verified = true;

-- ==========================================
-- 2. NATIONAL POSITIONS
-- ==========================================

-- President
INSERT INTO government_positions (
    position_code, title, description, country_code, governance_level,
    jurisdiction_name, jurisdiction_code, term_years, term_limit,
    next_election_date, election_type, is_elected, responsibilities, authority_level
) VALUES (
    'KE:president',
    'President of Kenya',
    'Head of State and Government of the Republic of Kenya',
    'KE', 'nation', 'Kenya', 'KE',
    5, 2, '2027-08-09', 'general', true,
    'Executive authority, Commander-in-Chief, Head of Cabinet',
    100
) ON CONFLICT (position_code) DO NOTHING;

-- Deputy President
INSERT INTO government_positions (
    position_code, title, description, country_code, governance_level,
    jurisdiction_name, jurisdiction_code, term_years, term_limit,
    next_election_date, election_type, is_elected, responsibilities, authority_level
) VALUES (
    'KE:deputy-president',
    'Deputy President of Kenya',
    'Principal Assistant to the President',
    'KE', 'nation', 'Kenya', 'KE',
    5, 2, '2027-08-09', 'general', true,
    'Deputizes for President, Supervises Government operations',
    95
) ON CONFLICT (position_code) DO NOTHING;

-- ==========================================
-- 3. COUNTY-LEVEL POSITIONS (47 Counties)
-- ==========================================

-- This DO block creates positions for all 47 counties
DO $$
DECLARE
    county_record RECORD;
    county_code TEXT;
BEGIN
    -- Iterate through all counties from the counties table
    FOR county_record IN SELECT name FROM counties LOOP
        county_code := lower(regexp_replace(county_record.name, '\s+', '-', 'g'));
        
        -- Governor
        INSERT INTO government_positions (
            position_code, title, description, country_code, governance_level,
            jurisdiction_name, jurisdiction_code, term_years, term_limit,
            next_election_date, election_type, is_elected, responsibilities, authority_level
        ) VALUES (
            'KE:' || county_code || ':governor',
            'Governor of ' || county_record.name || ' County',
            'Chief Executive of ' || county_record.name || ' County Government',
            'KE', 'county', county_record.name || ' County', county_code,
            5, 2, '2027-08-09', 'general', true,
            'County executive authority, Development coordination, Service delivery',
            70
        ) ON CONFLICT (position_code) DO NOTHING;
        
        -- Deputy Governor
        INSERT INTO government_positions (
            position_code, title, description, country_code, governance_level,
            jurisdiction_name, jurisdiction_code, term_years, term_limit,
            next_election_date, election_type, is_elected, responsibilities, authority_level
        ) VALUES (
            'KE:' || county_code || ':deputy-governor',
            'Deputy Governor of ' || county_record.name || ' County',
            'Deputy to the Governor of ' || county_record.name || ' County',
            'KE', 'county', county_record.name || ' County', county_code,
            5, 2, '2027-08-09', 'general', true,
            'Deputizes for Governor, Assigned county functions',
            68
        ) ON CONFLICT (position_code) DO NOTHING;
        
        -- Senator
        INSERT INTO government_positions (
            position_code, title, description, country_code, governance_level,
            jurisdiction_name, jurisdiction_code, term_years, term_limit,
            next_election_date, election_type, is_elected, responsibilities, authority_level
        ) VALUES (
            'KE:' || county_code || ':senator',
            'Senator for ' || county_record.name || ' County',
            'Represents ' || county_record.name || ' County in the Senate',
            'KE', 'county', county_record.name || ' County', county_code,
            5, NULL, '2027-08-09', 'general', true,
            'Legislation, County interests in Parliament, Revenue allocation',
            65
        ) ON CONFLICT (position_code) DO NOTHING;
        
        -- Women Representative
        INSERT INTO government_positions (
            position_code, title, description, country_code, governance_level,
            jurisdiction_name, jurisdiction_code, term_years, term_limit,
            next_election_date, election_type, is_elected, responsibilities, authority_level
        ) VALUES (
            'KE:' || county_code || ':women-rep',
            'Women Representative for ' || county_record.name || ' County',
            'Represents women of ' || county_record.name || ' County in the National Assembly',
            'KE', 'county', county_record.name || ' County', county_code,
            5, NULL, '2027-08-09', 'general', true,
            'Women affairs, Affirmative action, Legislation',
            65
        ) ON CONFLICT (position_code) DO NOTHING;
        
    END LOOP;
END;
$$;

-- ==========================================
-- 4. CONSTITUENCY-LEVEL POSITIONS (MPs)
-- ==========================================

DO $$
DECLARE
    const_record RECORD;
    const_code TEXT;
    county_name TEXT;
BEGIN
    FOR const_record IN 
        SELECT c.name as const_name, co.name as county_name 
        FROM constituencies c 
        JOIN counties co ON c.county_id = co.id 
    LOOP
        const_code := lower(regexp_replace(const_record.const_name, '\s+', '-', 'g'));
        
        INSERT INTO government_positions (
            position_code, title, description, country_code, governance_level,
            jurisdiction_name, jurisdiction_code, term_years, term_limit,
            next_election_date, election_type, is_elected, responsibilities, authority_level
        ) VALUES (
            'KE:' || const_code || ':mp',
            'Member of Parliament for ' || const_record.const_name,
            'Represents ' || const_record.const_name || ' Constituency in the National Assembly',
            'KE', 'constituency', const_record.const_name || ' Constituency', const_code,
            5, NULL, '2027-08-09', 'general', true,
            'Legislation, Constituency development, Representation',
            60
        ) ON CONFLICT (position_code) DO NOTHING;
    END LOOP;
END;
$$;

-- ==========================================
-- 5. WARD-LEVEL POSITIONS (MCAs)
-- ==========================================

DO $$
DECLARE
    ward_record RECORD;
    ward_code TEXT;
BEGIN
    FOR ward_record IN 
        SELECT w.name as ward_name, c.name as const_name 
        FROM wards w 
        JOIN constituencies c ON w.constituency_id = c.id 
    LOOP
        ward_code := lower(regexp_replace(ward_record.ward_name, '\s+', '-', 'g'));
        
        INSERT INTO government_positions (
            position_code, title, description, country_code, governance_level,
            jurisdiction_name, jurisdiction_code, term_years, term_limit,
            next_election_date, election_type, is_elected, responsibilities, authority_level
        ) VALUES (
            'KE:' || ward_code || ':mca',
            'MCA for ' || ward_record.ward_name || ' Ward',
            'Member of County Assembly representing ' || ward_record.ward_name || ' Ward',
            'KE', 'ward', ward_record.ward_name || ' Ward', ward_code,
            5, NULL, '2027-08-09', 'general', true,
            'County legislation, Ward development, Oversight',
            50
        ) ON CONFLICT (position_code) DO NOTHING;
    END LOOP;
END;
$$;

-- ==========================================
-- 6. NOTIFY POSTGREST TO RELOAD
-- ==========================================
NOTIFY pgrst, 'reload config';

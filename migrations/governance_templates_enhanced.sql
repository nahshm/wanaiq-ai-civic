-- =====================================================
-- Enhanced Governance Templates with Display Labels
-- =====================================================
-- Updates existing templates and adds new ones with
-- proper label metadata for template-driven UI
-- =====================================================

-- 1. Update Kenya template with display labels
UPDATE country_governance_templates
SET governance_system = jsonb_set(
    jsonb_set(
        jsonb_set(
            governance_system,
            '{county,label}',
            '"County"'
        ),
        '{constituency,label}',
        '"Constituency"'
    ),
    '{ward,label}',
    '"Ward"'
)
WHERE country_code = 'KE';

-- Add plural labels
UPDATE country_governance_templates
SET governance_system = jsonb_set(
    jsonb_set(
        jsonb_set(
            governance_system,
            '{county,label_plural}',
            '"Counties"'
        ),
        '{constituency,label_plural}',
        '"Constituencies"'
    ),
    '{ward,label_plural}',
    '"Wards"'
)
WHERE country_code = 'KE';

-- 2. Create USA governance template (4 levels)
INSERT INTO country_governance_templates (
    country_code,
    country_name,
    flag_emoji,
    governance_system,
    is_verified,
    submitted_by
) VALUES (
    'US',
    'United States',
    '🇺🇸',
    '{
        "levels": ["state", "county", "municipality", "township"],
        "state": {
            "label": "State",
            "label_plural": "States",
            "positions": ["Governor", "Lieutenant Governor", "State Senator", "State Representative"],
            "count": 50
        },
        "county": {
            "label": "County",
            "label_plural": "Counties",
            "positions": ["County Commissioner", "County Executive", "Sheriff"],
            "count": 3143,
            "parent_level": "state"
        },
        "municipality": {
            "label": "Municipality",
            "label_plural": "Municipalities",
            "positions": ["Mayor", "City Council Member"],
            "count": 19495,
            "parent_level": "county"
        },
        "township": {
            "label": "Township",
            "label_plural": "Townships",
            "positions": ["Township Supervisor", "Township Trustee"],
            "count": 16504,
            "parent_level": "county"
        }
    }'::jsonb,
    true,
    NULL
) ON CONFLICT (country_code) DO UPDATE
SET governance_system = EXCLUDED.governance_system,
    is_verified = true;

-- 3. Create Nigeria governance template (3 levels)
INSERT INTO country_governance_templates (
    country_code,
    country_name,
    flag_emoji,
    governance_system,
    is_verified,
    submitted_by
) VALUES (
    'NG',
    'Nigeria',
    '🇳🇬',
    '{
        "levels": ["state", "lga", "ward"],
        "state": {
            "label": "State",
            "label_plural": "States",
            "positions": ["Governor", "Deputy Governor", "State Senator"],
            "count": 36
        },
        "lga": {
            "label": "LGA",
            "label_plural": "LGAs",
            "positions": ["LGA Chairman", "Councilor"],
            "count": 774,
            "parent_level": "state",
            "description": "Local Government Area"
        },
        "ward": {
            "label": "Ward",
            "label_plural": "Wards",
            "positions": ["Ward Councilor"],
            "count": 8812,
            "parent_level": "lga"
        }
    }'::jsonb,
    true,
    NULL
) ON CONFLICT (country_code) DO UPDATE
SET governance_system = EXCLUDED.governance_system,
    is_verified = true;

-- 4. Create UK governance template (3 levels - variable)
INSERT INTO country_governance_templates (
    country_code,
    country_name,
    flag_emoji,
    governance_system,
    is_verified,
    submitted_by
) VALUES (
    'GB',
    'United Kingdom',
    '🇬🇧',
    '{
        "levels": ["country", "county", "district"],
        "country": {
            "label": "Home Nation",
            "label_plural": "Home Nations",
            "positions": ["First Minister", "Prime Minister"],
            "count": 4,
            "notes": "England, Scotland, Wales, Northern Ireland"
        },
        "county": {
            "label": "County",
            "label_plural": "Counties",
            "positions": ["County Councillor"],
            "count": 86,
            "parent_level": "country"
        },
        "district": {
            "label": "District",
            "label_plural": "Districts",
            "positions": ["District Councillor", "Elected Mayor"],
            "count": 309,
            "parent_level": "county"
        }
    }'::jsonb,
    true,
    NULL
) ON CONFLICT (country_code) DO UPDATE
SET governance_system = EXCLUDED.governance_system,
    is_verified = true;

-- 5. Create South Africa governance template (3 levels)
INSERT INTO country_governance_templates (
    country_code,
    country_name,
    flag_emoji,
    governance_system,
    is_verified,
    submitted_by
) VALUES (
    'ZA',
    'South Africa',
    '🇿🇦',
    '{
        "levels": ["province", "district", "municipality"],
        "province": {
            "label": "Province",
            "label_plural": "Provinces",
            "positions": ["Premier", "Member of Provincial Legislature"],
            "count": 9
        },
        "district": {
            "label": "District",
            "label_plural": "Districts",
            "positions": ["District Mayor"],
            "count": 44,
            "parent_level": "province"
        },
        "municipality": {
            "label": "Municipality",
            "label_plural": "Municipalities",  
            "positions": ["Municipal Mayor", "Municipal Councillor"],
            "count": 205,
            "parent_level": "district"
        }
    }'::jsonb,
    true,
    NULL
) ON CONFLICT (country_code) DO UPDATE
SET governance_system = EXCLUDED.governance_system,
    is_verified = true;

-- 6. Verify template structure
SELECT 
    country_code,
    country_name,
    governance_system->'levels' as levels,
    jsonb_array_length(governance_system->'levels') as level_count
FROM country_governance_templates
WHERE country_code IN ('KE', 'US', 'NG', 'GB', 'ZA')
ORDER BY country_code;

COMMENT ON TABLE country_governance_templates IS 'Stores governance structures for countries with JSONB levels array and metadata for template-driven UI rendering';

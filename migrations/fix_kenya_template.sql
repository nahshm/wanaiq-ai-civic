-- =====================================================
-- FIX: Kenya Template - Remove Invalid "Nation" Level
-- =====================================================
-- The existing Kenya template incorrectly includes "nation"
-- as a geographic division level. Kenya IS the nation.
-- Geographic divisions should be: County → Constituency → Ward
-- =====================================================

-- Update Kenya template to remove "nation" from levels array
UPDATE country_governance_templates
SET governance_system = '{
    "levels": ["county", "constituency", "ward"],
    "county": {
        "label": "County",
        "label_plural": "Counties",
        "positions": ["Governor", "Deputy Governor", "Senator", "Women Representative"],
        "count": 47
    },
    "constituency": {
        "label": "Constituency",
        "label_plural": "Constituencies",
        "positions": ["Member of Parliament"],
        "count": 290,
        "parent_level": "county"
    },
    "ward": {
        "label": "Ward",
        "label_plural": "Wards",
        "positions": ["Member of County Assembly"],
        "count": 1450,
        "parent_level": "constituency"
    }
}'::jsonb
WHERE country_code = 'KE';

-- Verify the fix
SELECT 
    country_code,
    country_name,
    governance_system->'levels' as levels,
    jsonb_array_length(governance_system->'levels') as level_count
FROM country_governance_templates
WHERE country_code = 'KE';

-- Check if your specific profile IDs exist in administrative_divisions
-- Using your county_id as example

SELECT 
    'county' as type,
    id, 
    name, 
    governance_level,
    country_code
FROM administrative_divisions
WHERE id = 'e029a99b-43ed-4430-a744-ee7eec00152e'

UNION ALL

SELECT 
    'constituency' as type,
    id, 
    name, 
    governance_level,
    country_code
FROM administrative_divisions
WHERE id = 'c2cb4dfb-f501-4520-b02a-811de6bdc877'

UNION ALL

SELECT 
    'ward' as type,
    id, 
    name, 
    governance_level,
    country_code
FROM administrative_divisions
WHERE id = 'b6226b93-7ae6-43b2-84e2-6f84f662588f';

-- Also check what columns the profiles table actually has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('county', 'constituency', 'ward', 'county_id', 'constituency_id', 'ward_id')
ORDER BY column_name;

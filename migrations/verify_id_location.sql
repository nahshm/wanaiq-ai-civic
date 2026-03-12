-- Check where your profile IDs actually exist
-- Testing with your profile's county_id: e029a99b-43ed-4430-a744-ee7eec00152e

-- Check in OLD counties table
SELECT 'old_counties' as source, id, name 
FROM counties 
WHERE id = 'e029a99b-43ed-4430-a744-ee7eec00152e'

UNION ALL

-- Check in NEW administrative_divisions table  
SELECT 'new_admin_divisions' as source, id, name
FROM administrative_divisions
WHERE id = 'e029a99b-43ed-4430-a744-ee7eec00152e'
  AND governance_level = 'county';

-- Also check your constituency_id
SELECT 'old_constituencies' as source, id, name
FROM constituencies
WHERE id = 'c2cb4dfb-f501-4520-b02a-811de6bdc877'

UNION ALL

SELECT 'new_admin_divisions' as source, id, name
FROM administrative_divisions
WHERE id = 'c2cb4dfb-f501-4520-b02a-811de6bdc877'
  AND governance_level = 'constituency';

-- And your ward_id
SELECT 'old_wards' as source, id, name
FROM wards
WHERE id = 'b6226b93-7ae6-43b2-84e2-6f84f662588f'

UNION ALL

SELECT 'new_admin_divisions' as source, id, name
FROM administrative_divisions
WHERE id = 'b6226b93-7ae6-43b2-84e2-6f84f662588f'
  AND governance_level = 'ward';

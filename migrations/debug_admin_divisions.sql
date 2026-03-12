-- Debug: Check if the IDs exist in administrative_divisions
-- Using one of your county_ids as example

-- Check county
SELECT id, name, governance_level, country_code
FROM administrative_divisions
WHERE id = 'e029a99b-43ed-4430-a744-ee7eec00152e';

-- Check constituency  
SELECT id, name, governance_level, country_code
FROM administrative_divisions
WHERE id = 'c2cb4dfb-f501-4520-b02a-811de6bdc877';

-- Check ward
SELECT id, name, governance_level, country_code
FROM administrative_divisions
WHERE id = 'b6226b93-7ae6-43b2-84e2-6f84f662588f';

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'administrative_divisions'
ORDER BY ordinal_position;

-- Check if there's data with those governance levels
SELECT governance_level, COUNT(*) 
FROM administrative_divisions 
WHERE country_code = 'KE'
GROUP BY governance_level;

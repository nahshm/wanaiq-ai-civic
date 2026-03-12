-- Check if there are separate counties, constituencies, wards tables

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (table_name LIKE '%count%' OR table_name LIKE '%constitu%' OR table_name LIKE '%ward%')
ORDER BY table_name;

-- If counties table exists, check your ID
SELECT * FROM counties WHERE id = 'e029a99b-43ed-4430-a744-ee7eec00152e' LIMIT 1;

-- If constituencies table exists, check your ID  
SELECT * FROM constituencies WHERE id = 'c2cb4dfb-f501-4520-b02a-811de6bdc877' LIMIT 1;

-- If wards table exists, check your ID
SELECT * FROM wards WHERE id = 'b6226b93-7ae6-43b2-84e2-6f84f662588f' LIMIT 1;

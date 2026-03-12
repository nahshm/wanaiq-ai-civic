-- Check the actual column names in the old tables

-- Counties table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'counties'
ORDER BY ordinal_position;

-- Constituencies table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'constituencies'
ORDER BY ordinal_position;

-- Wards table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wards'
ORDER BY ordinal_position;

-- Sample data from each to confirm column names
SELECT * FROM counties LIMIT 1;
SELECT * FROM constituencies LIMIT 1;
SELECT * FROM wards LIMIT 1;

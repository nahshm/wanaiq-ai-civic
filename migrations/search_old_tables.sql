-- Search for your location IDs in ALL tables
-- This will check if the orphaned IDs exist in old/legacy tables

-- List ALL tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Search for tables that might contain your county_id
-- (This is a manual check - look through the tables above for anything geography-related)

-- Common old table names to check:
SELECT 'old_counties' as table_name, COUNT(*) as count FROM old_counties WHERE true LIMIT 1;
SELECT 'counties_backup' as table_name, COUNT(*) FROM counties_backup WHERE true LIMIT 1;
SELECT 'legacy_counties' as table_name, COUNT(*) FROM legacy_counties WHERE true LIMIT 1;

-- Check if there's a geographies or locations table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%geo%' OR table_name LIKE '%location%' OR table_name LIKE '%admin%')
ORDER BY table_name;

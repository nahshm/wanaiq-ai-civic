-- Get official IDs for inserting promises
DO $$
DECLARE
    ruto_id UUID;
    gachagua_id UUID;
    sakaja_id UUID;
    waiguru_id UUID;
    mudavadi_id UUID;
    cheruiyot_id UUID;
    ichungwah_id UUID;
    passaris_id UUID;
    imwatok_id UUID;
BEGIN
    -- Get official IDs
    SELECT id INTO ruto_id FROM officials WHERE name = 'William Samoei Ruto';
    SELECT id INTO gachagua_id FROM officials WHERE name = 'Rigathi Gachagua';
    SELECT id INTO sakaja_id FROM officials WHERE name = 'Johnson Sakaja';
    SELECT id INTO waiguru_id FROM officials WHERE name = 'Anne Waiguru';
    SELECT id INTO mudavadi_id FROM officials WHERE name = 'Musalia Mudavadi';
    SELECT id INTO cheruiyot_id FROM officials WHERE name = 'Aaron Cheruiyot';
    SELECT id INTO ichungwah_id FROM officials WHERE name = 'Kimani Ichung''wah';
    SELECT id INTO passaris_id FROM officials WHERE name = 'Esther Passaris';
    SELECT id INTO imwatok_id FROM officials WHERE name = 'Peter Imwatok';

    -- President Ruto's promises
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (ruto_id, 'Hustler Fund Initiative', 'Digital lending platform to provide affordable credit to small businesses and individuals', 'Financial Inclusion', 'completed', 50000000000, 45000000000, 'Government of Kenya', 'Safaricom PLC', 90, 'Nationwide', 20000000),
    (ruto_id, 'Affordable Housing Program', 'Construction of 250,000 affordable housing units annually', 'Housing', 'ongoing', 500000000000, 120000000000, 'Government & Private Partnership', 'Multiple Contractors', 35, 'Nationwide', 1000000),
    (ruto_id, 'Universal Health Coverage', 'Implement comprehensive healthcare for all Kenyans', 'Healthcare', 'ongoing', 800000000000, 200000000000, 'Government of Kenya', 'Ministry of Health', 25, 'Nationwide', 50000000),
    (ruto_id, 'School Feeding Program', 'Provide meals to all primary school children', 'Education', 'ongoing', 100000000000, 60000000000, 'Government & World Food Programme', 'Various Suppliers', 60, 'Nationwide', 7500000),
    (ruto_id, 'Digital Superhighway', 'Expand broadband connectivity to rural areas', 'ICT Infrastructure', 'ongoing', 200000000000, 75000000000, 'Government & Development Partners', 'Safaricom, Airtel', 40, 'Rural Kenya', 15000000);

    -- Deputy President Gachagua's promises
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (gachagua_id, 'Coffee Revival Program', 'Revitalize coffee farming in Central Kenya', 'Agriculture', 'ongoing', 50000000000, 20000000000, 'Government of Kenya', 'Kenya Coffee Board', 45, 'Central Kenya', 500000),
    (gachagua_id, 'Mt. Kenya Region Development', 'Infrastructure development in Mt. Kenya region', 'Infrastructure', 'ongoing', 300000000000, 80000000000, 'Government of Kenya', 'KeNHA', 30, 'Mt. Kenya Region', 8000000),
    (gachagua_id, 'Tea Sector Reforms', 'Improve tea farmer earnings and market access', 'Agriculture', 'ongoing', 25000000000, 10000000000, 'Government of Kenya', 'Kenya Tea Board', 50, 'Tea Growing Areas', 600000);

    -- Governor Sakaja's promises (Nairobi)
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (sakaja_id, 'Nairobi Bus Rapid Transit', 'Modern BRT system for Nairobi', 'Transport', 'ongoing', 150000000000, 40000000000, 'World Bank & County Government', 'China Road & Bridge Corporation', 35, 'Nairobi County', 4500000),
    (sakaja_id, 'Mukuru Slum Upgrading', 'Infrastructure improvement in Mukuru slums', 'Urban Development', 'ongoing', 80000000000, 25000000000, 'UN-Habitat & County Government', 'Local Contractors', 40, 'Mukuru, Nairobi', 300000),
    (sakaja_id, 'Nairobi Digital City', 'Transform Nairobi into a smart digital city', 'ICT', 'ongoing', 200000000000, 30000000000, 'County Government & Private Partners', 'IBM, Microsoft', 20, 'Nairobi County', 4500000),
    (sakaja_id, 'Green Belt Initiative', 'Plant 10 million trees in Nairobi', 'Environment', 'completed', 5000000000, 4500000000, 'County Government & Partners', 'Kenya Forest Service', 95, 'Nairobi County', 4500000);

    -- Governor Waiguru's promises (Kirinyaga)
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (waiguru_id, 'Mwea Rice Irrigation Modernization', 'Upgrade irrigation systems for rice farming', 'Agriculture', 'ongoing', 30000000000, 15000000000, 'JICA & County Government', 'Japanese Contractors', 55, 'Mwea, Kirinyaga', 50000),
    (waiguru_id, 'Kerugoya Level 5 Hospital', 'Upgrade Kerugoya Hospital to Level 5', 'Healthcare', 'completed', 8000000000, 7500000000, 'County Government', 'Local Contractors', 100, 'Kerugoya, Kirinyaga', 600000),
    (waiguru_id, 'Youth Empowerment Centers', 'Establish youth training centers', 'Youth Development', 'ongoing', 2000000000, 800000000, 'County Government', 'Local Contractors', 45, 'Kirinyaga County', 50000);

    -- Cabinet Secretary Mudavadi's promises
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (mudavadi_id, 'East African Integration', 'Strengthen regional trade partnerships', 'Foreign Policy', 'ongoing', 10000000000, 3000000000, 'Government of Kenya', 'Ministry of Foreign Affairs', 35, 'East Africa', 50000000),
    (mudavadi_id, 'Diaspora Engagement Program', 'Enhance diaspora investment opportunities', 'Foreign Affairs', 'ongoing', 5000000000, 2000000000, 'Government of Kenya', 'Ministry of Foreign Affairs', 40, 'Global', 2000000);

    -- Senator Cheruiyot's promises (Kericho)
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (cheruiyot_id, 'Kericho Tea Roads Improvement', 'Upgrade tea growing area roads', 'Infrastructure', 'ongoing', 15000000000, 8000000000, 'CDF & KeNHA', 'China Wu Yi', 60, 'Kericho County', 800000),
    (cheruiyot_id, 'Youth Polytechnic Expansion', 'Expand technical training facilities', 'Education', 'ongoing', 3000000000, 1500000000, 'CDF', 'Local Contractors', 50, 'Kericho County', 10000);

    -- MP Ichung'wah's promises (Kikuyu)
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (ichungwah_id, 'Kikuyu Market Modernization', 'Upgrade Kikuyu town market facilities', 'Trade', 'completed', 500000000, 480000000, 'CDF', 'Local Contractors', 100, 'Kikuyu Town', 20000),
    (ichungwah_id, 'Borehole Water Projects', 'Drill boreholes for clean water access', 'Water', 'ongoing', 200000000, 120000000, 'CDF & Water Ministry', 'Local Contractors', 70, 'Kikuyu Constituency', 50000);

    -- Women Rep Passaris's promises (Nairobi)
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (passaris_id, 'Women Economic Empowerment', 'Support women-owned businesses', 'Gender', 'ongoing', 1000000000, 600000000, 'Women Rep Fund', 'Various Suppliers', 65, 'Nairobi County', 100000),
    (passaris_id, 'Girl Child Education Support', 'Scholarships and sanitary towels program', 'Education', 'ongoing', 800000000, 500000000, 'Women Rep Fund & Partners', 'Local Suppliers', 70, 'Nairobi County', 150000);

    -- MCA Imwatok's promises (Makongeni Ward)
    INSERT INTO development_promises (official_id, title, description, category, status, budget_allocated, budget_used, funding_source, contractor, progress_percentage, location, beneficiaries_count) VALUES
    (imwatok_id, 'Makongeni Dispensary Upgrade', 'Improve healthcare facilities in the ward', 'Healthcare', 'completed', 50000000, 48000000, 'Ward Development Fund', 'Local Contractors', 100, 'Makongeni Ward', 25000),
    (imwatok_id, 'Street Lighting Project', 'Install LED street lights', 'Infrastructure', 'ongoing', 30000000, 20000000, 'Ward Development Fund', 'Kenya Power', 75, 'Makongeni Ward', 25000);

END $$;
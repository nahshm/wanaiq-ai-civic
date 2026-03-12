-- ============================================
-- KENYA GEOGRAPHY SEED DATA
-- Source: IEBC Official Data (2022) via counties.sql
-- Generated: 2025-12-01T16:50:35.002Z
-- ============================================
-- Total: 47 Counties, Constituencies, and Wards
-- ============================================

-- ============================================
-- INSERT COUNTIES (47 total)
-- ============================================

INSERT INTO counties (name, population, country)
VALUES ('Mombasa', 1208333, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kwale', 866820, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kilifi', 1453787, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Tana River', 315943, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Lamu', 143920, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Taita-Taveta', 340671, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Garissa', 841353, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Wajir', 781263, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Mandera', 1200000, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Marsabit', 459785, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Isiolo', 268002, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Meru', 1545714, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Tharaka Nithi', 393177, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Embu', 608599, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kitui', 1136187, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Machakos', 1421932, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Makueni', 987653, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Nyandarua', 638289, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Nyeri', 759164, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kirinyaga', 610411, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Murang’a', 1056640, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kiambu', 2417735, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Turkana', 926976, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('West pokot', 621241, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Samburu', 310327, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Trans-Nzoia', 990341, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Uasin Gishu', 1163186, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Elgeyo-Marakwet', 454480, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Nandi', 885711, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Baringo', 666763, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Laikipia', 518560, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Nakuru', 2162202, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Narok', 1157873, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kajiado', 1117840, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kericho', 901777, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Bomet', 875689, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kakamega', 1867579, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Vihiga', 590013, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Bungoma', 1670570, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Busia', 893681, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Siaya', 993183, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kisumu', 1155574, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Homa Bay', 1131950, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Migori', 1116436, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Kisii', 1266860, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Nyamira', 605576, 'Kenya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (name, population, country)
VALUES ('Nairobi', 4397073, 'Kenya')
ON CONFLICT (name) DO NOTHING;


-- ============================================
-- INSERT CONSTITUENCIES
-- ============================================

-- Mombasa County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Changamwe', c.id
FROM counties c
WHERE c.name = 'Mombasa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Jomvu', c.id
FROM counties c
WHERE c.name = 'Mombasa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kisauni', c.id
FROM counties c
WHERE c.name = 'Mombasa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Likoni', c.id
FROM counties c
WHERE c.name = 'Mombasa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mvita', c.id
FROM counties c
WHERE c.name = 'Mombasa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyali', c.id
FROM counties c
WHERE c.name = 'Mombasa'
ON CONFLICT DO NOTHING;


-- Kwale County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kinango', c.id
FROM counties c
WHERE c.name = 'Kwale'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lunga Lunga', c.id
FROM counties c
WHERE c.name = 'Kwale'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Msambweni', c.id
FROM counties c
WHERE c.name = 'Kwale'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Matuga', c.id
FROM counties c
WHERE c.name = 'Kwale'
ON CONFLICT DO NOTHING;


-- Kilifi County (7 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kilifi North', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kilifi South', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kaloleni', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ganze', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Magarini', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Rabai', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Malindi', c.id
FROM counties c
WHERE c.name = 'Kilifi'
ON CONFLICT DO NOTHING;


-- Tana River County (3 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Garsen', c.id
FROM counties c
WHERE c.name = 'Tana River'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Galole', c.id
FROM counties c
WHERE c.name = 'Tana River'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bura', c.id
FROM counties c
WHERE c.name = 'Tana River'
ON CONFLICT DO NOTHING;


-- Lamu County (2 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Lamu East', c.id
FROM counties c
WHERE c.name = 'Lamu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lamu West', c.id
FROM counties c
WHERE c.name = 'Lamu'
ON CONFLICT DO NOTHING;


-- Taita-Taveta County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Taveta', c.id
FROM counties c
WHERE c.name = 'Taita-Taveta'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Wundanyi', c.id
FROM counties c
WHERE c.name = 'Taita-Taveta'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mwatate', c.id
FROM counties c
WHERE c.name = 'Taita-Taveta'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Voi', c.id
FROM counties c
WHERE c.name = 'Taita-Taveta'
ON CONFLICT DO NOTHING;


-- Garissa County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Dujis', c.id
FROM counties c
WHERE c.name = 'Garissa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Balambala', c.id
FROM counties c
WHERE c.name = 'Garissa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Dadaab', c.id
FROM counties c
WHERE c.name = 'Garissa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Fafi', c.id
FROM counties c
WHERE c.name = 'Garissa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ijara', c.id
FROM counties c
WHERE c.name = 'Garissa'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lagdera', c.id
FROM counties c
WHERE c.name = 'Garissa'
ON CONFLICT DO NOTHING;


-- Wajir County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Wajir East', c.id
FROM counties c
WHERE c.name = 'Wajir'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Wajir North', c.id
FROM counties c
WHERE c.name = 'Wajir'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Wajir South', c.id
FROM counties c
WHERE c.name = 'Wajir'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Wajir West', c.id
FROM counties c
WHERE c.name = 'Wajir'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tarbaj', c.id
FROM counties c
WHERE c.name = 'Wajir'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Eldas', c.id
FROM counties c
WHERE c.name = 'Wajir'
ON CONFLICT DO NOTHING;


-- Mandera County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Mandera West', c.id
FROM counties c
WHERE c.name = 'Mandera'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Banissa', c.id
FROM counties c
WHERE c.name = 'Mandera'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'mandera North', c.id
FROM counties c
WHERE c.name = 'Mandera'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'mandera South', c.id
FROM counties c
WHERE c.name = 'Mandera'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'mandera East', c.id
FROM counties c
WHERE c.name = 'Mandera'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lafey', c.id
FROM counties c
WHERE c.name = 'Mandera'
ON CONFLICT DO NOTHING;


-- Marsabit County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Laisamis', c.id
FROM counties c
WHERE c.name = 'Marsabit'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'North Horr', c.id
FROM counties c
WHERE c.name = 'Marsabit'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Saku', c.id
FROM counties c
WHERE c.name = 'Marsabit'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Moyale', c.id
FROM counties c
WHERE c.name = 'Marsabit'
ON CONFLICT DO NOTHING;


-- Isiolo County (2 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Isiolo North', c.id
FROM counties c
WHERE c.name = 'Isiolo'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Isiolo South', c.id
FROM counties c
WHERE c.name = 'Isiolo'
ON CONFLICT DO NOTHING;


-- Meru County (9 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Buuri', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Central Imenti', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Igembe Central', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Igembe South', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Igembe North', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tigania West', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tigania East', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Imenti North', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Imenti South', c.id
FROM counties c
WHERE c.name = 'Meru'
ON CONFLICT DO NOTHING;


-- Tharaka Nithi County (3 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Tharaka', c.id
FROM counties c
WHERE c.name = 'Tharaka Nithi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Chuka/Igambang’ombe', c.id
FROM counties c
WHERE c.name = 'Tharaka Nithi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Maara', c.id
FROM counties c
WHERE c.name = 'Tharaka Nithi'
ON CONFLICT DO NOTHING;


-- Embu County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Manyatta', c.id
FROM counties c
WHERE c.name = 'Embu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Runyenjes', c.id
FROM counties c
WHERE c.name = 'Embu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mbeere North', c.id
FROM counties c
WHERE c.name = 'Embu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mbeere South', c.id
FROM counties c
WHERE c.name = 'Embu'
ON CONFLICT DO NOTHING;


-- Kitui County (8 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kitui West', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kitui Central', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kitui Rural', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kitui South', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kitui East', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mwingi North', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mwingi West', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mwingi Central', c.id
FROM counties c
WHERE c.name = 'Kitui'
ON CONFLICT DO NOTHING;


-- Machakos County (8 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Masinga', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Yatta', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Matungulu', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kangundo', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mwala', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kathiani', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Machakos Town', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mavoko', c.id
FROM counties c
WHERE c.name = 'Machakos'
ON CONFLICT DO NOTHING;


-- Makueni County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Mbooni', c.id
FROM counties c
WHERE c.name = 'Makueni'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kaiti', c.id
FROM counties c
WHERE c.name = 'Makueni'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Makueni', c.id
FROM counties c
WHERE c.name = 'Makueni'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kilome', c.id
FROM counties c
WHERE c.name = 'Makueni'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kibwezi East', c.id
FROM counties c
WHERE c.name = 'Makueni'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kibwezi West', c.id
FROM counties c
WHERE c.name = 'Makueni'
ON CONFLICT DO NOTHING;


-- Nyandarua County (5 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kinangop', c.id
FROM counties c
WHERE c.name = 'Nyandarua'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kipipiri', c.id
FROM counties c
WHERE c.name = 'Nyandarua'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ol Joro Orok', c.id
FROM counties c
WHERE c.name = 'Nyandarua'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ndaragwa', c.id
FROM counties c
WHERE c.name = 'Nyandarua'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ol Kalou', c.id
FROM counties c
WHERE c.name = 'Nyandarua'
ON CONFLICT DO NOTHING;


-- Nyeri County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Mathira', c.id
FROM counties c
WHERE c.name = 'Nyeri'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Othaya', c.id
FROM counties c
WHERE c.name = 'Nyeri'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tetu', c.id
FROM counties c
WHERE c.name = 'Nyeri'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mukurweini', c.id
FROM counties c
WHERE c.name = 'Nyeri'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyeri Town', c.id
FROM counties c
WHERE c.name = 'Nyeri'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kieni', c.id
FROM counties c
WHERE c.name = 'Nyeri'
ON CONFLICT DO NOTHING;


-- Kirinyaga County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kirinyaga Central', c.id
FROM counties c
WHERE c.name = 'Kirinyaga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mwea', c.id
FROM counties c
WHERE c.name = 'Kirinyaga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Gichugu', c.id
FROM counties c
WHERE c.name = 'Kirinyaga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ndia', c.id
FROM counties c
WHERE c.name = 'Kirinyaga'
ON CONFLICT DO NOTHING;


-- Murang’a County (7 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Gatanga', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kandara', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kigumo', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mathioya', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kiharu', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kangema', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Maragwa', c.id
FROM counties c
WHERE c.name = 'Murang’a'
ON CONFLICT DO NOTHING;


-- Kiambu County (12 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Gatundu North', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Gatundu South', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Githunguri', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Juja', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kabete', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kiambaa', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kiambu', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Limuru', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kikuyu', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lari', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ruiru', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Thika Town', c.id
FROM counties c
WHERE c.name = 'Kiambu'
ON CONFLICT DO NOTHING;


-- Turkana County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Turkana Central', c.id
FROM counties c
WHERE c.name = 'Turkana'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Turkana East', c.id
FROM counties c
WHERE c.name = 'Turkana'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Turkana North', c.id
FROM counties c
WHERE c.name = 'Turkana'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Turkana South', c.id
FROM counties c
WHERE c.name = 'Turkana'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Turkana West', c.id
FROM counties c
WHERE c.name = 'Turkana'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Loima', c.id
FROM counties c
WHERE c.name = 'Turkana'
ON CONFLICT DO NOTHING;


-- West pokot County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kapenguria', c.id
FROM counties c
WHERE c.name = 'West pokot'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Sigor', c.id
FROM counties c
WHERE c.name = 'West pokot'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kacheliba', c.id
FROM counties c
WHERE c.name = 'West pokot'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Pokot South', c.id
FROM counties c
WHERE c.name = 'West pokot'
ON CONFLICT DO NOTHING;


-- Samburu County (3 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Samburu East', c.id
FROM counties c
WHERE c.name = 'Samburu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Samburu North', c.id
FROM counties c
WHERE c.name = 'Samburu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Samburu West', c.id
FROM counties c
WHERE c.name = 'Samburu'
ON CONFLICT DO NOTHING;


-- Trans-Nzoia County (5 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Cherang’any', c.id
FROM counties c
WHERE c.name = 'Trans-Nzoia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kwanza', c.id
FROM counties c
WHERE c.name = 'Trans-Nzoia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Endebess', c.id
FROM counties c
WHERE c.name = 'Trans-Nzoia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Saboti', c.id
FROM counties c
WHERE c.name = 'Trans-Nzoia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kiminini', c.id
FROM counties c
WHERE c.name = 'Trans-Nzoia'
ON CONFLICT DO NOTHING;


-- Uasin Gishu County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Ainabkoi', c.id
FROM counties c
WHERE c.name = 'Uasin Gishu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kapseret', c.id
FROM counties c
WHERE c.name = 'Uasin Gishu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kesses', c.id
FROM counties c
WHERE c.name = 'Uasin Gishu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Moiben', c.id
FROM counties c
WHERE c.name = 'Uasin Gishu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Soy', c.id
FROM counties c
WHERE c.name = 'Uasin Gishu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Turbo', c.id
FROM counties c
WHERE c.name = 'Uasin Gishu'
ON CONFLICT DO NOTHING;


-- Elgeyo-Marakwet County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Keiyo North', c.id
FROM counties c
WHERE c.name = 'Elgeyo-Marakwet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Keiyo South', c.id
FROM counties c
WHERE c.name = 'Elgeyo-Marakwet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Marakwet East', c.id
FROM counties c
WHERE c.name = 'Elgeyo-Marakwet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Marakwet West', c.id
FROM counties c
WHERE c.name = 'Elgeyo-Marakwet'
ON CONFLICT DO NOTHING;


-- Nandi County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Aldai', c.id
FROM counties c
WHERE c.name = 'Nandi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Chesumei', c.id
FROM counties c
WHERE c.name = 'Nandi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Emgwen', c.id
FROM counties c
WHERE c.name = 'Nandi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mosop', c.id
FROM counties c
WHERE c.name = 'Nandi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nandi Hills', c.id
FROM counties c
WHERE c.name = 'Nandi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tinderet', c.id
FROM counties c
WHERE c.name = 'Nandi'
ON CONFLICT DO NOTHING;


-- Baringo County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Baringo Central', c.id
FROM counties c
WHERE c.name = 'Baringo'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Baringo North', c.id
FROM counties c
WHERE c.name = 'Baringo'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Baringo South', c.id
FROM counties c
WHERE c.name = 'Baringo'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Eldama Ravine', c.id
FROM counties c
WHERE c.name = 'Baringo'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mogotio', c.id
FROM counties c
WHERE c.name = 'Baringo'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tiaty', c.id
FROM counties c
WHERE c.name = 'Baringo'
ON CONFLICT DO NOTHING;


-- Laikipia County (3 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Laikipia North', c.id
FROM counties c
WHERE c.name = 'Laikipia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Laikipia East', c.id
FROM counties c
WHERE c.name = 'Laikipia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Laikipia West', c.id
FROM counties c
WHERE c.name = 'Laikipia'
ON CONFLICT DO NOTHING;


-- Nakuru County (11 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Nakuru Town East', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nakuru Town West', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Njoro', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Molo', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Gilgil', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Naivasha', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kuresoi North', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kuresoi South', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bahati', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Rongai', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Subukia', c.id
FROM counties c
WHERE c.name = 'Nakuru'
ON CONFLICT DO NOTHING;


-- Narok County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Narok North', c.id
FROM counties c
WHERE c.name = 'Narok'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Narok South', c.id
FROM counties c
WHERE c.name = 'Narok'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Narok East', c.id
FROM counties c
WHERE c.name = 'Narok'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Narok West', c.id
FROM counties c
WHERE c.name = 'Narok'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kilgoris', c.id
FROM counties c
WHERE c.name = 'Narok'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Emurua Dikirr', c.id
FROM counties c
WHERE c.name = 'Narok'
ON CONFLICT DO NOTHING;


-- Kajiado County (5 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kajiado Central', c.id
FROM counties c
WHERE c.name = 'Kajiado'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kajiado East', c.id
FROM counties c
WHERE c.name = 'Kajiado'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kajiado North', c.id
FROM counties c
WHERE c.name = 'Kajiado'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kajiado West', c.id
FROM counties c
WHERE c.name = 'Kajiado'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kajiado South', c.id
FROM counties c
WHERE c.name = 'Kajiado'
ON CONFLICT DO NOTHING;


-- Kericho County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Ainamoi', c.id
FROM counties c
WHERE c.name = 'Kericho'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Belgut', c.id
FROM counties c
WHERE c.name = 'Kericho'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bureti', c.id
FROM counties c
WHERE c.name = 'Kericho'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kipkelion East', c.id
FROM counties c
WHERE c.name = 'Kericho'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kipkelion West', c.id
FROM counties c
WHERE c.name = 'Kericho'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Soin Sigowet', c.id
FROM counties c
WHERE c.name = 'Kericho'
ON CONFLICT DO NOTHING;


-- Bomet County (5 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Sotik', c.id
FROM counties c
WHERE c.name = 'Bomet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bomet Central', c.id
FROM counties c
WHERE c.name = 'Bomet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bomet East', c.id
FROM counties c
WHERE c.name = 'Bomet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Chepalungu', c.id
FROM counties c
WHERE c.name = 'Bomet'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Konoin', c.id
FROM counties c
WHERE c.name = 'Bomet'
ON CONFLICT DO NOTHING;


-- Kakamega County (12 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Butere', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ikolomani', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Khwisero', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lurambi', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Likuyani', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Malava', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Matungu', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mumias East', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mumias West', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Navakholo', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lugari', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Shinyalu', c.id
FROM counties c
WHERE c.name = 'Kakamega'
ON CONFLICT DO NOTHING;


-- Vihiga County (5 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Emuhaya', c.id
FROM counties c
WHERE c.name = 'Vihiga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Hamisi', c.id
FROM counties c
WHERE c.name = 'Vihiga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Sabatia', c.id
FROM counties c
WHERE c.name = 'Vihiga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Vihiga', c.id
FROM counties c
WHERE c.name = 'Vihiga'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Luanda', c.id
FROM counties c
WHERE c.name = 'Vihiga'
ON CONFLICT DO NOTHING;


-- Bungoma County (9 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Bumula', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kanduyi', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Webuye East', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Webuye West', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mt. Elgon', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Sirisia', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Tongaren', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kabuchai', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kimilili', c.id
FROM counties c
WHERE c.name = 'Bungoma'
ON CONFLICT DO NOTHING;


-- Busia County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Teso North', c.id
FROM counties c
WHERE c.name = 'Busia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Teso South', c.id
FROM counties c
WHERE c.name = 'Busia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nambale', c.id
FROM counties c
WHERE c.name = 'Busia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Matayos', c.id
FROM counties c
WHERE c.name = 'Busia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Butula', c.id
FROM counties c
WHERE c.name = 'Busia'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Funyula', c.id
FROM counties c
WHERE c.name = 'Busia'
ON CONFLICT DO NOTHING;


-- Siaya County (6 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Alego Usonga', c.id
FROM counties c
WHERE c.name = 'Siaya'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Gem', c.id
FROM counties c
WHERE c.name = 'Siaya'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bondo', c.id
FROM counties c
WHERE c.name = 'Siaya'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Rarieda', c.id
FROM counties c
WHERE c.name = 'Siaya'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ugenya', c.id
FROM counties c
WHERE c.name = 'Siaya'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ugunja', c.id
FROM counties c
WHERE c.name = 'Siaya'
ON CONFLICT DO NOTHING;


-- Kisumu County (7 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kisumu Central', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kisumu East', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kisumu West', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Seme', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyando', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Muhoroni', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyakach', c.id
FROM counties c
WHERE c.name = 'Kisumu'
ON CONFLICT DO NOTHING;


-- Homa Bay County (8 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Homa Bay Town', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kabondo Kasipul', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Karachuonyo', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kasipul', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ndhiwa', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Rangwe', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Suba North', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Suba South', c.id
FROM counties c
WHERE c.name = 'Homa Bay'
ON CONFLICT DO NOTHING;


-- Migori County (8 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Rongo', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Awendo', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Suna East', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Suna West', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Uriri', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyatike', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kuria East', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kuria West', c.id
FROM counties c
WHERE c.name = 'Migori'
ON CONFLICT DO NOTHING;


-- Kisii County (9 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Kitutu Chache North', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kitutu Chache South', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyaribari Masaba', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Nyaribari Chache', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bomachoge Borabu', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bomachoge Chache', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bobasi', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'South Mugirango', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Bonchari', c.id
FROM counties c
WHERE c.name = 'Kisii'
ON CONFLICT DO NOTHING;


-- Nyamira County (4 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Borabu', c.id
FROM counties c
WHERE c.name = 'Nyamira'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kitutu Masaba', c.id
FROM counties c
WHERE c.name = 'Nyamira'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'West Mugirango', c.id
FROM counties c
WHERE c.name = 'Nyamira'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'North Mugirango', c.id
FROM counties c
WHERE c.name = 'Nyamira'
ON CONFLICT DO NOTHING;


-- Nairobi County (17 constituencies)
INSERT INTO constituencies (name, county_id)
SELECT 'Westlands', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Dagoretti North', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Dagoretti South', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Lang’ata', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kibra', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Roysambu', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kasarani', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Ruaraka', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Embakasi South', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Embakasi North', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Embakasi Central', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Embakasi East', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Embakasi West', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Makadara', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Kamukunji', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Starehe', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;

INSERT INTO constituencies (name, county_id)
SELECT 'Mathare', c.id
FROM counties c
WHERE c.name = 'Nairobi'
ON CONFLICT DO NOTHING;


-- ============================================
-- INSERT WARDS
-- ============================================

-- Changamwe Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Port Reitz', const.id
FROM constituencies const
WHERE const.name = 'Changamwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipevu', const.id
FROM constituencies const
WHERE const.name = 'Changamwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Airport', const.id
FROM constituencies const
WHERE const.name = 'Changamwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Miritini', const.id
FROM constituencies const
WHERE const.name = 'Changamwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chaani', const.id
FROM constituencies const
WHERE const.name = 'Changamwe'
ON CONFLICT DO NOTHING;

-- Jomvu Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Jomvu Kuu', const.id
FROM constituencies const
WHERE const.name = 'Jomvu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magongo', const.id
FROM constituencies const
WHERE const.name = 'Jomvu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mikindani', const.id
FROM constituencies const
WHERE const.name = 'Jomvu'
ON CONFLICT DO NOTHING;

-- Kisauni Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mjambere', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Junda', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bamburi', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwakirunge', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mtopanga', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magogoni', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shanzu', const.id
FROM constituencies const
WHERE const.name = 'Kisauni'
ON CONFLICT DO NOTHING;

-- Likoni Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mtongwe', const.id
FROM constituencies const
WHERE const.name = 'Likoni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shika adabu', const.id
FROM constituencies const
WHERE const.name = 'Likoni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bofu', const.id
FROM constituencies const
WHERE const.name = 'Likoni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Likoni', const.id
FROM constituencies const
WHERE const.name = 'Likoni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Timbwani', const.id
FROM constituencies const
WHERE const.name = 'Likoni'
ON CONFLICT DO NOTHING;

-- Mvita Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mji wa Kale/Makadara', const.id
FROM constituencies const
WHERE const.name = 'Mvita'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tudor', const.id
FROM constituencies const
WHERE const.name = 'Mvita'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tononoka', const.id
FROM constituencies const
WHERE const.name = 'Mvita'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ganjoni/Shimanzi', const.id
FROM constituencies const
WHERE const.name = 'Mvita'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Majengo', const.id
FROM constituencies const
WHERE const.name = 'Mvita'
ON CONFLICT DO NOTHING;

-- Nyali Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Frere Town', const.id
FROM constituencies const
WHERE const.name = 'Nyali'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ziwa la Ng’ombe', const.id
FROM constituencies const
WHERE const.name = 'Nyali'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mkomani', const.id
FROM constituencies const
WHERE const.name = 'Nyali'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kongowea', const.id
FROM constituencies const
WHERE const.name = 'Nyali'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ziwani/Kadzandani', const.id
FROM constituencies const
WHERE const.name = 'Nyali'
ON CONFLICT DO NOTHING;

-- Kinango Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ndavaya', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Puma', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kinango', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chengoni/Samburu', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mackinon Road', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwavumbo', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kasemeni', const.id
FROM constituencies const
WHERE const.name = 'Kinango'
ON CONFLICT DO NOTHING;

-- Lunga Lunga Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Pongwe/Kikoneni', const.id
FROM constituencies const
WHERE const.name = 'Lunga Lunga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dzombo', const.id
FROM constituencies const
WHERE const.name = 'Lunga Lunga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Vanga', const.id
FROM constituencies const
WHERE const.name = 'Lunga Lunga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwereni', const.id
FROM constituencies const
WHERE const.name = 'Lunga Lunga'
ON CONFLICT DO NOTHING;

-- Msambweni Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gombato Bongwe', const.id
FROM constituencies const
WHERE const.name = 'Msambweni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ukunda', const.id
FROM constituencies const
WHERE const.name = 'Msambweni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kinondo', const.id
FROM constituencies const
WHERE const.name = 'Msambweni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ramisi', const.id
FROM constituencies const
WHERE const.name = 'Msambweni'
ON CONFLICT DO NOTHING;

-- Matuga Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Tsimba Golini', const.id
FROM constituencies const
WHERE const.name = 'Matuga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Waa', const.id
FROM constituencies const
WHERE const.name = 'Matuga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tiwi', const.id
FROM constituencies const
WHERE const.name = 'Matuga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kubo South', const.id
FROM constituencies const
WHERE const.name = 'Matuga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mkongani', const.id
FROM constituencies const
WHERE const.name = 'Matuga'
ON CONFLICT DO NOTHING;

-- Kilifi North Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Tezo', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sokoni', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kibarani', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dabaso', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matsangoni', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Watamu', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mnarani', const.id
FROM constituencies const
WHERE const.name = 'Kilifi North'
ON CONFLICT DO NOTHING;

-- Kilifi South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Junju', const.id
FROM constituencies const
WHERE const.name = 'Kilifi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwarakaya', const.id
FROM constituencies const
WHERE const.name = 'Kilifi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shimo la Tewa', const.id
FROM constituencies const
WHERE const.name = 'Kilifi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chasimba', const.id
FROM constituencies const
WHERE const.name = 'Kilifi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mtepeni', const.id
FROM constituencies const
WHERE const.name = 'Kilifi South'
ON CONFLICT DO NOTHING;

-- Kaloleni Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mariakani', const.id
FROM constituencies const
WHERE const.name = 'Kaloleni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kayafungo', const.id
FROM constituencies const
WHERE const.name = 'Kaloleni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaloleni', const.id
FROM constituencies const
WHERE const.name = 'Kaloleni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwanamwinga', const.id
FROM constituencies const
WHERE const.name = 'Kaloleni'
ON CONFLICT DO NOTHING;

-- Ganze Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Dungicha', const.id
FROM constituencies const
WHERE const.name = 'Ganze'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bamba', const.id
FROM constituencies const
WHERE const.name = 'Ganze'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Jaribuni', const.id
FROM constituencies const
WHERE const.name = 'Ganze'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sokoke', const.id
FROM constituencies const
WHERE const.name = 'Ganze'
ON CONFLICT DO NOTHING;

-- Magarini Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Maarafa', const.id
FROM constituencies const
WHERE const.name = 'Magarini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magarini', const.id
FROM constituencies const
WHERE const.name = 'Magarini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gongoni', const.id
FROM constituencies const
WHERE const.name = 'Magarini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Adu', const.id
FROM constituencies const
WHERE const.name = 'Magarini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Garashi', const.id
FROM constituencies const
WHERE const.name = 'Magarini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sabaki', const.id
FROM constituencies const
WHERE const.name = 'Magarini'
ON CONFLICT DO NOTHING;

-- Rabai Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mwawesa', const.id
FROM constituencies const
WHERE const.name = 'Rabai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruruma', const.id
FROM constituencies const
WHERE const.name = 'Rabai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Jibana', const.id
FROM constituencies const
WHERE const.name = 'Rabai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rabai/Kisurutuni', const.id
FROM constituencies const
WHERE const.name = 'Rabai'
ON CONFLICT DO NOTHING;

-- Malindi Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Jilore', const.id
FROM constituencies const
WHERE const.name = 'Malindi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kakuyuni', const.id
FROM constituencies const
WHERE const.name = 'Malindi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ganda', const.id
FROM constituencies const
WHERE const.name = 'Malindi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Malindi Town', const.id
FROM constituencies const
WHERE const.name = 'Malindi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shella', const.id
FROM constituencies const
WHERE const.name = 'Malindi'
ON CONFLICT DO NOTHING;

-- Garsen Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Garsen Central', const.id
FROM constituencies const
WHERE const.name = 'Garsen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Garsen East', const.id
FROM constituencies const
WHERE const.name = 'Garsen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Garsen North', const.id
FROM constituencies const
WHERE const.name = 'Garsen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Garsen South', const.id
FROM constituencies const
WHERE const.name = 'Garsen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipini East', const.id
FROM constituencies const
WHERE const.name = 'Garsen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipini West', const.id
FROM constituencies const
WHERE const.name = 'Garsen'
ON CONFLICT DO NOTHING;

-- Galole Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kinakomba', const.id
FROM constituencies const
WHERE const.name = 'Galole'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mikinduni', const.id
FROM constituencies const
WHERE const.name = 'Galole'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chewani', const.id
FROM constituencies const
WHERE const.name = 'Galole'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wayu', const.id
FROM constituencies const
WHERE const.name = 'Galole'
ON CONFLICT DO NOTHING;

-- Bura Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chewele', const.id
FROM constituencies const
WHERE const.name = 'Bura'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hirimani', const.id
FROM constituencies const
WHERE const.name = 'Bura'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bangale', const.id
FROM constituencies const
WHERE const.name = 'Bura'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Madogo', const.id
FROM constituencies const
WHERE const.name = 'Bura'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sala', const.id
FROM constituencies const
WHERE const.name = 'Bura'
ON CONFLICT DO NOTHING;

-- Lamu East Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Faza', const.id
FROM constituencies const
WHERE const.name = 'Lamu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiunga', const.id
FROM constituencies const
WHERE const.name = 'Lamu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Basuba', const.id
FROM constituencies const
WHERE const.name = 'Lamu East'
ON CONFLICT DO NOTHING;

-- Lamu West Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Shella', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mkomani', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hindi', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mkunumbi', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hongwe', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Witu', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bahari', const.id
FROM constituencies const
WHERE const.name = 'Lamu West'
ON CONFLICT DO NOTHING;

-- Taveta Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chala', const.id
FROM constituencies const
WHERE const.name = 'Taveta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mahoo', const.id
FROM constituencies const
WHERE const.name = 'Taveta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bomani', const.id
FROM constituencies const
WHERE const.name = 'Taveta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mboghoni', const.id
FROM constituencies const
WHERE const.name = 'Taveta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mata', const.id
FROM constituencies const
WHERE const.name = 'Taveta'
ON CONFLICT DO NOTHING;

-- Wundanyi Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wundanyi/Mbale', const.id
FROM constituencies const
WHERE const.name = 'Wundanyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Werugha', const.id
FROM constituencies const
WHERE const.name = 'Wundanyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wumingu/Kishushe', const.id
FROM constituencies const
WHERE const.name = 'Wundanyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwanda/Mgange', const.id
FROM constituencies const
WHERE const.name = 'Wundanyi'
ON CONFLICT DO NOTHING;

-- Mwatate Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ronge', const.id
FROM constituencies const
WHERE const.name = 'Mwatate'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwatate', const.id
FROM constituencies const
WHERE const.name = 'Mwatate'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bura', const.id
FROM constituencies const
WHERE const.name = 'Mwatate'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chawia', const.id
FROM constituencies const
WHERE const.name = 'Mwatate'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wusi/Kishamba', const.id
FROM constituencies const
WHERE const.name = 'Mwatate'
ON CONFLICT DO NOTHING;

-- Voi Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mbololo', const.id
FROM constituencies const
WHERE const.name = 'Voi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaloleni', const.id
FROM constituencies const
WHERE const.name = 'Voi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sagala', const.id
FROM constituencies const
WHERE const.name = 'Voi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marungu', const.id
FROM constituencies const
WHERE const.name = 'Voi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaigau', const.id
FROM constituencies const
WHERE const.name = 'Voi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngolia', const.id
FROM constituencies const
WHERE const.name = 'Voi'
ON CONFLICT DO NOTHING;

-- Dujis Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Waberi', const.id
FROM constituencies const
WHERE const.name = 'Dujis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Galbet', const.id
FROM constituencies const
WHERE const.name = 'Dujis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Dujis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Iftin', const.id
FROM constituencies const
WHERE const.name = 'Dujis'
ON CONFLICT DO NOTHING;

-- Balambala Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Balambala', const.id
FROM constituencies const
WHERE const.name = 'Balambala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Danyere', const.id
FROM constituencies const
WHERE const.name = 'Balambala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Jarajara', const.id
FROM constituencies const
WHERE const.name = 'Balambala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Saka', const.id
FROM constituencies const
WHERE const.name = 'Balambala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sankuri', const.id
FROM constituencies const
WHERE const.name = 'Balambala'
ON CONFLICT DO NOTHING;

-- Dadaab Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Dertu', const.id
FROM constituencies const
WHERE const.name = 'Dadaab'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dadaab', const.id
FROM constituencies const
WHERE const.name = 'Dadaab'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Labasigale', const.id
FROM constituencies const
WHERE const.name = 'Dadaab'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Damajale', const.id
FROM constituencies const
WHERE const.name = 'Dadaab'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Liboi', const.id
FROM constituencies const
WHERE const.name = 'Dadaab'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Abakaile', const.id
FROM constituencies const
WHERE const.name = 'Dadaab'
ON CONFLICT DO NOTHING;

-- Fafi Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Bura', const.id
FROM constituencies const
WHERE const.name = 'Fafi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dekaharia', const.id
FROM constituencies const
WHERE const.name = 'Fafi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Jarajila', const.id
FROM constituencies const
WHERE const.name = 'Fafi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Fafi', const.id
FROM constituencies const
WHERE const.name = 'Fafi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nanighi', const.id
FROM constituencies const
WHERE const.name = 'Fafi'
ON CONFLICT DO NOTHING;

-- Ijara Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Hulugho', const.id
FROM constituencies const
WHERE const.name = 'Ijara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sangailu', const.id
FROM constituencies const
WHERE const.name = 'Ijara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ijara', const.id
FROM constituencies const
WHERE const.name = 'Ijara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Masalani', const.id
FROM constituencies const
WHERE const.name = 'Ijara'
ON CONFLICT DO NOTHING;

-- Lagdera Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Modogashe', const.id
FROM constituencies const
WHERE const.name = 'Lagdera'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bename', const.id
FROM constituencies const
WHERE const.name = 'Lagdera'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Goreale', const.id
FROM constituencies const
WHERE const.name = 'Lagdera'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maalamin', const.id
FROM constituencies const
WHERE const.name = 'Lagdera'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sabena', const.id
FROM constituencies const
WHERE const.name = 'Lagdera'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Baraki', const.id
FROM constituencies const
WHERE const.name = 'Lagdera'
ON CONFLICT DO NOTHING;

-- Wajir East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wagbri', const.id
FROM constituencies const
WHERE const.name = 'Wajir East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Wajir East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Barwago', const.id
FROM constituencies const
WHERE const.name = 'Wajir East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Khorof/Harar', const.id
FROM constituencies const
WHERE const.name = 'Wajir East'
ON CONFLICT DO NOTHING;

-- Wajir North Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gurar', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bute', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Korondile', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Malkagufu', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Batalu', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Danaba', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Godoma', const.id
FROM constituencies const
WHERE const.name = 'Wajir North'
ON CONFLICT DO NOTHING;

-- Wajir South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Benane', const.id
FROM constituencies const
WHERE const.name = 'Wajir South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Burder', const.id
FROM constituencies const
WHERE const.name = 'Wajir South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dadaja Bulla', const.id
FROM constituencies const
WHERE const.name = 'Wajir South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Habaswein', const.id
FROM constituencies const
WHERE const.name = 'Wajir South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lagboghol South', const.id
FROM constituencies const
WHERE const.name = 'Wajir South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ibrahim Ure', const.id
FROM constituencies const
WHERE const.name = 'Wajir South'
ON CONFLICT DO NOTHING;

-- Wajir West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Arbajahan', const.id
FROM constituencies const
WHERE const.name = 'Wajir West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hadado/Athibohol', const.id
FROM constituencies const
WHERE const.name = 'Wajir West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ademasajide', const.id
FROM constituencies const
WHERE const.name = 'Wajir West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ganyure', const.id
FROM constituencies const
WHERE const.name = 'Wajir West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wagalla', const.id
FROM constituencies const
WHERE const.name = 'Wajir West'
ON CONFLICT DO NOTHING;

-- Tarbaj Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Elben', const.id
FROM constituencies const
WHERE const.name = 'Tarbaj'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sarman', const.id
FROM constituencies const
WHERE const.name = 'Tarbaj'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tarbaj', const.id
FROM constituencies const
WHERE const.name = 'Tarbaj'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wargadud', const.id
FROM constituencies const
WHERE const.name = 'Tarbaj'
ON CONFLICT DO NOTHING;

-- Eldas Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Eldas', const.id
FROM constituencies const
WHERE const.name = 'Eldas'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Della', const.id
FROM constituencies const
WHERE const.name = 'Eldas'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lakoley South/Basir', const.id
FROM constituencies const
WHERE const.name = 'Eldas'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Elnur/Tula Tula', const.id
FROM constituencies const
WHERE const.name = 'Eldas'
ON CONFLICT DO NOTHING;

-- Mandera West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Takaba South', const.id
FROM constituencies const
WHERE const.name = 'Mandera West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Takaba', const.id
FROM constituencies const
WHERE const.name = 'Mandera West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lagsure', const.id
FROM constituencies const
WHERE const.name = 'Mandera West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dandu', const.id
FROM constituencies const
WHERE const.name = 'Mandera West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gither', const.id
FROM constituencies const
WHERE const.name = 'Mandera West'
ON CONFLICT DO NOTHING;

-- Banissa Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Banissa', const.id
FROM constituencies const
WHERE const.name = 'Banissa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Derkhale', const.id
FROM constituencies const
WHERE const.name = 'Banissa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Guba', const.id
FROM constituencies const
WHERE const.name = 'Banissa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Malkamari', const.id
FROM constituencies const
WHERE const.name = 'Banissa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiliwehiri', const.id
FROM constituencies const
WHERE const.name = 'Banissa'
ON CONFLICT DO NOTHING;

-- mandera North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ashabito', const.id
FROM constituencies const
WHERE const.name = 'mandera North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Guticha', const.id
FROM constituencies const
WHERE const.name = 'mandera North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marothile', const.id
FROM constituencies const
WHERE const.name = 'mandera North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rhamu', const.id
FROM constituencies const
WHERE const.name = 'mandera North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rhamu Dimtu', const.id
FROM constituencies const
WHERE const.name = 'mandera North'
ON CONFLICT DO NOTHING;

-- mandera South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wargadud', const.id
FROM constituencies const
WHERE const.name = 'mandera South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kutulo', const.id
FROM constituencies const
WHERE const.name = 'mandera South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Elwak South', const.id
FROM constituencies const
WHERE const.name = 'mandera South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Elwak North', const.id
FROM constituencies const
WHERE const.name = 'mandera South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shimbir Fatuma', const.id
FROM constituencies const
WHERE const.name = 'mandera South'
ON CONFLICT DO NOTHING;

-- mandera East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Arabia', const.id
FROM constituencies const
WHERE const.name = 'mandera East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Libehia', const.id
FROM constituencies const
WHERE const.name = 'mandera East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Khalalio', const.id
FROM constituencies const
WHERE const.name = 'mandera East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Neboi', const.id
FROM constituencies const
WHERE const.name = 'mandera East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'mandera East'
ON CONFLICT DO NOTHING;

-- Lafey Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sala', const.id
FROM constituencies const
WHERE const.name = 'Lafey'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Fino', const.id
FROM constituencies const
WHERE const.name = 'Lafey'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lafey', const.id
FROM constituencies const
WHERE const.name = 'Lafey'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Warangara', const.id
FROM constituencies const
WHERE const.name = 'Lafey'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Alungo', const.id
FROM constituencies const
WHERE const.name = 'Lafey'
ON CONFLICT DO NOTHING;

-- Laisamis Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Loiyangalani', const.id
FROM constituencies const
WHERE const.name = 'Laisamis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kargi/South Horr', const.id
FROM constituencies const
WHERE const.name = 'Laisamis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Korr/Ngurunit', const.id
FROM constituencies const
WHERE const.name = 'Laisamis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Logo Logo', const.id
FROM constituencies const
WHERE const.name = 'Laisamis'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Laisamis', const.id
FROM constituencies const
WHERE const.name = 'Laisamis'
ON CONFLICT DO NOTHING;

-- North Horr Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Dukana', const.id
FROM constituencies const
WHERE const.name = 'North Horr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maikona', const.id
FROM constituencies const
WHERE const.name = 'North Horr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Turbi', const.id
FROM constituencies const
WHERE const.name = 'North Horr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Horr', const.id
FROM constituencies const
WHERE const.name = 'North Horr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Illeret', const.id
FROM constituencies const
WHERE const.name = 'North Horr'
ON CONFLICT DO NOTHING;

-- Saku Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sagate/Jaldesa', const.id
FROM constituencies const
WHERE const.name = 'Saku'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karare', const.id
FROM constituencies const
WHERE const.name = 'Saku'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marsabit Central', const.id
FROM constituencies const
WHERE const.name = 'Saku'
ON CONFLICT DO NOTHING;

-- Moyale Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Butiye', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sololo', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Heillu/Manyatta', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Golbo', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Moyale Township', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Uran', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Obbu', const.id
FROM constituencies const
WHERE const.name = 'Moyale'
ON CONFLICT DO NOTHING;

-- Isiolo North Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wabera', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bulla Pesa', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chari', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cherab', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngare Mara', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Burat', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Oldo/Nyiro', const.id
FROM constituencies const
WHERE const.name = 'Isiolo North'
ON CONFLICT DO NOTHING;

-- Isiolo South Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Garba Tulla', const.id
FROM constituencies const
WHERE const.name = 'Isiolo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kina', const.id
FROM constituencies const
WHERE const.name = 'Isiolo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sericho', const.id
FROM constituencies const
WHERE const.name = 'Isiolo South'
ON CONFLICT DO NOTHING;

-- Buuri Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Timau', const.id
FROM constituencies const
WHERE const.name = 'Buuri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kisima', const.id
FROM constituencies const
WHERE const.name = 'Buuri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiirua/Naari', const.id
FROM constituencies const
WHERE const.name = 'Buuri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruiri/Rwarera', const.id
FROM constituencies const
WHERE const.name = 'Buuri'
ON CONFLICT DO NOTHING;

-- Central Imenti Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mwanganthia', const.id
FROM constituencies const
WHERE const.name = 'Central Imenti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Abothuguchi Central', const.id
FROM constituencies const
WHERE const.name = 'Central Imenti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Abothuguchi West', const.id
FROM constituencies const
WHERE const.name = 'Central Imenti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiagu', const.id
FROM constituencies const
WHERE const.name = 'Central Imenti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kibirichia', const.id
FROM constituencies const
WHERE const.name = 'Central Imenti'
ON CONFLICT DO NOTHING;

-- Igembe Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Akirang’ondu', const.id
FROM constituencies const
WHERE const.name = 'Igembe Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Athiru', const.id
FROM constituencies const
WHERE const.name = 'Igembe Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruujine', const.id
FROM constituencies const
WHERE const.name = 'Igembe Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Igembe East Njia', const.id
FROM constituencies const
WHERE const.name = 'Igembe Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangeta', const.id
FROM constituencies const
WHERE const.name = 'Igembe Central'
ON CONFLICT DO NOTHING;

-- Igembe South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Maua', const.id
FROM constituencies const
WHERE const.name = 'Igembe South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kegoi/Antubochiu', const.id
FROM constituencies const
WHERE const.name = 'Igembe South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Athiru', const.id
FROM constituencies const
WHERE const.name = 'Igembe South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gaiti', const.id
FROM constituencies const
WHERE const.name = 'Igembe South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Akachiu', const.id
FROM constituencies const
WHERE const.name = 'Igembe South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanuni', const.id
FROM constituencies const
WHERE const.name = 'Igembe South'
ON CONFLICT DO NOTHING;

-- Igembe North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Antuambui', const.id
FROM constituencies const
WHERE const.name = 'Igembe North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ntunene', const.id
FROM constituencies const
WHERE const.name = 'Igembe North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Antubetwe Kiongo', const.id
FROM constituencies const
WHERE const.name = 'Igembe North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Naathui', const.id
FROM constituencies const
WHERE const.name = 'Igembe North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Amwathi', const.id
FROM constituencies const
WHERE const.name = 'Igembe North'
ON CONFLICT DO NOTHING;

-- Tigania West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Athwana', const.id
FROM constituencies const
WHERE const.name = 'Tigania West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Akithi', const.id
FROM constituencies const
WHERE const.name = 'Tigania West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kianjai', const.id
FROM constituencies const
WHERE const.name = 'Tigania West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nkomo', const.id
FROM constituencies const
WHERE const.name = 'Tigania West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbeu', const.id
FROM constituencies const
WHERE const.name = 'Tigania West'
ON CONFLICT DO NOTHING;

-- Tigania East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Thangatha', const.id
FROM constituencies const
WHERE const.name = 'Tigania East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mikinduri', const.id
FROM constituencies const
WHERE const.name = 'Tigania East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiguchwa', const.id
FROM constituencies const
WHERE const.name = 'Tigania East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mithara', const.id
FROM constituencies const
WHERE const.name = 'Tigania East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karama', const.id
FROM constituencies const
WHERE const.name = 'Tigania East'
ON CONFLICT DO NOTHING;

-- Imenti North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Municipality', const.id
FROM constituencies const
WHERE const.name = 'Imenti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ntima East', const.id
FROM constituencies const
WHERE const.name = 'Imenti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ntima West', const.id
FROM constituencies const
WHERE const.name = 'Imenti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyaki West', const.id
FROM constituencies const
WHERE const.name = 'Imenti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyaki East', const.id
FROM constituencies const
WHERE const.name = 'Imenti North'
ON CONFLICT DO NOTHING;

-- Imenti South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mitunguu', const.id
FROM constituencies const
WHERE const.name = 'Imenti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Igoji East', const.id
FROM constituencies const
WHERE const.name = 'Imenti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Igoji West', const.id
FROM constituencies const
WHERE const.name = 'Imenti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Abogeta East', const.id
FROM constituencies const
WHERE const.name = 'Imenti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Abogeta West', const.id
FROM constituencies const
WHERE const.name = 'Imenti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nkuene', const.id
FROM constituencies const
WHERE const.name = 'Imenti South'
ON CONFLICT DO NOTHING;

-- Tharaka Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gatunga', const.id
FROM constituencies const
WHERE const.name = 'Tharaka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mukothima', const.id
FROM constituencies const
WHERE const.name = 'Tharaka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nkondi', const.id
FROM constituencies const
WHERE const.name = 'Tharaka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chiakariga', const.id
FROM constituencies const
WHERE const.name = 'Tharaka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marimanti', const.id
FROM constituencies const
WHERE const.name = 'Tharaka'
ON CONFLICT DO NOTHING;

-- Chuka/Igambang’ombe Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mariani', const.id
FROM constituencies const
WHERE const.name = 'Chuka/Igambang’ombe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karingani', const.id
FROM constituencies const
WHERE const.name = 'Chuka/Igambang’ombe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magumoni', const.id
FROM constituencies const
WHERE const.name = 'Chuka/Igambang’ombe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugwe', const.id
FROM constituencies const
WHERE const.name = 'Chuka/Igambang’ombe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Igambang’ombe', const.id
FROM constituencies const
WHERE const.name = 'Chuka/Igambang’ombe'
ON CONFLICT DO NOTHING;

-- Maara Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mitheru', const.id
FROM constituencies const
WHERE const.name = 'Maara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muthambi', const.id
FROM constituencies const
WHERE const.name = 'Maara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwimbi', const.id
FROM constituencies const
WHERE const.name = 'Maara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ganga', const.id
FROM constituencies const
WHERE const.name = 'Maara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chogoria', const.id
FROM constituencies const
WHERE const.name = 'Maara'
ON CONFLICT DO NOTHING;

-- Manyatta Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ruguru/Ngandori', const.id
FROM constituencies const
WHERE const.name = 'Manyatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kithimu', const.id
FROM constituencies const
WHERE const.name = 'Manyatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nginda', const.id
FROM constituencies const
WHERE const.name = 'Manyatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbeti North', const.id
FROM constituencies const
WHERE const.name = 'Manyatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kirimari', const.id
FROM constituencies const
WHERE const.name = 'Manyatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gaturi South', const.id
FROM constituencies const
WHERE const.name = 'Manyatta'
ON CONFLICT DO NOTHING;

-- Runyenjes Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gaturi North', const.id
FROM constituencies const
WHERE const.name = 'Runyenjes'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kagaari South', const.id
FROM constituencies const
WHERE const.name = 'Runyenjes'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kagaari North', const.id
FROM constituencies const
WHERE const.name = 'Runyenjes'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Ward', const.id
FROM constituencies const
WHERE const.name = 'Runyenjes'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kyeni North', const.id
FROM constituencies const
WHERE const.name = 'Runyenjes'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kyeni South', const.id
FROM constituencies const
WHERE const.name = 'Runyenjes'
ON CONFLICT DO NOTHING;

-- Mbeere North Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Nthawa', const.id
FROM constituencies const
WHERE const.name = 'Mbeere North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muminji', const.id
FROM constituencies const
WHERE const.name = 'Mbeere North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Evurore', const.id
FROM constituencies const
WHERE const.name = 'Mbeere North'
ON CONFLICT DO NOTHING;

-- Mbeere South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mwea', const.id
FROM constituencies const
WHERE const.name = 'Mbeere South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Amakim', const.id
FROM constituencies const
WHERE const.name = 'Mbeere South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbeti South', const.id
FROM constituencies const
WHERE const.name = 'Mbeere South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mavuria', const.id
FROM constituencies const
WHERE const.name = 'Mbeere South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiambere', const.id
FROM constituencies const
WHERE const.name = 'Mbeere South'
ON CONFLICT DO NOTHING;

-- Kitui West Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mutonguni', const.id
FROM constituencies const
WHERE const.name = 'Kitui West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kauwi', const.id
FROM constituencies const
WHERE const.name = 'Kitui West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matinyani', const.id
FROM constituencies const
WHERE const.name = 'Kitui West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kwa Mutonga/Kithum Ula', const.id
FROM constituencies const
WHERE const.name = 'Kitui West'
ON CONFLICT DO NOTHING;

-- Kitui Central Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Miambani', const.id
FROM constituencies const
WHERE const.name = 'Kitui Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township Kyangwithya West', const.id
FROM constituencies const
WHERE const.name = 'Kitui Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mulango', const.id
FROM constituencies const
WHERE const.name = 'Kitui Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kyangwithya East', const.id
FROM constituencies const
WHERE const.name = 'Kitui Central'
ON CONFLICT DO NOTHING;

-- Kitui Rural Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kisasi', const.id
FROM constituencies const
WHERE const.name = 'Kitui Rural'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbitini', const.id
FROM constituencies const
WHERE const.name = 'Kitui Rural'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kwavonza/Yatta', const.id
FROM constituencies const
WHERE const.name = 'Kitui Rural'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyangi', const.id
FROM constituencies const
WHERE const.name = 'Kitui Rural'
ON CONFLICT DO NOTHING;

-- Kitui South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ikana/Kyantune', const.id
FROM constituencies const
WHERE const.name = 'Kitui South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mutomo', const.id
FROM constituencies const
WHERE const.name = 'Kitui South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mutha', const.id
FROM constituencies const
WHERE const.name = 'Kitui South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ikutha', const.id
FROM constituencies const
WHERE const.name = 'Kitui South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanziko', const.id
FROM constituencies const
WHERE const.name = 'Kitui South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Athi', const.id
FROM constituencies const
WHERE const.name = 'Kitui South'
ON CONFLICT DO NOTHING;

-- Kitui East Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Zombe/Mwitika', const.id
FROM constituencies const
WHERE const.name = 'Kitui East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nzambani', const.id
FROM constituencies const
WHERE const.name = 'Kitui East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chuluni', const.id
FROM constituencies const
WHERE const.name = 'Kitui East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Voo/Kyamatu', const.id
FROM constituencies const
WHERE const.name = 'Kitui East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Endau/Malalani', const.id
FROM constituencies const
WHERE const.name = 'Kitui East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mutito/Kaliku', const.id
FROM constituencies const
WHERE const.name = 'Kitui East'
ON CONFLICT DO NOTHING;

-- Mwingi North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ngomeni', const.id
FROM constituencies const
WHERE const.name = 'Mwingi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kyuso', const.id
FROM constituencies const
WHERE const.name = 'Mwingi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mumoni', const.id
FROM constituencies const
WHERE const.name = 'Mwingi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tseikuru', const.id
FROM constituencies const
WHERE const.name = 'Mwingi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tharaka', const.id
FROM constituencies const
WHERE const.name = 'Mwingi North'
ON CONFLICT DO NOTHING;

-- Mwingi West Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kyome/Thaana', const.id
FROM constituencies const
WHERE const.name = 'Mwingi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nguutani', const.id
FROM constituencies const
WHERE const.name = 'Mwingi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Migwani', const.id
FROM constituencies const
WHERE const.name = 'Mwingi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiomo/Kyethani', const.id
FROM constituencies const
WHERE const.name = 'Mwingi West'
ON CONFLICT DO NOTHING;

-- Mwingi Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Central', const.id
FROM constituencies const
WHERE const.name = 'Mwingi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kivou', const.id
FROM constituencies const
WHERE const.name = 'Mwingi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nguni', const.id
FROM constituencies const
WHERE const.name = 'Mwingi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mui', const.id
FROM constituencies const
WHERE const.name = 'Mwingi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Waita', const.id
FROM constituencies const
WHERE const.name = 'Mwingi Central'
ON CONFLICT DO NOTHING;

-- Masinga Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kivaa', const.id
FROM constituencies const
WHERE const.name = 'Masinga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Masinga', const.id
FROM constituencies const
WHERE const.name = 'Masinga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central', const.id
FROM constituencies const
WHERE const.name = 'Masinga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ekalakala', const.id
FROM constituencies const
WHERE const.name = 'Masinga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muthesya', const.id
FROM constituencies const
WHERE const.name = 'Masinga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndithini', const.id
FROM constituencies const
WHERE const.name = 'Masinga'
ON CONFLICT DO NOTHING;

-- Yatta Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ndalani', const.id
FROM constituencies const
WHERE const.name = 'Yatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matuu', const.id
FROM constituencies const
WHERE const.name = 'Yatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kithimani', const.id
FROM constituencies const
WHERE const.name = 'Yatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ikomba', const.id
FROM constituencies const
WHERE const.name = 'Yatta'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Katangi', const.id
FROM constituencies const
WHERE const.name = 'Yatta'
ON CONFLICT DO NOTHING;

-- Matungulu Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Tala', const.id
FROM constituencies const
WHERE const.name = 'Matungulu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matungulu North', const.id
FROM constituencies const
WHERE const.name = 'Matungulu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matungulu East', const.id
FROM constituencies const
WHERE const.name = 'Matungulu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matungulu West', const.id
FROM constituencies const
WHERE const.name = 'Matungulu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kyeleni', const.id
FROM constituencies const
WHERE const.name = 'Matungulu'
ON CONFLICT DO NOTHING;

-- Kangundo Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kangundo North', const.id
FROM constituencies const
WHERE const.name = 'Kangundo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangundo Central', const.id
FROM constituencies const
WHERE const.name = 'Kangundo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangundo East', const.id
FROM constituencies const
WHERE const.name = 'Kangundo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangundo West', const.id
FROM constituencies const
WHERE const.name = 'Kangundo'
ON CONFLICT DO NOTHING;

-- Mwala Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mbiuni', const.id
FROM constituencies const
WHERE const.name = 'Mwala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Makutano/Mwala', const.id
FROM constituencies const
WHERE const.name = 'Mwala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Masii', const.id
FROM constituencies const
WHERE const.name = 'Mwala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muthetheni', const.id
FROM constituencies const
WHERE const.name = 'Mwala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamunyu', const.id
FROM constituencies const
WHERE const.name = 'Mwala'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kibauni', const.id
FROM constituencies const
WHERE const.name = 'Mwala'
ON CONFLICT DO NOTHING;

-- Kathiani Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mitaboni', const.id
FROM constituencies const
WHERE const.name = 'Kathiani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kathiani Central', const.id
FROM constituencies const
WHERE const.name = 'Kathiani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Upper Kaewa/Iveti', const.id
FROM constituencies const
WHERE const.name = 'Kathiani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lower Kaewa/Kaani', const.id
FROM constituencies const
WHERE const.name = 'Kathiani'
ON CONFLICT DO NOTHING;

-- Machakos Town Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kalama', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mua', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mutitini', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Machakos Central', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mumbuni North', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muvuti/Kiima-Kimwe', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kola', const.id
FROM constituencies const
WHERE const.name = 'Machakos Town'
ON CONFLICT DO NOTHING;

-- Mavoko Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Athi River', const.id
FROM constituencies const
WHERE const.name = 'Mavoko'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kinanie', const.id
FROM constituencies const
WHERE const.name = 'Mavoko'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muthwani', const.id
FROM constituencies const
WHERE const.name = 'Mavoko'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Syokimau/Mulolongo', const.id
FROM constituencies const
WHERE const.name = 'Mavoko'
ON CONFLICT DO NOTHING;

-- Mbooni Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Tulimani', const.id
FROM constituencies const
WHERE const.name = 'Mbooni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbooni', const.id
FROM constituencies const
WHERE const.name = 'Mbooni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kithungo/Kitundu', const.id
FROM constituencies const
WHERE const.name = 'Mbooni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiteta/Kisau', const.id
FROM constituencies const
WHERE const.name = 'Mbooni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Waia-Kako', const.id
FROM constituencies const
WHERE const.name = 'Mbooni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kalawa', const.id
FROM constituencies const
WHERE const.name = 'Mbooni'
ON CONFLICT DO NOTHING;

-- Kaiti Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ukia', const.id
FROM constituencies const
WHERE const.name = 'Kaiti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kee', const.id
FROM constituencies const
WHERE const.name = 'Kaiti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kilungu', const.id
FROM constituencies const
WHERE const.name = 'Kaiti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ilima', const.id
FROM constituencies const
WHERE const.name = 'Kaiti'
ON CONFLICT DO NOTHING;

-- Makueni Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wote', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muvau/Kikuumini', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mavindini', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kitise/Kithuki', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kathonzweni', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nzau/Kilili/Kalamba', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbitini', const.id
FROM constituencies const
WHERE const.name = 'Makueni'
ON CONFLICT DO NOTHING;

-- Kilome Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kasikeu', const.id
FROM constituencies const
WHERE const.name = 'Kilome'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mukaa', const.id
FROM constituencies const
WHERE const.name = 'Kilome'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiima Kiu/Kalanzoni', const.id
FROM constituencies const
WHERE const.name = 'Kilome'
ON CONFLICT DO NOTHING;

-- Kibwezi East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Masongaleni', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mtito Andei', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Thange', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ivingoni/Nzambani', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi East'
ON CONFLICT DO NOTHING;

-- Kibwezi West Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Makindu', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nguumo', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kikumbulyu North', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimumbulyu South', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nguu/Masumba', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Emali/Mulala', const.id
FROM constituencies const
WHERE const.name = 'Kibwezi West'
ON CONFLICT DO NOTHING;

-- Kinangop Constituency (8 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Engineer', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gathara', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Kinangop', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Murungaru', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Njabini/Kiburu', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyakio', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Githabai', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magumu', const.id
FROM constituencies const
WHERE const.name = 'Kinangop'
ON CONFLICT DO NOTHING;

-- Kipipiri Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wanjohi', const.id
FROM constituencies const
WHERE const.name = 'Kipipiri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipipiri', const.id
FROM constituencies const
WHERE const.name = 'Kipipiri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Geta', const.id
FROM constituencies const
WHERE const.name = 'Kipipiri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Githioro', const.id
FROM constituencies const
WHERE const.name = 'Kipipiri'
ON CONFLICT DO NOTHING;

-- Ol Joro Orok Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gathanji', const.id
FROM constituencies const
WHERE const.name = 'Ol Joro Orok'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatima', const.id
FROM constituencies const
WHERE const.name = 'Ol Joro Orok'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Weru', const.id
FROM constituencies const
WHERE const.name = 'Ol Joro Orok'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Charagita', const.id
FROM constituencies const
WHERE const.name = 'Ol Joro Orok'
ON CONFLICT DO NOTHING;

-- Ndaragwa Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Leshau/Pondo', const.id
FROM constituencies const
WHERE const.name = 'Ndaragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiriita', const.id
FROM constituencies const
WHERE const.name = 'Ndaragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central', const.id
FROM constituencies const
WHERE const.name = 'Ndaragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shamata', const.id
FROM constituencies const
WHERE const.name = 'Ndaragwa'
ON CONFLICT DO NOTHING;

-- Ol Kalou Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Karau', const.id
FROM constituencies const
WHERE const.name = 'Ol Kalou'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanjuiri Range', const.id
FROM constituencies const
WHERE const.name = 'Ol Kalou'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mirangine', const.id
FROM constituencies const
WHERE const.name = 'Ol Kalou'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaimbaga', const.id
FROM constituencies const
WHERE const.name = 'Ol Kalou'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rurii', const.id
FROM constituencies const
WHERE const.name = 'Ol Kalou'
ON CONFLICT DO NOTHING;

-- Mathira Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ruguru', const.id
FROM constituencies const
WHERE const.name = 'Mathira'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magutu', const.id
FROM constituencies const
WHERE const.name = 'Mathira'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Iriani', const.id
FROM constituencies const
WHERE const.name = 'Mathira'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Konyu', const.id
FROM constituencies const
WHERE const.name = 'Mathira'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kirimukuyu', const.id
FROM constituencies const
WHERE const.name = 'Mathira'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karatina Town', const.id
FROM constituencies const
WHERE const.name = 'Mathira'
ON CONFLICT DO NOTHING;

-- Othaya Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mahiga', const.id
FROM constituencies const
WHERE const.name = 'Othaya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Iria-Ini', const.id
FROM constituencies const
WHERE const.name = 'Othaya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chinga', const.id
FROM constituencies const
WHERE const.name = 'Othaya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karima', const.id
FROM constituencies const
WHERE const.name = 'Othaya'
ON CONFLICT DO NOTHING;

-- Tetu Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Dedan Kimathi', const.id
FROM constituencies const
WHERE const.name = 'Tetu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamagana', const.id
FROM constituencies const
WHERE const.name = 'Tetu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Aguthi-Gaaki', const.id
FROM constituencies const
WHERE const.name = 'Tetu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dedan Kimathi', const.id
FROM constituencies const
WHERE const.name = 'Tetu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamagana', const.id
FROM constituencies const
WHERE const.name = 'Tetu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Aguthi-Gaaki', const.id
FROM constituencies const
WHERE const.name = 'Tetu'
ON CONFLICT DO NOTHING;

-- Mukurweini Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gikondi', const.id
FROM constituencies const
WHERE const.name = 'Mukurweini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rugi', const.id
FROM constituencies const
WHERE const.name = 'Mukurweini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mukurwe-Ini West', const.id
FROM constituencies const
WHERE const.name = 'Mukurweini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mukurwe-Ini Central', const.id
FROM constituencies const
WHERE const.name = 'Mukurweini'
ON CONFLICT DO NOTHING;

-- Nyeri Town Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kiganjo/Mathari', const.id
FROM constituencies const
WHERE const.name = 'Nyeri Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rware', const.id
FROM constituencies const
WHERE const.name = 'Nyeri Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatitu/Muruguru', const.id
FROM constituencies const
WHERE const.name = 'Nyeri Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruring’u', const.id
FROM constituencies const
WHERE const.name = 'Nyeri Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamakwa/Mukaro', const.id
FROM constituencies const
WHERE const.name = 'Nyeri Town'
ON CONFLICT DO NOTHING;

-- Kieni Constituency (8 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mweiga', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Naromoro Kiamthaga', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwiyogo/Endara Sha', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugunda', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatarakwa', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Thegu River', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabaru', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gakawa', const.id
FROM constituencies const
WHERE const.name = 'Kieni'
ON CONFLICT DO NOTHING;

-- Kirinyaga Central Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mutira', const.id
FROM constituencies const
WHERE const.name = 'Kirinyaga Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyekini', const.id
FROM constituencies const
WHERE const.name = 'Kirinyaga Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kerugoya', const.id
FROM constituencies const
WHERE const.name = 'Kirinyaga Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Inoi', const.id
FROM constituencies const
WHERE const.name = 'Kirinyaga Central'
ON CONFLICT DO NOTHING;

-- Mwea Constituency (8 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mutithi', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangai', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamumu', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyangati', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Murindiko', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gathigiriri', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Teberer', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Thiba', const.id
FROM constituencies const
WHERE const.name = 'Mwea'
ON CONFLICT DO NOTHING;

-- Gichugu Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kabare Baragwi', const.id
FROM constituencies const
WHERE const.name = 'Gichugu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Njukiini', const.id
FROM constituencies const
WHERE const.name = 'Gichugu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngariama', const.id
FROM constituencies const
WHERE const.name = 'Gichugu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karumandi', const.id
FROM constituencies const
WHERE const.name = 'Gichugu'
ON CONFLICT DO NOTHING;

-- Ndia Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mukure', const.id
FROM constituencies const
WHERE const.name = 'Ndia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiine', const.id
FROM constituencies const
WHERE const.name = 'Ndia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kariti', const.id
FROM constituencies const
WHERE const.name = 'Ndia'
ON CONFLICT DO NOTHING;

-- Gatanga Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ithanga', const.id
FROM constituencies const
WHERE const.name = 'Gatanga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kakuzi/Mitubiri', const.id
FROM constituencies const
WHERE const.name = 'Gatanga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugumo-Ini', const.id
FROM constituencies const
WHERE const.name = 'Gatanga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kihumbu-Ini', const.id
FROM constituencies const
WHERE const.name = 'Gatanga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatanga', const.id
FROM constituencies const
WHERE const.name = 'Gatanga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kariara', const.id
FROM constituencies const
WHERE const.name = 'Gatanga'
ON CONFLICT DO NOTHING;

-- Kandara Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ng’ararii', const.id
FROM constituencies const
WHERE const.name = 'Kandara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muruka', const.id
FROM constituencies const
WHERE const.name = 'Kandara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangundu-Ini', const.id
FROM constituencies const
WHERE const.name = 'Kandara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gaichanjiru', const.id
FROM constituencies const
WHERE const.name = 'Kandara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ithiru', const.id
FROM constituencies const
WHERE const.name = 'Kandara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruchu', const.id
FROM constituencies const
WHERE const.name = 'Kandara'
ON CONFLICT DO NOTHING;

-- Kigumo Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kahumbu', const.id
FROM constituencies const
WHERE const.name = 'Kigumo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muthithi', const.id
FROM constituencies const
WHERE const.name = 'Kigumo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kigumo', const.id
FROM constituencies const
WHERE const.name = 'Kigumo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangari', const.id
FROM constituencies const
WHERE const.name = 'Kigumo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kinyona', const.id
FROM constituencies const
WHERE const.name = 'Kigumo'
ON CONFLICT DO NOTHING;

-- Mathioya Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gituhi', const.id
FROM constituencies const
WHERE const.name = 'Mathioya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiru', const.id
FROM constituencies const
WHERE const.name = 'Mathioya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamacharia', const.id
FROM constituencies const
WHERE const.name = 'Mathioya'
ON CONFLICT DO NOTHING;

-- Kiharu Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wangu', const.id
FROM constituencies const
WHERE const.name = 'Kiharu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugoiri', const.id
FROM constituencies const
WHERE const.name = 'Kiharu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbiri', const.id
FROM constituencies const
WHERE const.name = 'Kiharu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Kiharu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Murarandia', const.id
FROM constituencies const
WHERE const.name = 'Kiharu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gaturi', const.id
FROM constituencies const
WHERE const.name = 'Kiharu'
ON CONFLICT DO NOTHING;

-- Kangema Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyenya-Ini', const.id
FROM constituencies const
WHERE const.name = 'Kangema'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muguru', const.id
FROM constituencies const
WHERE const.name = 'Kangema'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rwathia', const.id
FROM constituencies const
WHERE const.name = 'Kangema'
ON CONFLICT DO NOTHING;

-- Maragwa Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kimorori/Wempa', const.id
FROM constituencies const
WHERE const.name = 'Maragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Makuyu', const.id
FROM constituencies const
WHERE const.name = 'Maragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kambiti', const.id
FROM constituencies const
WHERE const.name = 'Maragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamahuha', const.id
FROM constituencies const
WHERE const.name = 'Maragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ichagaki', const.id
FROM constituencies const
WHERE const.name = 'Maragwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nginda', const.id
FROM constituencies const
WHERE const.name = 'Maragwa'
ON CONFLICT DO NOTHING;

-- Gatundu North Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gituamba', const.id
FROM constituencies const
WHERE const.name = 'Gatundu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Githobokoni', const.id
FROM constituencies const
WHERE const.name = 'Gatundu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chania', const.id
FROM constituencies const
WHERE const.name = 'Gatundu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mang’u', const.id
FROM constituencies const
WHERE const.name = 'Gatundu North'
ON CONFLICT DO NOTHING;

-- Gatundu South Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kiamwangi', const.id
FROM constituencies const
WHERE const.name = 'Gatundu South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiganjo', const.id
FROM constituencies const
WHERE const.name = 'Gatundu South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndarugu', const.id
FROM constituencies const
WHERE const.name = 'Gatundu South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngenda', const.id
FROM constituencies const
WHERE const.name = 'Gatundu South'
ON CONFLICT DO NOTHING;

-- Githunguri Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Githunguri', const.id
FROM constituencies const
WHERE const.name = 'Githunguri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Githiga', const.id
FROM constituencies const
WHERE const.name = 'Githunguri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ikinu', const.id
FROM constituencies const
WHERE const.name = 'Githunguri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngewa', const.id
FROM constituencies const
WHERE const.name = 'Githunguri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Komothai', const.id
FROM constituencies const
WHERE const.name = 'Githunguri'
ON CONFLICT DO NOTHING;

-- Juja Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Murera', const.id
FROM constituencies const
WHERE const.name = 'Juja'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Theta', const.id
FROM constituencies const
WHERE const.name = 'Juja'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Juja', const.id
FROM constituencies const
WHERE const.name = 'Juja'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Witeithie', const.id
FROM constituencies const
WHERE const.name = 'Juja'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kalimoni', const.id
FROM constituencies const
WHERE const.name = 'Juja'
ON CONFLICT DO NOTHING;

-- Kabete Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gitaru', const.id
FROM constituencies const
WHERE const.name = 'Kabete'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muguga', const.id
FROM constituencies const
WHERE const.name = 'Kabete'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyathuna', const.id
FROM constituencies const
WHERE const.name = 'Kabete'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabete', const.id
FROM constituencies const
WHERE const.name = 'Kabete'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Uthiru', const.id
FROM constituencies const
WHERE const.name = 'Kabete'
ON CONFLICT DO NOTHING;

-- Kiambaa Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Cianda', const.id
FROM constituencies const
WHERE const.name = 'Kiambaa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karuiri', const.id
FROM constituencies const
WHERE const.name = 'Kiambaa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndenderu', const.id
FROM constituencies const
WHERE const.name = 'Kiambaa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muchatha', const.id
FROM constituencies const
WHERE const.name = 'Kiambaa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kihara', const.id
FROM constituencies const
WHERE const.name = 'Kiambaa'
ON CONFLICT DO NOTHING;

-- Kiambu Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ting’gang’a', const.id
FROM constituencies const
WHERE const.name = 'Kiambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndumberi', const.id
FROM constituencies const
WHERE const.name = 'Kiambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Riabai', const.id
FROM constituencies const
WHERE const.name = 'Kiambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Kiambu'
ON CONFLICT DO NOTHING;

-- Limuru Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Bibirioni', const.id
FROM constituencies const
WHERE const.name = 'Limuru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Limuru Central', const.id
FROM constituencies const
WHERE const.name = 'Limuru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndeiya', const.id
FROM constituencies const
WHERE const.name = 'Limuru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Limuru East', const.id
FROM constituencies const
WHERE const.name = 'Limuru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngecha Tigoni', const.id
FROM constituencies const
WHERE const.name = 'Limuru'
ON CONFLICT DO NOTHING;

-- Kikuyu Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Karai', const.id
FROM constituencies const
WHERE const.name = 'Kikuyu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nachu', const.id
FROM constituencies const
WHERE const.name = 'Kikuyu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sigona', const.id
FROM constituencies const
WHERE const.name = 'Kikuyu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kikuyu', const.id
FROM constituencies const
WHERE const.name = 'Kikuyu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kinoo', const.id
FROM constituencies const
WHERE const.name = 'Kikuyu'
ON CONFLICT DO NOTHING;

-- Lari Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kijabe', const.id
FROM constituencies const
WHERE const.name = 'Lari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyanduma', const.id
FROM constituencies const
WHERE const.name = 'Lari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamburu', const.id
FROM constituencies const
WHERE const.name = 'Lari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lari/Kirenga', const.id
FROM constituencies const
WHERE const.name = 'Lari'
ON CONFLICT DO NOTHING;

-- Ruiru Constituency (8 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gitothua', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Biashara', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatongora', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kahawa Sukari', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kahawa Wendani', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiuu', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwiki', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwihoko', const.id
FROM constituencies const
WHERE const.name = 'Ruiru'
ON CONFLICT DO NOTHING;

-- Thika Town Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Thika Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamenu', const.id
FROM constituencies const
WHERE const.name = 'Thika Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hospital', const.id
FROM constituencies const
WHERE const.name = 'Thika Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatuanyaga', const.id
FROM constituencies const
WHERE const.name = 'Thika Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngoliba', const.id
FROM constituencies const
WHERE const.name = 'Thika Town'
ON CONFLICT DO NOTHING;

-- Turkana Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kerio Delta', const.id
FROM constituencies const
WHERE const.name = 'Turkana Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kang’atotha', const.id
FROM constituencies const
WHERE const.name = 'Turkana Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kalokol', const.id
FROM constituencies const
WHERE const.name = 'Turkana Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lodwar Township', const.id
FROM constituencies const
WHERE const.name = 'Turkana Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanamkemer', const.id
FROM constituencies const
WHERE const.name = 'Turkana Central'
ON CONFLICT DO NOTHING;

-- Turkana East Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kapedo/Napeito', const.id
FROM constituencies const
WHERE const.name = 'Turkana East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Katilia', const.id
FROM constituencies const
WHERE const.name = 'Turkana East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lokori/Kochodin', const.id
FROM constituencies const
WHERE const.name = 'Turkana East'
ON CONFLICT DO NOTHING;

-- Turkana North Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kaeris', const.id
FROM constituencies const
WHERE const.name = 'Turkana North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lake zone', const.id
FROM constituencies const
WHERE const.name = 'Turkana North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lapur', const.id
FROM constituencies const
WHERE const.name = 'Turkana North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaaleng/kaikor', const.id
FROM constituencies const
WHERE const.name = 'Turkana North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kibish', const.id
FROM constituencies const
WHERE const.name = 'Turkana North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nakalale', const.id
FROM constituencies const
WHERE const.name = 'Turkana North'
ON CONFLICT DO NOTHING;

-- Turkana South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kaputir', const.id
FROM constituencies const
WHERE const.name = 'Turkana South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Katilu', const.id
FROM constituencies const
WHERE const.name = 'Turkana South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lobokat', const.id
FROM constituencies const
WHERE const.name = 'Turkana South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kalapata', const.id
FROM constituencies const
WHERE const.name = 'Turkana South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lokichar', const.id
FROM constituencies const
WHERE const.name = 'Turkana South'
ON CONFLICT DO NOTHING;

-- Turkana West Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kakuma', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lopur', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Letea', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Songot', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kalobeyei', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lokichoggio', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nanaam', const.id
FROM constituencies const
WHERE const.name = 'Turkana West'
ON CONFLICT DO NOTHING;

-- Loima Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kotaruk/Lobei', const.id
FROM constituencies const
WHERE const.name = 'Loima'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Turkwel', const.id
FROM constituencies const
WHERE const.name = 'Loima'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Loima', const.id
FROM constituencies const
WHERE const.name = 'Loima'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lokiriama/Loren Gippi', const.id
FROM constituencies const
WHERE const.name = 'Loima'
ON CONFLICT DO NOTHING;

-- Kapenguria Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Riwo', const.id
FROM constituencies const
WHERE const.name = 'Kapenguria'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapenguria', const.id
FROM constituencies const
WHERE const.name = 'Kapenguria'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mnagei', const.id
FROM constituencies const
WHERE const.name = 'Kapenguria'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Siyoi', const.id
FROM constituencies const
WHERE const.name = 'Kapenguria'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Endugh', const.id
FROM constituencies const
WHERE const.name = 'Kapenguria'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sook', const.id
FROM constituencies const
WHERE const.name = 'Kapenguria'
ON CONFLICT DO NOTHING;

-- Sigor Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sekerr', const.id
FROM constituencies const
WHERE const.name = 'Sigor'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Masool', const.id
FROM constituencies const
WHERE const.name = 'Sigor'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lomut', const.id
FROM constituencies const
WHERE const.name = 'Sigor'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Weiwei', const.id
FROM constituencies const
WHERE const.name = 'Sigor'
ON CONFLICT DO NOTHING;

-- Kacheliba Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Suam', const.id
FROM constituencies const
WHERE const.name = 'Kacheliba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kodich', const.id
FROM constituencies const
WHERE const.name = 'Kacheliba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kasei', const.id
FROM constituencies const
WHERE const.name = 'Kacheliba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapchok', const.id
FROM constituencies const
WHERE const.name = 'Kacheliba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiwawa', const.id
FROM constituencies const
WHERE const.name = 'Kacheliba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Alale', const.id
FROM constituencies const
WHERE const.name = 'Kacheliba'
ON CONFLICT DO NOTHING;

-- Pokot South Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chepareria', const.id
FROM constituencies const
WHERE const.name = 'Pokot South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Batei', const.id
FROM constituencies const
WHERE const.name = 'Pokot South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lelan', const.id
FROM constituencies const
WHERE const.name = 'Pokot South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tapach', const.id
FROM constituencies const
WHERE const.name = 'Pokot South'
ON CONFLICT DO NOTHING;

-- Samburu East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Waso', const.id
FROM constituencies const
WHERE const.name = 'Samburu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamba West', const.id
FROM constituencies const
WHERE const.name = 'Samburu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamba East', const.id
FROM constituencies const
WHERE const.name = 'Samburu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wamba North', const.id
FROM constituencies const
WHERE const.name = 'Samburu East'
ON CONFLICT DO NOTHING;

-- Samburu North Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'El-Barta', const.id
FROM constituencies const
WHERE const.name = 'Samburu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nachola', const.id
FROM constituencies const
WHERE const.name = 'Samburu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndoto', const.id
FROM constituencies const
WHERE const.name = 'Samburu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyiro', const.id
FROM constituencies const
WHERE const.name = 'Samburu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Angata Nanyokie', const.id
FROM constituencies const
WHERE const.name = 'Samburu North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Baawa', const.id
FROM constituencies const
WHERE const.name = 'Samburu North'
ON CONFLICT DO NOTHING;

-- Samburu West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Lodokejek', const.id
FROM constituencies const
WHERE const.name = 'Samburu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Suguta Marmar', const.id
FROM constituencies const
WHERE const.name = 'Samburu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maralal', const.id
FROM constituencies const
WHERE const.name = 'Samburu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Loosuk', const.id
FROM constituencies const
WHERE const.name = 'Samburu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Poro', const.id
FROM constituencies const
WHERE const.name = 'Samburu West'
ON CONFLICT DO NOTHING;

-- Cherang’any Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sinyerere', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Makutano', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaplamai', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Motosiet', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cherangany/Suwerwa', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chepsiro/Kiptoror', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sitatunga', const.id
FROM constituencies const
WHERE const.name = 'Cherang’any'
ON CONFLICT DO NOTHING;

-- Kwanza Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kapomboi', const.id
FROM constituencies const
WHERE const.name = 'Kwanza'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kwanza', const.id
FROM constituencies const
WHERE const.name = 'Kwanza'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Keiyo', const.id
FROM constituencies const
WHERE const.name = 'Kwanza'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bidii', const.id
FROM constituencies const
WHERE const.name = 'Kwanza'
ON CONFLICT DO NOTHING;

-- Endebess Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chepchoina', const.id
FROM constituencies const
WHERE const.name = 'Endebess'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Endebess', const.id
FROM constituencies const
WHERE const.name = 'Endebess'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matumbei', const.id
FROM constituencies const
WHERE const.name = 'Endebess'
ON CONFLICT DO NOTHING;

-- Saboti Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kinyoro', const.id
FROM constituencies const
WHERE const.name = 'Saboti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matisi', const.id
FROM constituencies const
WHERE const.name = 'Saboti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tuwani', const.id
FROM constituencies const
WHERE const.name = 'Saboti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Saboti', const.id
FROM constituencies const
WHERE const.name = 'Saboti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Machewa', const.id
FROM constituencies const
WHERE const.name = 'Saboti'
ON CONFLICT DO NOTHING;

-- Kiminini Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kiminini', const.id
FROM constituencies const
WHERE const.name = 'Kiminini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Waitaluk', const.id
FROM constituencies const
WHERE const.name = 'Kiminini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sirende', const.id
FROM constituencies const
WHERE const.name = 'Kiminini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hospital', const.id
FROM constituencies const
WHERE const.name = 'Kiminini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sikhendu', const.id
FROM constituencies const
WHERE const.name = 'Kiminini'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nabiswa', const.id
FROM constituencies const
WHERE const.name = 'Kiminini'
ON CONFLICT DO NOTHING;

-- Ainabkoi Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsoya', const.id
FROM constituencies const
WHERE const.name = 'Ainabkoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaptagat', const.id
FROM constituencies const
WHERE const.name = 'Ainabkoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ainabkoi/Olare', const.id
FROM constituencies const
WHERE const.name = 'Ainabkoi'
ON CONFLICT DO NOTHING;

-- Kapseret Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Simat/Kapseret', const.id
FROM constituencies const
WHERE const.name = 'Kapseret'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipkenyo', const.id
FROM constituencies const
WHERE const.name = 'Kapseret'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngeria', const.id
FROM constituencies const
WHERE const.name = 'Kapseret'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Megun', const.id
FROM constituencies const
WHERE const.name = 'Kapseret'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Langas', const.id
FROM constituencies const
WHERE const.name = 'Kapseret'
ON CONFLICT DO NOTHING;

-- Kesses Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Racecourse', const.id
FROM constituencies const
WHERE const.name = 'Kesses'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cheptiret/Kipchamo', const.id
FROM constituencies const
WHERE const.name = 'Kesses'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tulwet/Chuiyat', const.id
FROM constituencies const
WHERE const.name = 'Kesses'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tarakwa', const.id
FROM constituencies const
WHERE const.name = 'Kesses'
ON CONFLICT DO NOTHING;

-- Moiben Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Tembelio', const.id
FROM constituencies const
WHERE const.name = 'Moiben'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sergoit', const.id
FROM constituencies const
WHERE const.name = 'Moiben'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karuna/Meibeki', const.id
FROM constituencies const
WHERE const.name = 'Moiben'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Moiben', const.id
FROM constituencies const
WHERE const.name = 'Moiben'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimumu', const.id
FROM constituencies const
WHERE const.name = 'Moiben'
ON CONFLICT DO NOTHING;

-- Soy Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Moi’s Bridge', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapkures', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ziwa', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Segero/Barsombe', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipsom Ba', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soy', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kuinet/Kapsuswa', const.id
FROM constituencies const
WHERE const.name = 'Soy'
ON CONFLICT DO NOTHING;

-- Turbo Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ngenyilel', const.id
FROM constituencies const
WHERE const.name = 'Turbo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tapsagoi', const.id
FROM constituencies const
WHERE const.name = 'Turbo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamagut', const.id
FROM constituencies const
WHERE const.name = 'Turbo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiplombe', const.id
FROM constituencies const
WHERE const.name = 'Turbo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsaos', const.id
FROM constituencies const
WHERE const.name = 'Turbo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Huruma', const.id
FROM constituencies const
WHERE const.name = 'Turbo'
ON CONFLICT DO NOTHING;

-- Keiyo North Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Emsoo', const.id
FROM constituencies const
WHERE const.name = 'Keiyo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamariny', const.id
FROM constituencies const
WHERE const.name = 'Keiyo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapchemutwa', const.id
FROM constituencies const
WHERE const.name = 'Keiyo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tambach', const.id
FROM constituencies const
WHERE const.name = 'Keiyo North'
ON CONFLICT DO NOTHING;

-- Keiyo South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kaptarakwa', const.id
FROM constituencies const
WHERE const.name = 'Keiyo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chepkorio', const.id
FROM constituencies const
WHERE const.name = 'Keiyo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soy North', const.id
FROM constituencies const
WHERE const.name = 'Keiyo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soy South', const.id
FROM constituencies const
WHERE const.name = 'Keiyo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabiemit', const.id
FROM constituencies const
WHERE const.name = 'Keiyo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Metkei', const.id
FROM constituencies const
WHERE const.name = 'Keiyo South'
ON CONFLICT DO NOTHING;

-- Marakwet East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kapyego', const.id
FROM constituencies const
WHERE const.name = 'Marakwet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sambirir', const.id
FROM constituencies const
WHERE const.name = 'Marakwet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Endo', const.id
FROM constituencies const
WHERE const.name = 'Marakwet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Embobut / Embulot', const.id
FROM constituencies const
WHERE const.name = 'Marakwet East'
ON CONFLICT DO NOTHING;

-- Marakwet West Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsowar', const.id
FROM constituencies const
WHERE const.name = 'Marakwet West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lelan', const.id
FROM constituencies const
WHERE const.name = 'Marakwet West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sengwer', const.id
FROM constituencies const
WHERE const.name = 'Marakwet West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cherang’any/Chebororwa', const.id
FROM constituencies const
WHERE const.name = 'Marakwet West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Moiben/Kuserwo', const.id
FROM constituencies const
WHERE const.name = 'Marakwet West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Arror', const.id
FROM constituencies const
WHERE const.name = 'Marakwet West'
ON CONFLICT DO NOTHING;

-- Aldai Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kabwareng', const.id
FROM constituencies const
WHERE const.name = 'Aldai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Terik', const.id
FROM constituencies const
WHERE const.name = 'Aldai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kemeloi-Maraba', const.id
FROM constituencies const
WHERE const.name = 'Aldai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kobujoi', const.id
FROM constituencies const
WHERE const.name = 'Aldai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaptumo-Kaboi', const.id
FROM constituencies const
WHERE const.name = 'Aldai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Koyo-Ndurio', const.id
FROM constituencies const
WHERE const.name = 'Aldai'
ON CONFLICT DO NOTHING;

-- Chesumei Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chemundu/Kapng’etuny', const.id
FROM constituencies const
WHERE const.name = 'Chesumei'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kosirai', const.id
FROM constituencies const
WHERE const.name = 'Chesumei'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lelmokwo/Ngechek', const.id
FROM constituencies const
WHERE const.name = 'Chesumei'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaptel/Kamoiywo', const.id
FROM constituencies const
WHERE const.name = 'Chesumei'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiptuya', const.id
FROM constituencies const
WHERE const.name = 'Chesumei'
ON CONFLICT DO NOTHING;

-- Emgwen Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chepkumia', const.id
FROM constituencies const
WHERE const.name = 'Emgwen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapkangani', const.id
FROM constituencies const
WHERE const.name = 'Emgwen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsabet', const.id
FROM constituencies const
WHERE const.name = 'Emgwen'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kilibwoni', const.id
FROM constituencies const
WHERE const.name = 'Emgwen'
ON CONFLICT DO NOTHING;

-- Mosop Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chepterwai', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipkaren', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kurgung/ Surungai', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabiyet', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndalat', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabisaga', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sangalo/Kebulonik', const.id
FROM constituencies const
WHERE const.name = 'Mosop'
ON CONFLICT DO NOTHING;

-- Nandi Hills Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Nandi Hills', const.id
FROM constituencies const
WHERE const.name = 'Nandi Hills'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chepkunyuk', const.id
FROM constituencies const
WHERE const.name = 'Nandi Hills'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ol’lessos', const.id
FROM constituencies const
WHERE const.name = 'Nandi Hills'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapchorua', const.id
FROM constituencies const
WHERE const.name = 'Nandi Hills'
ON CONFLICT DO NOTHING;

-- Tinderet Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Songhor/Soba', const.id
FROM constituencies const
WHERE const.name = 'Tinderet'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tindiret', const.id
FROM constituencies const
WHERE const.name = 'Tinderet'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chemelil/Chemase', const.id
FROM constituencies const
WHERE const.name = 'Tinderet'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsimotwo', const.id
FROM constituencies const
WHERE const.name = 'Tinderet'
ON CONFLICT DO NOTHING;

-- Baringo Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kabarnet', const.id
FROM constituencies const
WHERE const.name = 'Baringo Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sacho', const.id
FROM constituencies const
WHERE const.name = 'Baringo Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tenges', const.id
FROM constituencies const
WHERE const.name = 'Baringo Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ewalel/Chapcha', const.id
FROM constituencies const
WHERE const.name = 'Baringo Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapropita', const.id
FROM constituencies const
WHERE const.name = 'Baringo Central'
ON CONFLICT DO NOTHING;

-- Baringo North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Barwessa', const.id
FROM constituencies const
WHERE const.name = 'Baringo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabartonjo', const.id
FROM constituencies const
WHERE const.name = 'Baringo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Saimo/Kipsaraman', const.id
FROM constituencies const
WHERE const.name = 'Baringo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Saimo/Soi', const.id
FROM constituencies const
WHERE const.name = 'Baringo North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bartabwa', const.id
FROM constituencies const
WHERE const.name = 'Baringo North'
ON CONFLICT DO NOTHING;

-- Baringo South Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Marigat', const.id
FROM constituencies const
WHERE const.name = 'Baringo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ilchamus', const.id
FROM constituencies const
WHERE const.name = 'Baringo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mochongoi', const.id
FROM constituencies const
WHERE const.name = 'Baringo South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mukutani', const.id
FROM constituencies const
WHERE const.name = 'Baringo South'
ON CONFLICT DO NOTHING;

-- Eldama Ravine Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Lembus', const.id
FROM constituencies const
WHERE const.name = 'Eldama Ravine'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lembus Kwen', const.id
FROM constituencies const
WHERE const.name = 'Eldama Ravine'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ravine', const.id
FROM constituencies const
WHERE const.name = 'Eldama Ravine'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mumberes/Maji Mazuri', const.id
FROM constituencies const
WHERE const.name = 'Eldama Ravine'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lembus /Pekerra', const.id
FROM constituencies const
WHERE const.name = 'Eldama Ravine'
ON CONFLICT DO NOTHING;

-- Mogotio Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mogotio', const.id
FROM constituencies const
WHERE const.name = 'Mogotio'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Emining', const.id
FROM constituencies const
WHERE const.name = 'Mogotio'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kisanana', const.id
FROM constituencies const
WHERE const.name = 'Mogotio'
ON CONFLICT DO NOTHING;

-- Tiaty Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Tirioko', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kolowa', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ribkwo', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Silale', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Loiyamorock', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tangulbei/Korossi', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Churo/Amaya', const.id
FROM constituencies const
WHERE const.name = 'Tiaty'
ON CONFLICT DO NOTHING;

-- Laikipia North Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sosian', const.id
FROM constituencies const
WHERE const.name = 'Laikipia North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Segera', const.id
FROM constituencies const
WHERE const.name = 'Laikipia North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugogodo West', const.id
FROM constituencies const
WHERE const.name = 'Laikipia North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugogodo East', const.id
FROM constituencies const
WHERE const.name = 'Laikipia North'
ON CONFLICT DO NOTHING;

-- Laikipia East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ngobit', const.id
FROM constituencies const
WHERE const.name = 'Laikipia East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tigithi', const.id
FROM constituencies const
WHERE const.name = 'Laikipia East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Thingithu', const.id
FROM constituencies const
WHERE const.name = 'Laikipia East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nanyuki', const.id
FROM constituencies const
WHERE const.name = 'Laikipia East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Umande', const.id
FROM constituencies const
WHERE const.name = 'Laikipia East'
ON CONFLICT DO NOTHING;

-- Laikipia West Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ol-Moran', const.id
FROM constituencies const
WHERE const.name = 'Laikipia West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rumuruti', const.id
FROM constituencies const
WHERE const.name = 'Laikipia West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Laikipia West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Githiga', const.id
FROM constituencies const
WHERE const.name = 'Laikipia West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marmanet', const.id
FROM constituencies const
WHERE const.name = 'Laikipia West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Igwamiti Salama', const.id
FROM constituencies const
WHERE const.name = 'Laikipia West'
ON CONFLICT DO NOTHING;

-- Nakuru Town East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Biashara', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kivumbini', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Flamingo', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Menengai', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nakuru East', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town East'
ON CONFLICT DO NOTHING;

-- Nakuru Town West Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Barut', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'London', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaptembwo', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapkures', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rhoda', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shaabab', const.id
FROM constituencies const
WHERE const.name = 'Nakuru Town West'
ON CONFLICT DO NOTHING;

-- Njoro Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mau Narok', const.id
FROM constituencies const
WHERE const.name = 'Njoro'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mauche', const.id
FROM constituencies const
WHERE const.name = 'Njoro'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kihingo', const.id
FROM constituencies const
WHERE const.name = 'Njoro'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nessuit', const.id
FROM constituencies const
WHERE const.name = 'Njoro'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lare', const.id
FROM constituencies const
WHERE const.name = 'Njoro'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Njoro', const.id
FROM constituencies const
WHERE const.name = 'Njoro'
ON CONFLICT DO NOTHING;

-- Molo Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mariashoni', const.id
FROM constituencies const
WHERE const.name = 'Molo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Elburgon', const.id
FROM constituencies const
WHERE const.name = 'Molo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Turi', const.id
FROM constituencies const
WHERE const.name = 'Molo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Molo', const.id
FROM constituencies const
WHERE const.name = 'Molo'
ON CONFLICT DO NOTHING;

-- Gilgil Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gilgil', const.id
FROM constituencies const
WHERE const.name = 'Gilgil'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Elementaita', const.id
FROM constituencies const
WHERE const.name = 'Gilgil'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbaruk/Eburu', const.id
FROM constituencies const
WHERE const.name = 'Gilgil'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Malewa West', const.id
FROM constituencies const
WHERE const.name = 'Gilgil'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Murindati', const.id
FROM constituencies const
WHERE const.name = 'Gilgil'
ON CONFLICT DO NOTHING;

-- Naivasha Constituency (8 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Biashara', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hells Gate', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lake View', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maiella', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mai Mahiu', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Olkaria', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Naivasha East', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Viwandani', const.id
FROM constituencies const
WHERE const.name = 'Naivasha'
ON CONFLICT DO NOTHING;

-- Kuresoi North Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kiptororo', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyota', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sirikwa', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamara', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi North'
ON CONFLICT DO NOTHING;

-- Kuresoi South Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Amalo', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Keringet', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiptagich', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tinet', const.id
FROM constituencies const
WHERE const.name = 'Kuresoi South'
ON CONFLICT DO NOTHING;

-- Bahati Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Dundori', const.id
FROM constituencies const
WHERE const.name = 'Bahati'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabatini', const.id
FROM constituencies const
WHERE const.name = 'Bahati'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiamaina', const.id
FROM constituencies const
WHERE const.name = 'Bahati'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lanet/Umoja', const.id
FROM constituencies const
WHERE const.name = 'Bahati'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bahati', const.id
FROM constituencies const
WHERE const.name = 'Bahati'
ON CONFLICT DO NOTHING;

-- Rongai Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Menengai West', const.id
FROM constituencies const
WHERE const.name = 'Rongai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soin', const.id
FROM constituencies const
WHERE const.name = 'Rongai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Visoi', const.id
FROM constituencies const
WHERE const.name = 'Rongai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mosop', const.id
FROM constituencies const
WHERE const.name = 'Rongai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Solai', const.id
FROM constituencies const
WHERE const.name = 'Rongai'
ON CONFLICT DO NOTHING;

-- Subukia Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Subukia', const.id
FROM constituencies const
WHERE const.name = 'Subukia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Waseges', const.id
FROM constituencies const
WHERE const.name = 'Subukia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabazi', const.id
FROM constituencies const
WHERE const.name = 'Subukia'
ON CONFLICT DO NOTHING;

-- Narok North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Olpusimoru', const.id
FROM constituencies const
WHERE const.name = 'Narok North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Olokurto', const.id
FROM constituencies const
WHERE const.name = 'Narok North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Narok Town', const.id
FROM constituencies const
WHERE const.name = 'Narok North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nkareta’Olorropil', const.id
FROM constituencies const
WHERE const.name = 'Narok North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Melili', const.id
FROM constituencies const
WHERE const.name = 'Narok North'
ON CONFLICT DO NOTHING;

-- Narok South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Majimoto/Naroos', const.id
FROM constituencies const
WHERE const.name = 'Narok South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Uraololulung’a', const.id
FROM constituencies const
WHERE const.name = 'Narok South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Melelo', const.id
FROM constituencies const
WHERE const.name = 'Narok South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Loita', const.id
FROM constituencies const
WHERE const.name = 'Narok South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sogoo', const.id
FROM constituencies const
WHERE const.name = 'Narok South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sagamian', const.id
FROM constituencies const
WHERE const.name = 'Narok South'
ON CONFLICT DO NOTHING;

-- Narok East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mosiro', const.id
FROM constituencies const
WHERE const.name = 'Narok East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ildamat', const.id
FROM constituencies const
WHERE const.name = 'Narok East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Keekonyokie', const.id
FROM constituencies const
WHERE const.name = 'Narok East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Suswa', const.id
FROM constituencies const
WHERE const.name = 'Narok East'
ON CONFLICT DO NOTHING;

-- Narok West Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ilmotiok', const.id
FROM constituencies const
WHERE const.name = 'Narok West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mara', const.id
FROM constituencies const
WHERE const.name = 'Narok West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Siana', const.id
FROM constituencies const
WHERE const.name = 'Narok West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Naikarra', const.id
FROM constituencies const
WHERE const.name = 'Narok West'
ON CONFLICT DO NOTHING;

-- Kilgoris Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kilgoris Central', const.id
FROM constituencies const
WHERE const.name = 'Kilgoris'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Keyian', const.id
FROM constituencies const
WHERE const.name = 'Kilgoris'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Angata Barikoi', const.id
FROM constituencies const
WHERE const.name = 'Kilgoris'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shankoe', const.id
FROM constituencies const
WHERE const.name = 'Kilgoris'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimintet', const.id
FROM constituencies const
WHERE const.name = 'Kilgoris'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lolgorian', const.id
FROM constituencies const
WHERE const.name = 'Kilgoris'
ON CONFLICT DO NOTHING;

-- Emurua Dikirr Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ilkerin', const.id
FROM constituencies const
WHERE const.name = 'Emurua Dikirr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ololmasani', const.id
FROM constituencies const
WHERE const.name = 'Emurua Dikirr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mogondo', const.id
FROM constituencies const
WHERE const.name = 'Emurua Dikirr'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsasian', const.id
FROM constituencies const
WHERE const.name = 'Emurua Dikirr'
ON CONFLICT DO NOTHING;

-- Kajiado Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Purko', const.id
FROM constituencies const
WHERE const.name = 'Kajiado Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ildamat', const.id
FROM constituencies const
WHERE const.name = 'Kajiado Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dalalekutuk', const.id
FROM constituencies const
WHERE const.name = 'Kajiado Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matapato North', const.id
FROM constituencies const
WHERE const.name = 'Kajiado Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matapato South', const.id
FROM constituencies const
WHERE const.name = 'Kajiado Central'
ON CONFLICT DO NOTHING;

-- Kajiado East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kaputiei North', const.id
FROM constituencies const
WHERE const.name = 'Kajiado East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kitengela', const.id
FROM constituencies const
WHERE const.name = 'Kajiado East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Oloosirkon/Sholinke', const.id
FROM constituencies const
WHERE const.name = 'Kajiado East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kenyawa-Poka', const.id
FROM constituencies const
WHERE const.name = 'Kajiado East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Imaroro', const.id
FROM constituencies const
WHERE const.name = 'Kajiado East'
ON CONFLICT DO NOTHING;

-- Kajiado North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Olkeri', const.id
FROM constituencies const
WHERE const.name = 'Kajiado North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ongata Rongai', const.id
FROM constituencies const
WHERE const.name = 'Kajiado North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nkaimurunya', const.id
FROM constituencies const
WHERE const.name = 'Kajiado North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Oloolua', const.id
FROM constituencies const
WHERE const.name = 'Kajiado North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngong', const.id
FROM constituencies const
WHERE const.name = 'Kajiado North'
ON CONFLICT DO NOTHING;

-- Kajiado West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Keekonyokie', const.id
FROM constituencies const
WHERE const.name = 'Kajiado West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Iloodokilani', const.id
FROM constituencies const
WHERE const.name = 'Kajiado West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magadi', const.id
FROM constituencies const
WHERE const.name = 'Kajiado West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ewuaso Oonkidong’i', const.id
FROM constituencies const
WHERE const.name = 'Kajiado West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mosiro', const.id
FROM constituencies const
WHERE const.name = 'Kajiado West'
ON CONFLICT DO NOTHING;

-- Kajiado South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Entonet/Lenkisi', const.id
FROM constituencies const
WHERE const.name = 'Kajiado South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mbirikani/Eselen', const.id
FROM constituencies const
WHERE const.name = 'Kajiado South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Keikuku', const.id
FROM constituencies const
WHERE const.name = 'Kajiado South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rombo', const.id
FROM constituencies const
WHERE const.name = 'Kajiado South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimana', const.id
FROM constituencies const
WHERE const.name = 'Kajiado South'
ON CONFLICT DO NOTHING;

-- Ainamoi Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsoit', const.id
FROM constituencies const
WHERE const.name = 'Ainamoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ainamoi', const.id
FROM constituencies const
WHERE const.name = 'Ainamoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipchebor', const.id
FROM constituencies const
WHERE const.name = 'Ainamoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapkugerwet', const.id
FROM constituencies const
WHERE const.name = 'Ainamoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipchimchim', const.id
FROM constituencies const
WHERE const.name = 'Ainamoi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsaos', const.id
FROM constituencies const
WHERE const.name = 'Ainamoi'
ON CONFLICT DO NOTHING;

-- Belgut Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Waldai', const.id
FROM constituencies const
WHERE const.name = 'Belgut'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabianga', const.id
FROM constituencies const
WHERE const.name = 'Belgut'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cheptororiet/Seretut', const.id
FROM constituencies const
WHERE const.name = 'Belgut'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chaik', const.id
FROM constituencies const
WHERE const.name = 'Belgut'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapsuser', const.id
FROM constituencies const
WHERE const.name = 'Belgut'
ON CONFLICT DO NOTHING;

-- Bureti Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kisiara', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tebesonik', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cheboin', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chemosot', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Litein', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cheplanget', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapkatet', const.id
FROM constituencies const
WHERE const.name = 'Bureti'
ON CONFLICT DO NOTHING;

-- Kipkelion East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Londiani', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kedowa/Kimugul', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chepseon', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tendeno/Sorget', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion East'
ON CONFLICT DO NOTHING;

-- Kipkelion West Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kunyak', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamasian', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipkelion', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chilchila', const.id
FROM constituencies const
WHERE const.name = 'Kipkelion West'
ON CONFLICT DO NOTHING;

-- Soin Sigowet Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sigowet', const.id
FROM constituencies const
WHERE const.name = 'Soin Sigowet'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaplelartet', const.id
FROM constituencies const
WHERE const.name = 'Soin Sigowet'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soliat', const.id
FROM constituencies const
WHERE const.name = 'Soin Sigowet'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soin', const.id
FROM constituencies const
WHERE const.name = 'Soin Sigowet'
ON CONFLICT DO NOTHING;

-- Sotik Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ndanai/Abosi', const.id
FROM constituencies const
WHERE const.name = 'Sotik'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chemagel', const.id
FROM constituencies const
WHERE const.name = 'Sotik'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipsonoi', const.id
FROM constituencies const
WHERE const.name = 'Sotik'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Apletundo', const.id
FROM constituencies const
WHERE const.name = 'Sotik'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rongena/Manare T', const.id
FROM constituencies const
WHERE const.name = 'Sotik'
ON CONFLICT DO NOTHING;

-- Bomet Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Silibwet Township', const.id
FROM constituencies const
WHERE const.name = 'Bomet Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndaraweta', const.id
FROM constituencies const
WHERE const.name = 'Bomet Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Singorwet', const.id
FROM constituencies const
WHERE const.name = 'Bomet Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chesoen', const.id
FROM constituencies const
WHERE const.name = 'Bomet Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mutarakwa', const.id
FROM constituencies const
WHERE const.name = 'Bomet Central'
ON CONFLICT DO NOTHING;

-- Bomet East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Merigi', const.id
FROM constituencies const
WHERE const.name = 'Bomet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kembu', const.id
FROM constituencies const
WHERE const.name = 'Bomet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Longisa', const.id
FROM constituencies const
WHERE const.name = 'Bomet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kipreres', const.id
FROM constituencies const
WHERE const.name = 'Bomet East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chemaner', const.id
FROM constituencies const
WHERE const.name = 'Bomet East'
ON CONFLICT DO NOTHING;

-- Chepalungu Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kong’asis', const.id
FROM constituencies const
WHERE const.name = 'Chepalungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyangores', const.id
FROM constituencies const
WHERE const.name = 'Chepalungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sigor', const.id
FROM constituencies const
WHERE const.name = 'Chepalungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chebunyo', const.id
FROM constituencies const
WHERE const.name = 'Chepalungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Siongiroi', const.id
FROM constituencies const
WHERE const.name = 'Chepalungu'
ON CONFLICT DO NOTHING;

-- Konoin Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Chepchabas', const.id
FROM constituencies const
WHERE const.name = 'Konoin'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimulot', const.id
FROM constituencies const
WHERE const.name = 'Konoin'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mogogosiek', const.id
FROM constituencies const
WHERE const.name = 'Konoin'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Boito', const.id
FROM constituencies const
WHERE const.name = 'Konoin'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Embomos', const.id
FROM constituencies const
WHERE const.name = 'Konoin'
ON CONFLICT DO NOTHING;

-- Butere Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Marama West', const.id
FROM constituencies const
WHERE const.name = 'Butere'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marama Central', const.id
FROM constituencies const
WHERE const.name = 'Butere'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marenyo-Shianda', const.id
FROM constituencies const
WHERE const.name = 'Butere'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maram North', const.id
FROM constituencies const
WHERE const.name = 'Butere'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marama South', const.id
FROM constituencies const
WHERE const.name = 'Butere'
ON CONFLICT DO NOTHING;

-- Ikolomani Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Idakho South', const.id
FROM constituencies const
WHERE const.name = 'Ikolomani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Idakho East', const.id
FROM constituencies const
WHERE const.name = 'Ikolomani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Idakho North', const.id
FROM constituencies const
WHERE const.name = 'Ikolomani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Idakho Central', const.id
FROM constituencies const
WHERE const.name = 'Ikolomani'
ON CONFLICT DO NOTHING;

-- Khwisero Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kisa North', const.id
FROM constituencies const
WHERE const.name = 'Khwisero'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kisa East', const.id
FROM constituencies const
WHERE const.name = 'Khwisero'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kisa West', const.id
FROM constituencies const
WHERE const.name = 'Khwisero'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kisa Central', const.id
FROM constituencies const
WHERE const.name = 'Khwisero'
ON CONFLICT DO NOTHING;

-- Lurambi Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Butsotso East', const.id
FROM constituencies const
WHERE const.name = 'Lurambi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Butsotso South', const.id
FROM constituencies const
WHERE const.name = 'Lurambi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Butsotso Central', const.id
FROM constituencies const
WHERE const.name = 'Lurambi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sheywe', const.id
FROM constituencies const
WHERE const.name = 'Lurambi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mahiakalo', const.id
FROM constituencies const
WHERE const.name = 'Lurambi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shirere', const.id
FROM constituencies const
WHERE const.name = 'Lurambi'
ON CONFLICT DO NOTHING;

-- Likuyani Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Likuyani', const.id
FROM constituencies const
WHERE const.name = 'Likuyani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sango', const.id
FROM constituencies const
WHERE const.name = 'Likuyani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kongoni', const.id
FROM constituencies const
WHERE const.name = 'Likuyani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nzoia', const.id
FROM constituencies const
WHERE const.name = 'Likuyani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sinoko', const.id
FROM constituencies const
WHERE const.name = 'Likuyani'
ON CONFLICT DO NOTHING;

-- Malava Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Kabras', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chemuche East', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabras', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Butali/Chegulo', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Manda-Shivanga', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shirugu-Mugai', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Kabras', const.id
FROM constituencies const
WHERE const.name = 'Malava'
ON CONFLICT DO NOTHING;

-- Matungu Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Koyonzo', const.id
FROM constituencies const
WHERE const.name = 'Matungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kholera', const.id
FROM constituencies const
WHERE const.name = 'Matungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Khalaba', const.id
FROM constituencies const
WHERE const.name = 'Matungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mayoni', const.id
FROM constituencies const
WHERE const.name = 'Matungu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Namamali', const.id
FROM constituencies const
WHERE const.name = 'Matungu'
ON CONFLICT DO NOTHING;

-- Mumias East Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Lusheya/Lubinu', const.id
FROM constituencies const
WHERE const.name = 'Mumias East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Malaha/Isongo/Makunga', const.id
FROM constituencies const
WHERE const.name = 'Mumias East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Wanga', const.id
FROM constituencies const
WHERE const.name = 'Mumias East'
ON CONFLICT DO NOTHING;

-- Mumias West Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mumias Central', const.id
FROM constituencies const
WHERE const.name = 'Mumias West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mumias North', const.id
FROM constituencies const
WHERE const.name = 'Mumias West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Etenje', const.id
FROM constituencies const
WHERE const.name = 'Mumias West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Musanda', const.id
FROM constituencies const
WHERE const.name = 'Mumias West'
ON CONFLICT DO NOTHING;

-- Navakholo Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Ingostse-Mathia', const.id
FROM constituencies const
WHERE const.name = 'Navakholo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shinoyi-Shikomari', const.id
FROM constituencies const
WHERE const.name = 'Navakholo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Esumeyia', const.id
FROM constituencies const
WHERE const.name = 'Navakholo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bunyala West', const.id
FROM constituencies const
WHERE const.name = 'Navakholo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bunyal East', const.id
FROM constituencies const
WHERE const.name = 'Navakholo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bunyala Central', const.id
FROM constituencies const
WHERE const.name = 'Navakholo'
ON CONFLICT DO NOTHING;

-- Lugari Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mautuma', const.id
FROM constituencies const
WHERE const.name = 'Lugari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lugari', const.id
FROM constituencies const
WHERE const.name = 'Lugari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lumakanda', const.id
FROM constituencies const
WHERE const.name = 'Lugari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chekalini', const.id
FROM constituencies const
WHERE const.name = 'Lugari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chevaywa', const.id
FROM constituencies const
WHERE const.name = 'Lugari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lawandeti', const.id
FROM constituencies const
WHERE const.name = 'Lugari'
ON CONFLICT DO NOTHING;

-- Shinyalu Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mautuma', const.id
FROM constituencies const
WHERE const.name = 'Shinyalu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lugari', const.id
FROM constituencies const
WHERE const.name = 'Shinyalu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lumakanda', const.id
FROM constituencies const
WHERE const.name = 'Shinyalu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chekalini', const.id
FROM constituencies const
WHERE const.name = 'Shinyalu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chevaywa', const.id
FROM constituencies const
WHERE const.name = 'Shinyalu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lawandeti', const.id
FROM constituencies const
WHERE const.name = 'Shinyalu'
ON CONFLICT DO NOTHING;

-- Emuhaya Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'North East Bunyore', const.id
FROM constituencies const
WHERE const.name = 'Emuhaya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Bunyore', const.id
FROM constituencies const
WHERE const.name = 'Emuhaya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Bunyore', const.id
FROM constituencies const
WHERE const.name = 'Emuhaya'
ON CONFLICT DO NOTHING;

-- Hamisi Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Shiru', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gisambai', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shamakhokho', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Banja', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muhudi', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tambaa', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Jepkoyai', const.id
FROM constituencies const
WHERE const.name = 'Hamisi'
ON CONFLICT DO NOTHING;

-- Sabatia Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Lyaduywa/Izava', const.id
FROM constituencies const
WHERE const.name = 'Sabatia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Sabatia', const.id
FROM constituencies const
WHERE const.name = 'Sabatia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chavakali', const.id
FROM constituencies const
WHERE const.name = 'Sabatia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Maragoli', const.id
FROM constituencies const
WHERE const.name = 'Sabatia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wodanga', const.id
FROM constituencies const
WHERE const.name = 'Sabatia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Busali', const.id
FROM constituencies const
WHERE const.name = 'Sabatia'
ON CONFLICT DO NOTHING;

-- Vihiga Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Lugaga-Wamuluma', const.id
FROM constituencies const
WHERE const.name = 'Vihiga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Maragoli', const.id
FROM constituencies const
WHERE const.name = 'Vihiga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Maragoli', const.id
FROM constituencies const
WHERE const.name = 'Vihiga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mungoma', const.id
FROM constituencies const
WHERE const.name = 'Vihiga'
ON CONFLICT DO NOTHING;

-- Luanda Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Luanda Township', const.id
FROM constituencies const
WHERE const.name = 'Luanda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wemilabi', const.id
FROM constituencies const
WHERE const.name = 'Luanda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwibona', const.id
FROM constituencies const
WHERE const.name = 'Luanda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Luanda South', const.id
FROM constituencies const
WHERE const.name = 'Luanda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Emabungo', const.id
FROM constituencies const
WHERE const.name = 'Luanda'
ON CONFLICT DO NOTHING;

-- Bumula Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Bumula', const.id
FROM constituencies const
WHERE const.name = 'Bumula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Khasoko', const.id
FROM constituencies const
WHERE const.name = 'Bumula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabula', const.id
FROM constituencies const
WHERE const.name = 'Bumula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimaeti', const.id
FROM constituencies const
WHERE const.name = 'Bumula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Bukusu', const.id
FROM constituencies const
WHERE const.name = 'Bumula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Siboti', const.id
FROM constituencies const
WHERE const.name = 'Bumula'
ON CONFLICT DO NOTHING;

-- Kanduyi Constituency (9 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Bukembe West', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bukembe East', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Khalaba', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Musikoma', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Snag’alo', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Marakatu', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tuuti', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Sang’alo', const.id
FROM constituencies const
WHERE const.name = 'Kanduyi'
ON CONFLICT DO NOTHING;

-- Webuye East Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mihuu', const.id
FROM constituencies const
WHERE const.name = 'Webuye East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndivisi', const.id
FROM constituencies const
WHERE const.name = 'Webuye East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maraka', const.id
FROM constituencies const
WHERE const.name = 'Webuye East'
ON CONFLICT DO NOTHING;

-- Webuye West Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sitikho', const.id
FROM constituencies const
WHERE const.name = 'Webuye West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matulo', const.id
FROM constituencies const
WHERE const.name = 'Webuye West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bokoli', const.id
FROM constituencies const
WHERE const.name = 'Webuye West'
ON CONFLICT DO NOTHING;

-- Mt. Elgon Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Cheptais', const.id
FROM constituencies const
WHERE const.name = 'Mt. Elgon'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chesikaki', const.id
FROM constituencies const
WHERE const.name = 'Mt. Elgon'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chepyuk', const.id
FROM constituencies const
WHERE const.name = 'Mt. Elgon'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kapkateny', const.id
FROM constituencies const
WHERE const.name = 'Mt. Elgon'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaptama', const.id
FROM constituencies const
WHERE const.name = 'Mt. Elgon'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Elgon', const.id
FROM constituencies const
WHERE const.name = 'Mt. Elgon'
ON CONFLICT DO NOTHING;

-- Sirisia Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Namwela', const.id
FROM constituencies const
WHERE const.name = 'Sirisia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Malakisi/South Kulisiru', const.id
FROM constituencies const
WHERE const.name = 'Sirisia'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lwandanyi', const.id
FROM constituencies const
WHERE const.name = 'Sirisia'
ON CONFLICT DO NOTHING;

-- Tongaren Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mbakalo', const.id
FROM constituencies const
WHERE const.name = 'Tongaren'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Naitiri/Kabuyefwe', const.id
FROM constituencies const
WHERE const.name = 'Tongaren'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Milima', const.id
FROM constituencies const
WHERE const.name = 'Tongaren'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ndalu/Tabani', const.id
FROM constituencies const
WHERE const.name = 'Tongaren'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tongaren', const.id
FROM constituencies const
WHERE const.name = 'Tongaren'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Soysambu/Mitua', const.id
FROM constituencies const
WHERE const.name = 'Tongaren'
ON CONFLICT DO NOTHING;

-- Kabuchai Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kabuchai/Chwele', const.id
FROM constituencies const
WHERE const.name = 'Kabuchai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Nalondo', const.id
FROM constituencies const
WHERE const.name = 'Kabuchai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bwake/Luuya', const.id
FROM constituencies const
WHERE const.name = 'Kabuchai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mukuyuni', const.id
FROM constituencies const
WHERE const.name = 'Kabuchai'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Bukusu', const.id
FROM constituencies const
WHERE const.name = 'Kabuchai'
ON CONFLICT DO NOTHING;

-- Kimilili Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kibingei', const.id
FROM constituencies const
WHERE const.name = 'Kimilili'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kimilili', const.id
FROM constituencies const
WHERE const.name = 'Kimilili'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maeni', const.id
FROM constituencies const
WHERE const.name = 'Kimilili'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kamukuywa', const.id
FROM constituencies const
WHERE const.name = 'Kimilili'
ON CONFLICT DO NOTHING;

-- Teso North Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'MALABA CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Teso North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MALABA NORTH', const.id
FROM constituencies const
WHERE const.name = 'Teso North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'ANG’URAI SOUTH', const.id
FROM constituencies const
WHERE const.name = 'Teso North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MALABA SOUTH', const.id
FROM constituencies const
WHERE const.name = 'Teso North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'ANG’URAI NORTH', const.id
FROM constituencies const
WHERE const.name = 'Teso North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'ANG’URAI EAST', const.id
FROM constituencies const
WHERE const.name = 'Teso North'
ON CONFLICT DO NOTHING;

-- Teso South Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'ANG’OROM', const.id
FROM constituencies const
WHERE const.name = 'Teso South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'CHAKOI SOUTH', const.id
FROM constituencies const
WHERE const.name = 'Teso South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'AMUKURA CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Teso South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'CHAKOI NORTH', const.id
FROM constituencies const
WHERE const.name = 'Teso South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'AMUKURA EAST', const.id
FROM constituencies const
WHERE const.name = 'Teso South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'AMUKURA WEST', const.id
FROM constituencies const
WHERE const.name = 'Teso South'
ON CONFLICT DO NOTHING;

-- Nambale Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'NAMBALE TOWNSHIP', const.id
FROM constituencies const
WHERE const.name = 'Nambale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BUKHAYO NORTH/WALTSI', const.id
FROM constituencies const
WHERE const.name = 'Nambale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BUKHAYO EAST', const.id
FROM constituencies const
WHERE const.name = 'Nambale'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BUKHAYO CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Nambale'
ON CONFLICT DO NOTHING;

-- Matayos Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'BUKHAYO WEST', const.id
FROM constituencies const
WHERE const.name = 'Matayos'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MAYENJE', const.id
FROM constituencies const
WHERE const.name = 'Matayos'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MATAYOS SOUTHBUSIBWABO', const.id
FROM constituencies const
WHERE const.name = 'Matayos'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BURUMBA', const.id
FROM constituencies const
WHERE const.name = 'Matayos'
ON CONFLICT DO NOTHING;

-- Butula Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'MARACHI WESTKINGANDOLE', const.id
FROM constituencies const
WHERE const.name = 'Butula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MARACHI CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Butula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MARACHI EAST', const.id
FROM constituencies const
WHERE const.name = 'Butula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MARACHI NORTH', const.id
FROM constituencies const
WHERE const.name = 'Butula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'ELUGULU', const.id
FROM constituencies const
WHERE const.name = 'Butula'
ON CONFLICT DO NOTHING;

-- Funyula Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'NAMBOBOTO NAMBUKU', const.id
FROM constituencies const
WHERE const.name = 'Funyula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'NANGINA', const.id
FROM constituencies const
WHERE const.name = 'Funyula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'AGENG’A NANGUBA', const.id
FROM constituencies const
WHERE const.name = 'Funyula'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BWIRI', const.id
FROM constituencies const
WHERE const.name = 'Funyula'
ON CONFLICT DO NOTHING;

-- Alego Usonga Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Usonga', const.id
FROM constituencies const
WHERE const.name = 'Alego Usonga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Alego', const.id
FROM constituencies const
WHERE const.name = 'Alego Usonga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Alego', const.id
FROM constituencies const
WHERE const.name = 'Alego Usonga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Siaya Township', const.id
FROM constituencies const
WHERE const.name = 'Alego Usonga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Alego', const.id
FROM constituencies const
WHERE const.name = 'Alego Usonga'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South East Alego', const.id
FROM constituencies const
WHERE const.name = 'Alego Usonga'
ON CONFLICT DO NOTHING;

-- Gem Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'North Gem', const.id
FROM constituencies const
WHERE const.name = 'Gem'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Gem', const.id
FROM constituencies const
WHERE const.name = 'Gem'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Gem', const.id
FROM constituencies const
WHERE const.name = 'Gem'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Yala Township', const.id
FROM constituencies const
WHERE const.name = 'Gem'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Gem', const.id
FROM constituencies const
WHERE const.name = 'Gem'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Gem', const.id
FROM constituencies const
WHERE const.name = 'Gem'
ON CONFLICT DO NOTHING;

-- Bondo Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Yimbo', const.id
FROM constituencies const
WHERE const.name = 'Bondo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Bondo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Bondo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Yimbo East', const.id
FROM constituencies const
WHERE const.name = 'Bondo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Bondo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Bondo'
ON CONFLICT DO NOTHING;

-- Rarieda Constituency (12 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gem Rae', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South West Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North West Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North East Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South East Asembo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyang’oma Kogelo', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Uyoma', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Uyoma', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Uyoma', const.id
FROM constituencies const
WHERE const.name = 'Rarieda'
ON CONFLICT DO NOTHING;

-- Ugenya Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'East Asembo', const.id
FROM constituencies const
WHERE const.name = 'Ugenya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Asembo', const.id
FROM constituencies const
WHERE const.name = 'Ugenya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Uyoma', const.id
FROM constituencies const
WHERE const.name = 'Ugenya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Uyoma', const.id
FROM constituencies const
WHERE const.name = 'Ugenya'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Uyoma', const.id
FROM constituencies const
WHERE const.name = 'Ugenya'
ON CONFLICT DO NOTHING;

-- Ugunja Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Sidindi', const.id
FROM constituencies const
WHERE const.name = 'Ugunja'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sigomere', const.id
FROM constituencies const
WHERE const.name = 'Ugunja'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ugunja', const.id
FROM constituencies const
WHERE const.name = 'Ugunja'
ON CONFLICT DO NOTHING;

-- Kisumu Central Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Railways', const.id
FROM constituencies const
WHERE const.name = 'Kisumu Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Migosi', const.id
FROM constituencies const
WHERE const.name = 'Kisumu Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Shaurimoyo Kaloleni', const.id
FROM constituencies const
WHERE const.name = 'Kisumu Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Market Milimani', const.id
FROM constituencies const
WHERE const.name = 'Kisumu Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kondele', const.id
FROM constituencies const
WHERE const.name = 'Kisumu Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyalenda B', const.id
FROM constituencies const
WHERE const.name = 'Kisumu Central'
ON CONFLICT DO NOTHING;

-- Kisumu East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kajulu', const.id
FROM constituencies const
WHERE const.name = 'Kisumu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kolwa East', const.id
FROM constituencies const
WHERE const.name = 'Kisumu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Manyatta ’B', const.id
FROM constituencies const
WHERE const.name = 'Kisumu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyalenda ’A', const.id
FROM constituencies const
WHERE const.name = 'Kisumu East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kolwa Central', const.id
FROM constituencies const
WHERE const.name = 'Kisumu East'
ON CONFLICT DO NOTHING;

-- Kisumu West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'South West Kisumu', const.id
FROM constituencies const
WHERE const.name = 'Kisumu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Cetral Kisumu', const.id
FROM constituencies const
WHERE const.name = 'Kisumu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kisumu North', const.id
FROM constituencies const
WHERE const.name = 'Kisumu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Kisumu', const.id
FROM constituencies const
WHERE const.name = 'Kisumu West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North West Kisumu', const.id
FROM constituencies const
WHERE const.name = 'Kisumu West'
ON CONFLICT DO NOTHING;

-- Seme Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Seme', const.id
FROM constituencies const
WHERE const.name = 'Seme'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Seme', const.id
FROM constituencies const
WHERE const.name = 'Seme'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Seme', const.id
FROM constituencies const
WHERE const.name = 'Seme'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Seme', const.id
FROM constituencies const
WHERE const.name = 'Seme'
ON CONFLICT DO NOTHING;

-- Nyando Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'East Kano/Waidhi', const.id
FROM constituencies const
WHERE const.name = 'Nyando'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Awasi/Onjiko', const.id
FROM constituencies const
WHERE const.name = 'Nyando'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ahero', const.id
FROM constituencies const
WHERE const.name = 'Nyando'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabonyo/Kanyag Wal', const.id
FROM constituencies const
WHERE const.name = 'Nyando'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kobura', const.id
FROM constituencies const
WHERE const.name = 'Nyando'
ON CONFLICT DO NOTHING;

-- Muhoroni Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Miwani', const.id
FROM constituencies const
WHERE const.name = 'Muhoroni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ombeyi', const.id
FROM constituencies const
WHERE const.name = 'Muhoroni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Masogo/Nyag’oma', const.id
FROM constituencies const
WHERE const.name = 'Muhoroni'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Chemeli/Muhoroni/Koru', const.id
FROM constituencies const
WHERE const.name = 'Muhoroni'
ON CONFLICT DO NOTHING;

-- Nyakach Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'South East Nyakach', const.id
FROM constituencies const
WHERE const.name = 'Nyakach'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Nyakach', const.id
FROM constituencies const
WHERE const.name = 'Nyakach'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Nyakach', const.id
FROM constituencies const
WHERE const.name = 'Nyakach'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Nyakach', const.id
FROM constituencies const
WHERE const.name = 'Nyakach'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South West Nyakach', const.id
FROM constituencies const
WHERE const.name = 'Nyakach'
ON CONFLICT DO NOTHING;

-- Homa Bay Town Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Homa Bay Central', const.id
FROM constituencies const
WHERE const.name = 'Homa Bay Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Homa Bay Arujo', const.id
FROM constituencies const
WHERE const.name = 'Homa Bay Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Homa Bay West', const.id
FROM constituencies const
WHERE const.name = 'Homa Bay Town'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Homa Bay East', const.id
FROM constituencies const
WHERE const.name = 'Homa Bay Town'
ON CONFLICT DO NOTHING;

-- Kabondo Kasipul Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kabondo East', const.id
FROM constituencies const
WHERE const.name = 'Kabondo Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabondo West', const.id
FROM constituencies const
WHERE const.name = 'Kabondo Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kokwanyo', const.id
FROM constituencies const
WHERE const.name = 'Kabondo Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kakelo-Kojwach', const.id
FROM constituencies const
WHERE const.name = 'Kabondo Kasipul'
ON CONFLICT DO NOTHING;

-- Karachuonyo Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Karachuonyo', const.id
FROM constituencies const
WHERE const.name = 'Karachuonyo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Karachuonyo', const.id
FROM constituencies const
WHERE const.name = 'Karachuonyo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Kanyaluo', const.id
FROM constituencies const
WHERE const.name = 'Karachuonyo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kibiri', const.id
FROM constituencies const
WHERE const.name = 'Karachuonyo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wangchieng', const.id
FROM constituencies const
WHERE const.name = 'Karachuonyo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kendu Bay Town', const.id
FROM constituencies const
WHERE const.name = 'Karachuonyo'
ON CONFLICT DO NOTHING;

-- Kasipul Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Kasipul', const.id
FROM constituencies const
WHERE const.name = 'Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Kasipul', const.id
FROM constituencies const
WHERE const.name = 'Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Kasipul', const.id
FROM constituencies const
WHERE const.name = 'Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Kamagak', const.id
FROM constituencies const
WHERE const.name = 'Kasipul'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Kamagak', const.id
FROM constituencies const
WHERE const.name = 'Kasipul'
ON CONFLICT DO NOTHING;

-- Ndhiwa Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kwabwai', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyadoto', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyikela', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabuoch North', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabuoch South/Pala', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyamwa Kologi', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyamwa Kosewe', const.id
FROM constituencies const
WHERE const.name = 'Ndhiwa'
ON CONFLICT DO NOTHING;

-- Rangwe Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Gem', const.id
FROM constituencies const
WHERE const.name = 'Rangwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Gem', const.id
FROM constituencies const
WHERE const.name = 'Rangwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kagan', const.id
FROM constituencies const
WHERE const.name = 'Rangwe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kochia', const.id
FROM constituencies const
WHERE const.name = 'Rangwe'
ON CONFLICT DO NOTHING;

-- Suba North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mfangano Island', const.id
FROM constituencies const
WHERE const.name = 'Suba North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Rusinga Island', const.id
FROM constituencies const
WHERE const.name = 'Suba North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kasgunga', const.id
FROM constituencies const
WHERE const.name = 'Suba North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gember', const.id
FROM constituencies const
WHERE const.name = 'Suba North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lambwe', const.id
FROM constituencies const
WHERE const.name = 'Suba North'
ON CONFLICT DO NOTHING;

-- Suba South Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gwassi South', const.id
FROM constituencies const
WHERE const.name = 'Suba South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gwassi North', const.id
FROM constituencies const
WHERE const.name = 'Suba South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaksingri West', const.id
FROM constituencies const
WHERE const.name = 'Suba South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruma-Kakshingri', const.id
FROM constituencies const
WHERE const.name = 'Suba South'
ON CONFLICT DO NOTHING;

-- Rongo Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'North Kamagambo', const.id
FROM constituencies const
WHERE const.name = 'Rongo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Kamagambo', const.id
FROM constituencies const
WHERE const.name = 'Rongo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Kamagambo', const.id
FROM constituencies const
WHERE const.name = 'Rongo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Kamagambo', const.id
FROM constituencies const
WHERE const.name = 'Rongo'
ON CONFLICT DO NOTHING;

-- Awendo Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'North East Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Awendo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Awendo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'West Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Awendo'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Sakwa', const.id
FROM constituencies const
WHERE const.name = 'Awendo'
ON CONFLICT DO NOTHING;

-- Suna East Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'God Jope', const.id
FROM constituencies const
WHERE const.name = 'Suna East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Suna Central', const.id
FROM constituencies const
WHERE const.name = 'Suna East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kakrao', const.id
FROM constituencies const
WHERE const.name = 'Suna East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kwa', const.id
FROM constituencies const
WHERE const.name = 'Suna East'
ON CONFLICT DO NOTHING;

-- Suna West Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Wiga', const.id
FROM constituencies const
WHERE const.name = 'Suna West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wasweta II', const.id
FROM constituencies const
WHERE const.name = 'Suna West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ragan-Oruba', const.id
FROM constituencies const
WHERE const.name = 'Suna West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Wasimbete', const.id
FROM constituencies const
WHERE const.name = 'Suna West'
ON CONFLICT DO NOTHING;

-- Uriri Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'West Kanyamkago', const.id
FROM constituencies const
WHERE const.name = 'Uriri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Kanyamkago', const.id
FROM constituencies const
WHERE const.name = 'Uriri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Central Kanyam Kago', const.id
FROM constituencies const
WHERE const.name = 'Uriri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South Kanyamkago', const.id
FROM constituencies const
WHERE const.name = 'Uriri'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'East Kanyamkago', const.id
FROM constituencies const
WHERE const.name = 'Uriri'
ON CONFLICT DO NOTHING;

-- Nyatike Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kachien’g', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kanyasa', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'North Kadem', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Macalder/ Kanyarwanda', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kaler', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Got Kachola', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Muhuru', const.id
FROM constituencies const
WHERE const.name = 'Nyatike'
ON CONFLICT DO NOTHING;

-- Kuria East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Gokeharaka/Getamwega', const.id
FROM constituencies const
WHERE const.name = 'Kuria East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ntimaru West', const.id
FROM constituencies const
WHERE const.name = 'Kuria East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ntimaru East', const.id
FROM constituencies const
WHERE const.name = 'Kuria East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyabasi East', const.id
FROM constituencies const
WHERE const.name = 'Kuria East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyabasi West', const.id
FROM constituencies const
WHERE const.name = 'Kuria East'
ON CONFLICT DO NOTHING;

-- Kuria West Constituency (7 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Bukira East', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bukira Central/ Ikerege', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Isibania', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Makerero', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Masaba', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Tagare', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyamosense/Ko Mosoko', const.id
FROM constituencies const
WHERE const.name = 'Kuria West'
ON CONFLICT DO NOTHING;

-- Kitutu Chache North Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'MONYERERO', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'SENSI', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MARANI', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MWAMONARI', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache North'
ON CONFLICT DO NOTHING;

-- Kitutu Chache South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'BOGUSERO', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOGEKA', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'NYAKOE', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'KITUTU CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'NYATIEKO', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Chache South'
ON CONFLICT DO NOTHING;

-- Nyaribari Masaba Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'ICHUNI', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'NYAMASIBI', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MASIMBA', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'GESUSU', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'KIAMOKAMA', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Masaba'
ON CONFLICT DO NOTHING;

-- Nyaribari Chache Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'BOBARACHO', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'KISII CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'KEUMBU', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'KIOGORO', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BIRONGO', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'IBENO', const.id
FROM constituencies const
WHERE const.name = 'Nyaribari Chache'
ON CONFLICT DO NOTHING;

-- Bomachoge Borabu Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'BORABU MASABA', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Borabu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOOCHI BORABU', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Borabu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOKIMONGE', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Borabu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MAGENCHE', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Borabu'
ON CONFLICT DO NOTHING;

-- Bomachoge Chache Constituency (3 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'MAJOGE BASI', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOOCHI/TENDERE', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Chache'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOSOTI/SENGERA', const.id
FROM constituencies const
WHERE const.name = 'Bomachoge Chache'
ON CONFLICT DO NOTHING;

-- Bobasi Constituency (8 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'MASIGE WEST', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MASIG EAST', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BASI CENTRAL', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'NYACHEKI', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BASSI BOGETAORIO', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOBASI CHACHE', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'SAMETA/ MOKWERERO', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOBASI/ BOITANGARE', const.id
FROM constituencies const
WHERE const.name = 'Bobasi'
ON CONFLICT DO NOTHING;

-- South Mugirango Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'BOGETENGA', const.id
FROM constituencies const
WHERE const.name = 'South Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BORABU/CHITAGO', const.id
FROM constituencies const
WHERE const.name = 'South Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'MOTICHO', const.id
FROM constituencies const
WHERE const.name = 'South Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'GETENGA', const.id
FROM constituencies const
WHERE const.name = 'South Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'TABAKA', const.id
FROM constituencies const
WHERE const.name = 'South Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOIKANGA', const.id
FROM constituencies const
WHERE const.name = 'South Mugirango'
ON CONFLICT DO NOTHING;

-- Bonchari Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'BOMARIBA', const.id
FROM constituencies const
WHERE const.name = 'Bonchari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOGIAKUMU', const.id
FROM constituencies const
WHERE const.name = 'Bonchari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'BOKEIRA', const.id
FROM constituencies const
WHERE const.name = 'Bonchari'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'RIANA', const.id
FROM constituencies const
WHERE const.name = 'Bonchari'
ON CONFLICT DO NOTHING;

-- Borabu Constituency (4 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mekenene', const.id
FROM constituencies const
WHERE const.name = 'Borabu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiabonyoru', const.id
FROM constituencies const
WHERE const.name = 'Borabu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Esise', const.id
FROM constituencies const
WHERE const.name = 'Borabu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyansiongo', const.id
FROM constituencies const
WHERE const.name = 'Borabu'
ON CONFLICT DO NOTHING;

-- Kitutu Masaba Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Rigoma', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gachuba', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kemera', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magombo', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Manga', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Masaba'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gesima', const.id
FROM constituencies const
WHERE const.name = 'Kitutu Masaba'
ON CONFLICT DO NOTHING;

-- West Mugirango Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Nyamaiya', const.id
FROM constituencies const
WHERE const.name = 'West Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bogichora', const.id
FROM constituencies const
WHERE const.name = 'West Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bosamaro', const.id
FROM constituencies const
WHERE const.name = 'West Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bonyamatuta', const.id
FROM constituencies const
WHERE const.name = 'West Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Township', const.id
FROM constituencies const
WHERE const.name = 'West Mugirango'
ON CONFLICT DO NOTHING;

-- North Mugirango Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Itibo', const.id
FROM constituencies const
WHERE const.name = 'North Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bomwagamo', const.id
FROM constituencies const
WHERE const.name = 'North Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Bokeira', const.id
FROM constituencies const
WHERE const.name = 'North Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Magwagwa', const.id
FROM constituencies const
WHERE const.name = 'North Mugirango'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ekerenyo', const.id
FROM constituencies const
WHERE const.name = 'North Mugirango'
ON CONFLICT DO NOTHING;

-- Westlands Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kitisuru', const.id
FROM constituencies const
WHERE const.name = 'Westlands'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Parklands/Highridge', const.id
FROM constituencies const
WHERE const.name = 'Westlands'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Karura', const.id
FROM constituencies const
WHERE const.name = 'Westlands'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kangemi', const.id
FROM constituencies const
WHERE const.name = 'Westlands'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mountain View', const.id
FROM constituencies const
WHERE const.name = 'Westlands'
ON CONFLICT DO NOTHING;

-- Dagoretti North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kilimani', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kawangware', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Gatina', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kileleshwa', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kabiro', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti North'
ON CONFLICT DO NOTHING;

-- Dagoretti South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mutu-Ini', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngando', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Riruta', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Uthiru/Ruthimitu', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Waithaka', const.id
FROM constituencies const
WHERE const.name = 'Dagoretti South'
ON CONFLICT DO NOTHING;

-- Lang’ata Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Karen', const.id
FROM constituencies const
WHERE const.name = 'Lang’ata'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nairobi West', const.id
FROM constituencies const
WHERE const.name = 'Lang’ata'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mugumu-Ini', const.id
FROM constituencies const
WHERE const.name = 'Lang’ata'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'South C', const.id
FROM constituencies const
WHERE const.name = 'Lang’ata'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nyayo Highrise', const.id
FROM constituencies const
WHERE const.name = 'Lang’ata'
ON CONFLICT DO NOTHING;

-- Kibra Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Woodley/Kenyatta Golf Course', const.id
FROM constituencies const
WHERE const.name = 'Kibra'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Sarang’ombe', const.id
FROM constituencies const
WHERE const.name = 'Kibra'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Makina', const.id
FROM constituencies const
WHERE const.name = 'Kibra'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lindi', const.id
FROM constituencies const
WHERE const.name = 'Kibra'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Laini Saba', const.id
FROM constituencies const
WHERE const.name = 'Kibra'
ON CONFLICT DO NOTHING;

-- Roysambu Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kahawa West', const.id
FROM constituencies const
WHERE const.name = 'Roysambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Roysambu', const.id
FROM constituencies const
WHERE const.name = 'Roysambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Githurai', const.id
FROM constituencies const
WHERE const.name = 'Roysambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kahawa', const.id
FROM constituencies const
WHERE const.name = 'Roysambu'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Zimmerman', const.id
FROM constituencies const
WHERE const.name = 'Roysambu'
ON CONFLICT DO NOTHING;

-- Kasarani Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kasarani', const.id
FROM constituencies const
WHERE const.name = 'Kasarani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Njiru', const.id
FROM constituencies const
WHERE const.name = 'Kasarani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Clay City', const.id
FROM constituencies const
WHERE const.name = 'Kasarani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mwiki', const.id
FROM constituencies const
WHERE const.name = 'Kasarani'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ruai', const.id
FROM constituencies const
WHERE const.name = 'Kasarani'
ON CONFLICT DO NOTHING;

-- Ruaraka Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Utalii', const.id
FROM constituencies const
WHERE const.name = 'Ruaraka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Korogocho', const.id
FROM constituencies const
WHERE const.name = 'Ruaraka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lucky Summer', const.id
FROM constituencies const
WHERE const.name = 'Ruaraka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mathare North', const.id
FROM constituencies const
WHERE const.name = 'Ruaraka'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Baba Dogo', const.id
FROM constituencies const
WHERE const.name = 'Ruaraka'
ON CONFLICT DO NOTHING;

-- Embakasi South Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kwa Njenga', const.id
FROM constituencies const
WHERE const.name = 'Embakasi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Imara Daima', const.id
FROM constituencies const
WHERE const.name = 'Embakasi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kware', const.id
FROM constituencies const
WHERE const.name = 'Embakasi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kwa Reuben', const.id
FROM constituencies const
WHERE const.name = 'Embakasi South'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Pipeline', const.id
FROM constituencies const
WHERE const.name = 'Embakasi South'
ON CONFLICT DO NOTHING;

-- Embakasi North Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Dandora Area I', const.id
FROM constituencies const
WHERE const.name = 'Embakasi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dandora Area II', const.id
FROM constituencies const
WHERE const.name = 'Embakasi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dandora Area III', const.id
FROM constituencies const
WHERE const.name = 'Embakasi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Dandora Area IV', const.id
FROM constituencies const
WHERE const.name = 'Embakasi North'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kariobangi North', const.id
FROM constituencies const
WHERE const.name = 'Embakasi North'
ON CONFLICT DO NOTHING;

-- Embakasi Central Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Kayole North', const.id
FROM constituencies const
WHERE const.name = 'Embakasi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kayole Central', const.id
FROM constituencies const
WHERE const.name = 'Embakasi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kariobangi South', const.id
FROM constituencies const
WHERE const.name = 'Embakasi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Komarock', const.id
FROM constituencies const
WHERE const.name = 'Embakasi Central'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Matopeni / Spring Valley', const.id
FROM constituencies const
WHERE const.name = 'Embakasi Central'
ON CONFLICT DO NOTHING;

-- Embakasi East Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Utawala', const.id
FROM constituencies const
WHERE const.name = 'Embakasi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Upper Savanna', const.id
FROM constituencies const
WHERE const.name = 'Embakasi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Lower Savanna', const.id
FROM constituencies const
WHERE const.name = 'Embakasi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Embakasi', const.id
FROM constituencies const
WHERE const.name = 'Embakasi East'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mihango', const.id
FROM constituencies const
WHERE const.name = 'Embakasi East'
ON CONFLICT DO NOTHING;

-- Embakasi West Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Umoja 1', const.id
FROM constituencies const
WHERE const.name = 'Embakasi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Umoja 2', const.id
FROM constituencies const
WHERE const.name = 'Embakasi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mowlem', const.id
FROM constituencies const
WHERE const.name = 'Embakasi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kariobangi south', const.id
FROM constituencies const
WHERE const.name = 'Embakasi West'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Maringo/ Hamza', const.id
FROM constituencies const
WHERE const.name = 'Embakasi West'
ON CONFLICT DO NOTHING;

-- Makadara Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Viwandani', const.id
FROM constituencies const
WHERE const.name = 'Makadara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Harambee', const.id
FROM constituencies const
WHERE const.name = 'Makadara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Makongeni', const.id
FROM constituencies const
WHERE const.name = 'Makadara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Pumwani', const.id
FROM constituencies const
WHERE const.name = 'Makadara'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Eastleigh North', const.id
FROM constituencies const
WHERE const.name = 'Makadara'
ON CONFLICT DO NOTHING;

-- Kamukunji Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Eastleigh South', const.id
FROM constituencies const
WHERE const.name = 'Kamukunji'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Nairobi Central', const.id
FROM constituencies const
WHERE const.name = 'Kamukunji'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Airbase', const.id
FROM constituencies const
WHERE const.name = 'Kamukunji'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'California', const.id
FROM constituencies const
WHERE const.name = 'Kamukunji'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mgara', const.id
FROM constituencies const
WHERE const.name = 'Kamukunji'
ON CONFLICT DO NOTHING;

-- Starehe Constituency (6 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Nairobi South', const.id
FROM constituencies const
WHERE const.name = 'Starehe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Hospital', const.id
FROM constituencies const
WHERE const.name = 'Starehe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngara', const.id
FROM constituencies const
WHERE const.name = 'Starehe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Pangani', const.id
FROM constituencies const
WHERE const.name = 'Starehe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Landimawe', const.id
FROM constituencies const
WHERE const.name = 'Starehe'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ziwani / Kariokor', const.id
FROM constituencies const
WHERE const.name = 'Starehe'
ON CONFLICT DO NOTHING;

-- Mathare Constituency (5 wards)
INSERT INTO wards (name, constituency_id)
SELECT 'Mlango Kubwa', const.id
FROM constituencies const
WHERE const.name = 'Mathare'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Kiamaiko', const.id
FROM constituencies const
WHERE const.name = 'Mathare'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Ngei', const.id
FROM constituencies const
WHERE const.name = 'Mathare'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Huruma', const.id
FROM constituencies const
WHERE const.name = 'Mathare'
ON CONFLICT DO NOTHING;
INSERT INTO wards (name, constituency_id)
SELECT 'Mabatini', const.id
FROM constituencies const
WHERE const.name = 'Mathare'
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================
-- Counties: 47
-- Constituencies: 289
-- Wards: 1451
-- ============================================

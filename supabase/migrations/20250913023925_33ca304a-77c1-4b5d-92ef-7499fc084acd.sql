-- Insert sample Kenyan government officials
INSERT INTO public.officials (name, position, level, constituency, county, party, contact_info) VALUES 
-- Executive
('William Samoei Ruto', 'President', 'executive', NULL, 'Kenya', 'UDA', '{"phone": "+254-20-2227411", "email": "president@president.go.ke"}'),
('Rigathi Gachagua', 'Deputy President', 'executive', NULL, 'Kenya', 'UDA', '{"phone": "+254-20-2227411", "email": "deputypresident@president.go.ke"}'),

-- Cabinet Secretaries (Governors level for our enum)
('Musalia Mudavadi', 'Cabinet Secretary - Foreign Affairs', 'governor', NULL, 'Kenya', 'ANC', '{"ministry": "Foreign Affairs"}'),
('Njuguna Ndung''u', 'Cabinet Secretary - National Treasury', 'governor', NULL, 'Kenya', 'Independent', '{"ministry": "National Treasury"}'),
('Kindiki Kithure', 'Cabinet Secretary - Interior', 'governor', NULL, 'Kenya', 'UDA', '{"ministry": "Interior and National Administration"}'),

-- Governors
('Johnson Sakaja', 'Governor', 'governor', NULL, 'Nairobi', 'UDA', '{"county": "Nairobi"}'),
('Anne Waiguru', 'Governor', 'governor', NULL, 'Kirinyaga', 'UDA', '{"county": "Kirinyaga"}'),
('Gladys Wanga', 'Governor', 'governor', NULL, 'Homa Bay', 'ODM', '{"county": "Homa Bay"}'),

-- Senators
('Aaron Cheruiyot', 'Senator', 'senator', NULL, 'Kericho', 'UDA', '{"county": "Kericho"}'),
('Fatuma Dullo', 'Senator', 'senator', NULL, 'Isiolo', 'UDA', '{"county": "Isiolo"}'),
('Edwin Sifuna', 'Senator', 'senator', NULL, 'Nairobi', 'ODM', '{"county": "Nairobi"}'),

-- Members of Parliament
('Kimani Ichung''wah', 'Member of Parliament', 'mp', 'Kikuyu', 'Kiambu', 'UDA', '{"constituency": "Kikuyu"}'),
('Aden Duale', 'Member of Parliament', 'mp', 'Garissa Township', 'Garissa', 'UDA', '{"constituency": "Garissa Township"}'),
('John Mbadi', 'Member of Parliament', 'mp', 'Suba South', 'Homa Bay', 'ODM', '{"constituency": "Suba South"}'),

-- Women Representatives
('Esther Passaris', 'Women Representative', 'women_rep', NULL, 'Nairobi', 'ODM', '{"county": "Nairobi"}'),
('Sabina Chege', 'Women Representative', 'women_rep', NULL, 'Murang''a', 'Jubilee', '{"county": "Murang''a"}'),
('Gladys Boss', 'Women Representative', 'women_rep', NULL, 'Uasin Gishu', 'UDA', '{"county": "Uasin Gishu"}'),

-- MCAs (sample from Nairobi)
('Peter Imwatok', 'MCA', 'mca', 'Makongeni Ward', 'Nairobi', 'ODM', '{"ward": "Makongeni"}'),
('Susan Githae', 'MCA', 'mca', 'Githurai Ward', 'Nairobi', 'UDA', '{"ward": "Githurai"}'),
('Maurice Gari', 'MCA', 'mca', 'Kilimani Ward', 'Nairobi', 'UDA', '{"ward": "Kilimani"}')
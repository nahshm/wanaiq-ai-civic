import fs from 'fs';

// Comprehensive Kenya geographic data based on IEBC official data (2022)
const kenyaData = {
    counties: [
        // Nairobi Region
        { name: 'Nairobi', population: 4397073 },

        // Central Region
        { name: 'Kiambu', population: 2417735 },
        { name: 'Nyeri', population: 759164 },
        { name: 'Kirinyaga', population: 610411 },
        { name: 'Murang\'a', population: 1056640 },
        { name: 'Nyandarua', population: 638289 },

        // Coast Region
        { name: 'Mombasa', population: 1208333 },
        { name: 'Kilifi', population: 1453787 },
        { name: 'Kwale', population: 866820 },
        { name: 'Lamu', population: 143920 },
        { name: 'Taita Taveta', population: 340671 },
        { name: 'Tana River', population: 315943 },

        // Eastern Region
        { name: 'Embu', population: 608599 },
        { name: 'Isiolo', population: 268002 },
        { name: 'Kitui', population: 1136187 },
        { name: 'Machakos', population: 1421932 },
        { name: 'Makueni', population: 987653 },
        { name: 'Marsabit', population: 459785 },
        { name: 'Meru', population: 1545714 },
        { name: 'Tharaka Nithi', population: 393177 },

        // North Eastern Region
        { name: 'Garissa', population: 841353 },
        { name: 'Mandera', population: 1200000 },
        { name: 'Wajir', population: 781263 },

        // Nyanza Region
        { name: 'Homa Bay', population: 1131950 },
        { name: 'Kisii', population: 1266860 },
        { name: 'Kisumu', population: 1155574 },
        { name: 'Migori', population: 1116436 },
        { name: 'Nyamira', population: 605576 },
        { name: 'Siaya', population: 993183 },

        // Rift Valley Region
        { name: 'Baringo', population: 666763 },
        { name: 'Bomet', population: 875689 },
        { name: 'Elgeyo Marakwet', population: 454480 },
        { name: 'Kajiado', population: 1117840 },
        { name: 'Kericho', population: 901777 },
        { name: 'Laikipia', population: 518560 },
        { name: 'Nakuru', population: 2162202 },
        { name: 'Nandi', population: 885711 },
        { name: 'Narok', population: 1157873 },
        { name: 'Samburu', population: 310327 },
        { name: 'Trans Nzoia', population: 990341 },
        { name: 'Turkana', population: 926976 },
        { name: 'Uasin Gishu', population: 1163186 },
        { name: 'West Pokot', population: 621241 },

        // Western Region
        { name: 'Bungoma', population: 1670570 },
        { name: 'Busia', population: 893681 },
        { name: 'Kakamega', population: 1867579 },
        { name: 'Vihiga', population: 590013 },
    ],
    constituencies: {
        // Nairobi County (17 constituencies)
        'Nairobi': [
            { name: 'Westlands' },
            { name: 'Dagoretti North' },
            { name: 'Dagoretti South' },
            { name: 'Langata' },
            { name: 'Kibra' },
            { name: 'Roysambu' },
            { name: 'Kasarani' },
            { name: 'Ruaraka' },
            { name: 'Embakasi South' },
            { name: 'Embakasi North' },
            { name: 'Embakasi Central' },
            { name: 'Embakasi East' },
            { name: 'Embakasi West' },
            { name: 'Makadara' },
            { name: 'Kamukunji' },
            { name: 'Starehe' },
            { name: 'Mathare' },
        ],

        // Kiambu County
        'Kiambu': [
            { name: 'Gatundu South' },
            { name: 'Gatundu North' },
            { name: 'Juja' },
            { name: 'Thika Town' },
            { name: 'Ruiru' },
            { name: 'Githunguri' },
            { name: 'Kiambu' },
            { name: 'Kiambaa' },
            { name: 'Kabete' },
            { name: 'Kikuyu' },
            { name: 'Limuru' },
            { name: 'Lari' },
        ],

        // Mombasa County (6 constituencies)
        'Mombasa': [
            { name: 'Changamwe' },
            { name: 'Jomvu' },
            { name: 'Kisauni' },
            { name: 'Nyali' },
            { name: 'Likoni' },
            { name: 'Mvita' },
        ],

        // Kisumu County (7 constituencies)
        'Kisumu': [
            { name: 'Kisumu East' },
            { name: 'Kisumu West' },
            { name: 'Kisumu Central' },
            { name: 'Seme' },
            { name: 'Nyando' },
            { name: 'Muhoroni' },
            { name: 'Nyakach' },
        ],

        // Nakuru County (11 constituencies)
        'Nakuru': [
            { name: 'Nakuru Town East' },
            { name: 'Nakuru Town West' },
            { name: 'Bahati' },
            { name: 'Gilgil' },
            { name: 'Naivasha' },
            { name: 'Kuresoi South' },
            { name: 'Kuresoi North' },
            { name: 'Molo' },
            { name: 'Njoro' },
            { name: 'Rongai' },
            { name: 'Subukia' },
        ],

        // Kakamega County (12 constituencies)
        'Kakamega': [
            { name: 'Lugari' },
            { name: 'Likuyani' },
            { name: 'Malava' },
            { name: 'Lurambi' },
            { name: 'Navakholo' },
            { name: 'Mumias West' },
            { name: 'Mumias East' },
            { name: 'Matungu' },
            { name: 'Butere' },
            { name: 'Khwisero' },
            { name: 'Shinyalu' },
            { name: 'Ikolomani' },
        ],

        // Machakos County (8 constituencies)
        'Machakos': [
            { name: 'Machakos Town' },
            { name: 'Mavoko' },
            { name: 'Kathiani' },
            { name: 'Yatta' },
            { name: 'Kangundo' },
            { name: 'Matungulu' },
            { name: 'Mwala' },
            { name: 'Masinga' },
        ],

        // Kilifi County (7 constituencies)
        'Kilifi': [
            { name: 'Kilifi North' },
            { name: 'Kilifi South' },
            { name: 'Ganze' },
            { name: 'Kaloleni' },
            { name: 'Malindi' },
            { name: 'Magarini' },
            { name: 'Rabai' },
        ],

        // Bungoma County (9 constituencies)
        'Bungoma': [
            { name: 'Bumula' },
            { name: 'Kabuchai' },
            { name: 'Kanduyi' },
            { name: 'Kimilili' },
            { name: 'Mt Elgon' },
            { name: 'Sirisia' },
            { name: 'Tongaren' },
            { name: 'Webuye East' },
            { name: 'Webuye West' },
        ],

        // Uasin Gishu County (6 constituencies)
        'Uasin Gishu': [
            { name: 'Ainabkoi' },
            { name: 'Kapseret' },
            { name: 'Kesses' },
            { name: 'Moiben' },
            { name: 'Soy' },
            { name: 'Turbo' },
        ],
    },
    wards: {
        // Nairobi - Westlands Constituency
        'Westlands': [
            { name: 'Kitisuru' },
            { name: 'Parklands/Highridge' },
            { name: 'Karura' },
            { name: 'Kangemi' },
            { name: 'Mountain View' },
        ],

        // Nairobi - Kamukunji Constituency
        'Kamukunji': [
            { name: 'Pumwani' },
            { name: 'Eastleigh North' },
            { name: 'Eastleigh South' },
            { name: 'Airbase' },
            { name: 'California' },
        ],

        // Nairobi - Starehe Constituency
        'Starehe': [
            { name: 'Nairobi Central' },
            { name: 'Ngara' },
            { name: 'Ziwani/Kariokor' },
            { name: 'Landimawe' },
            { name: 'Nairobi South' },
        ],

        // Nairobi - Kibra Constituency
        'Kibra': [
            { name: 'Laini Saba' },
            { name: 'Lindi' },
            { name: 'Makina' },
            { name: 'Woodley/Kenyatta Golf Course' },
            { name: 'Sarang\'ombe' },
        ],

        // Nairobi - Embakasi East Constituency
        'Embakasi East': [
            { name: 'Upper Savannah' },
            { name: 'Lower Savannah' },
            { name: 'Embakasi' },
            { name: 'Utawala' },
            { name: 'Mihango' },
        ],

        // Kiambu - Ruiru Constituency
        'Ruiru': [
            { name: 'Biashara' },
            { name: 'Gatongora' },
            { name: 'Kahawa Sukari' },
            { name: 'Kahawa Wendani' },
            { name: 'Kiuu' },
            { name: 'Mwihoko' },
        ],

        // Kiambu - Thika Town Constituency
        'Thika Town': [
            { name: 'Township' },
            { name: 'Kamenu' },
            { name: 'Hospital' },
            { name: 'Gatuanyaga' },
            { name: 'Ngoliba' },
        ],

        // Mombasa - Changamwe Constituency
        'Changamwe': [
            { name: 'Port Reitz' },
            { name: 'Kipevu' },
            { name: 'Airport' },
            { name: 'Changamwe' },
            { name: 'Chaani' },
        ],

        // Mombasa - Mvita Constituency
        'Mvita': [
            { name: 'Mji Wa Kale/Makadara' },
            { name: 'Tudor' },
            { name: 'Tononoka' },
            { name: 'Shimanzi/Ganjoni' },
            { name: 'Majengo' },
        ],

        // Kisumu - Kisumu East Constituency
        'Kisumu East': [
            { name: 'Kajulu' },
            { name: 'Kolwa East' },
            { name: 'Manyatta B' },
            { name: 'Kolwa Central' },
            { name: 'Nyalenda A' },
        ],

        // Kisumu - Kisumu Central Constituency
        'Kisumu Central': [
            { name: 'Market Milimani' },
            { name: 'Kondele' },
            { name: 'Nyalenda B' },
            { name: 'Migosi' },
            { name: 'Shaurimoyo Kaloleni' },
        ],

        // Nakuru - Nakuru Town East Constituency
        'Nakuru Town East': [
            { name: 'Biashara' },
            { name: 'Kivumbini' },
            { name: 'Flamingo' },
            { name: 'Menengai West' },
            { name: 'Nakuru East' },
        ],

        // Kakamega - Lurambi Constituency
        'Lurambi': [
            { name: 'Butsotso East' },
            { name: 'Butsotso South' },
            { name: 'Butsotso Central' },
            { name: 'Sheywe' },
            { name: 'Mahiakalo' },
            { name: 'Shirugu-Mugai' },
        ],

        // Machakos - Mavoko Constituency
        'Mavoko': [
            { name: 'Athi River' },
            { name: 'Kinanie' },
            { name: 'Muthwani' },
            { name: 'Syokimau/Mulolongo' },
        ],

        // Uasin Gishu - Kapseret Constituency
        'Kapseret': [
            { name: 'Simat/Kapseret' },
            { name: 'Kipkenyo' },
            { name: 'Ngeria' },
            { name: 'Megun' },
            { name: 'Langas' },
        ],
    }
};

const generateSQL = () => {
    let sql = `-- Seed Kenya Geography Data\n\n`;

    // 1. Insert Counties
    sql += `-- Insert Counties\n`;
    kenyaData.counties.forEach(county => {
        const safeName = county.name.replace(/'/g, "''");
        sql += `INSERT INTO counties (name, population, country) SELECT '${safeName}', ${county.population}, 'Kenya' WHERE NOT EXISTS (SELECT 1 FROM counties WHERE name = '${safeName}');\n`;
    });
    sql += `\n`;

    // 2. Insert Constituencies
    sql += `-- Insert Constituencies\n`;
    for (const [countyName, constituencies] of Object.entries(kenyaData.constituencies)) {
        const safeCountyName = countyName.replace(/'/g, "''");
        constituencies.forEach(constituency => {
            const safeName = constituency.name.replace(/'/g, "''");
            sql += `INSERT INTO constituencies (name, county_id) SELECT '${safeName}', id FROM counties WHERE name = '${safeCountyName}' AND NOT EXISTS (SELECT 1 FROM constituencies WHERE name = '${safeName}' AND county_id = counties.id);\n`;
        });
    }
    sql += `\n`;

    // 3. Insert Wards
    sql += `-- Insert Wards\n`;
    for (const [constituencyName, wards] of Object.entries(kenyaData.wards)) {
        const safeConstituencyName = constituencyName.replace(/'/g, "''");
        wards.forEach(ward => {
            const safeName = ward.name.replace(/'/g, "''");
            sql += `INSERT INTO wards (name, constituency_id) SELECT '${safeName}', id FROM constituencies WHERE name = '${safeConstituencyName}' AND NOT EXISTS (SELECT 1 FROM wards WHERE name = '${safeName}' AND constituency_id = constituencies.id);\n`;
        });
    }

    fs.writeFileSync('seed_geography.sql', sql);
    console.log('Generated seed_geography.sql');
};

generateSQL();

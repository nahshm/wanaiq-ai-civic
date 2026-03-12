import fs from 'fs';

// Parse the counties.sql MySQL dump to extract complete ward data
function parseCountiesSql() {
    const sqlContent = fs.readFileSync('counties.sql', 'utf-8');

    // Extract INSERT statements
    const insertMatch = sqlContent.match(/INSERT INTO `county`[^;]+;/gs);
    if (!insertMatch) {
        throw new Error('Could not find INSERT statements in counties.sql');
    }

    const rows = [];
    const valuePattern = /\((\d+),\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g;

    for (const insert of insertMatch) {
        let match;
        while ((match = valuePattern.exec(insert)) !== null) {
            rows.push({
                id: match[1],
                countyCode: match[2],
                countyName: match[3],
                constituencyName: match[4],
                wardName: match[5]
            });
        }
    }

    console.log(`📥 Parsed ${rows.length} rows from counties.sql`);
    return rows;
}

// Build hierarchical structure from flat data
function buildHierarchy(rows) {
    const countiesMap = new Map();
    const constituenciesMap = new Map();

    for (const row of rows) {
        // Track unique counties
        if (!countiesMap.has(row.countyCode)) {
            countiesMap.set(row.countyCode, {
                code: row.countyCode,
                name: row.countyName,
                constituencies: new Map()
            });
        }

        const county = countiesMap.get(row.countyCode);

        // Track unique constituencies per county
        if (!county.constituencies.has(row.constituencyName)) {
            county.constituencies.set(row.constituencyName, {
                name: row.constituencyName,
                wards: []
            });
        }

        // Add ward to constituency
        const constituency = county.constituencies.get(row.constituencyName);
        constituency.wards.push(row.wardName);
    }

    return countiesMap;
}

// Generate PostgreSQL seed migration
function generateMigration(hierarchyMap) {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const migrationName = `20251201000000_seed_geography_data.sql`;

    let sql = `-- ============================================\n`;
    sql += `-- KENYA GEOGRAPHY SEED DATA\n`;
    sql += `-- Source: IEBC Official Data (2022) via counties.sql\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ============================================\n`;
    sql += `-- Total: ${hierarchyMap.size} Counties, Constituencies, and Wards\n`;
    sql += `-- ============================================\n\n`;

    // County populations from official IEBC data
    const countyPopulations = {
        '1': 1208333, '2': 866820, '3': 1453787, '4': 315943, '5': 143920,
        '6': 340671, '7': 841353, '8': 781263, '9': 1200000, '10': 459785,
        '11': 268002, '12': 1545714, '13': 393177, '14': 608599, '15': 1136187,
        '16': 1421932, '17': 987653, '18': 638289, '19': 759164, '20': 610411,
        '21': 1056640, '22': 2417735, '23': 926976, '24': 621241, '25': 310327,
        '26': 990341, '27': 1163186, '28': 454480, '29': 885711, '30': 666763,
        '31': 518560, '32': 2162202, '33': 1157873, '34': 1117840, '35': 901777,
        '36': 875689, '37': 1867579, '38': 590013, '39': 1670570, '40': 893681,
        '41': 993183, '42': 1155574, '43': 1131950, '44': 1116436, '45': 1266860,
        '46': 605576, '47': 4397073
    };

    // 1. Insert Counties
    sql += `-- ============================================\n`;
    sql += `-- INSERT COUNTIES (${hierarchyMap.size} total)\n`;
    sql += `-- ============================================\n\n`;

    for (const [code, county] of hierarchyMap) {
        const safeName = county.name.replace(/'/g, "''");
        const population = countyPopulations[code] || 0;
        sql += `INSERT INTO counties (name, population, country)\n`;
        sql += `VALUES ('${safeName}', ${population}, 'Kenya')\n`;
        sql += `ON CONFLICT (name) DO NOTHING;\n\n`;
    }

    // 2. Insert Constituencies
    sql += `\n-- ============================================\n`;
    sql += `-- INSERT CONSTITUENCIES\n`;
    sql += `-- ============================================\n\n`;

    for (const [code, county] of hierarchyMap) {
        const safeCountyName = county.name.replace(/'/g, "''");
        sql += `-- ${county.name} County (${county.constituencies.size} constituencies)\n`;

        for (const [constName, constituency] of county.constituencies) {
            const safeConstName = constName.replace(/'/g, "''");
            sql += `INSERT INTO constituencies (name, county_id)\n`;
            sql += `SELECT '${safeConstName}', c.id\n`;
            sql += `FROM counties c\n`;
            sql += `WHERE c.name = '${safeCountyName}'\n`;
            sql += `ON CONFLICT DO NOTHING;\n\n`;
        }
        sql += `\n`;
    }

    // 3. Insert Wards
    sql += `-- ============================================\n`;
    sql += `-- INSERT WARDS\n`;
    sql += `-- ============================================\n\n`;

    let totalWards = 0;
    for (const [code, county] of hierarchyMap) {
        for (const [constName, constituency] of county.constituencies) {
            const safeConstName = constName.replace(/'/g, "''");
            sql += `-- ${constName} Constituency (${constituency.wards.length} wards)\n`;

            for (const wardName of constituency.wards) {
                const safeWardName = wardName.replace(/'/g, "''");
                sql += `INSERT INTO wards (name, constituency_id)\n`;
                sql += `SELECT '${safeWardName}', const.id\n`;
                sql += `FROM constituencies const\n`;
                sql += `WHERE const.name = '${safeConstName}'\n`;
                sql += `ON CONFLICT DO NOTHING;\n`;
                totalWards++;
            }
            sql += `\n`;
        }
    }

    // Summary
    const totalConstituencies = Array.from(hierarchyMap.values())
        .reduce((sum, county) => sum + county.constituencies.size, 0);

    sql += `-- ============================================\n`;
    sql += `-- SUMMARY\n`;
    sql += `-- ============================================\n`;
    sql += `-- Counties: ${hierarchyMap.size}\n`;
    sql += `-- Constituencies: ${totalConstituencies}\n`;
    sql += `-- Wards: ${totalWards}\n`;
    sql += `-- ============================================\n`;

    fs.writeFileSync(`supabase/migrations/${migrationName}`, sql);

    console.log(`\n✅ Generated migration: supabase/migrations/${migrationName}`);
    console.log(`\n📊 Statistics:`);
    console.log(`   - ${hierarchyMap.size} counties`);
    console.log(`   - ${totalConstituencies} constituencies`);
    console.log(`   - ${totalWards} wards`);

    return migrationName;
}

// Main execution
try {
    console.log('🚀 Parsing counties.sql...\n');
    const rows = parseCountiesSql();

    console.log('🏗️  Building hierarchy...\n');
    const hierarchy = buildHierarchy(rows);

    console.log('📝 Generating migration...\n');
    const migrationFile = generateMigration(hierarchy);

    console.log(`\n✨ Done! Next steps:`);
    console.log(`   1. Review: supabase/migrations/${migrationFile}`);
    console.log(`   2. Apply: npx supabase migration up`);
    console.log(`   3. Verify: Check database for complete data`);
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

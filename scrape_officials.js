import fs from 'fs';
import https from 'https';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const fetchPage = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', (err) => reject(err));
        });
    });
};

const getConstituencyMap = async () => {
    console.log('Fetching constituency-county mapping from Supabase...');
    const { data, error } = await supabase
        .from('constituencies')
        .select('name, county:counties(name)');

    if (error) {
        console.error('Error fetching constituencies:', error);
        return {};
    }

    const map = {};
    data.forEach(c => {
        if (c.county && c.county.name) {
            const key = c.name.replace(/Constituency/i, '').trim().toLowerCase();
            map[key] = c.county.name;
        }
    });
    console.log(`Loaded ${Object.keys(map).length} constituency mappings.`);
    return map;
};

const parseTable = (html, sectionTitle) => {
    const sectionRegex = new RegExp(`<div class="accordion_titles">${sectionTitle}<\\/div>[\\s\\S]*?<table[\\s\\S]*?>([\\s\\S]*?)<\\/table>`, 'i');
    const match = sectionRegex.exec(html);
    if (!match) return [];

    const tableContent = match[1];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    const rows = [];
    let rowMatch;

    // Skip header row usually
    let isFirst = true;

    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
        if (isFirst) { isFirst = false; continue; }

        const cols = [];
        const colRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        let colMatch;
        while ((colMatch = colRegex.exec(rowMatch[1])) !== null) {
            // Clean HTML tags from cell
            cols.push(colMatch[1].replace(/<[^>]+>/g, '').trim());
        }
        if (cols.length >= 2) rows.push(cols);
    }
    return rows;
};

const fetchProfileDetails = async (url) => {
    if (!url) return { bio: null, committees: [], education: [], experience: [] };

    try {
        const html = await fetchPage(url);

        // Extract Bio (Meta description or first paragraph in content)
        // Looking for "Sen. Name is..." or similar
        let bio = null;
        const bioMatch = /<div class="pure-u-1 pure-u-lg-2-3">\s*<p[^>]*>([\s\S]*?)<\/p>/.exec(html);
        if (bioMatch) {
            bio = bioMatch[1].replace(/<[^>]+>/g, '').trim();
        }

        // Extract Committees
        const committees = [];
        const committeeSectionRegex = /Committee Memberships:[\s\S]*?<ul>([\s\S]*?)<\/ul>/i;
        const commMatch = committeeSectionRegex.exec(html);
        if (commMatch) {
            const itemRegex = /<li>([\s\S]*?)<\/li>/g;
            let item;
            while ((item = itemRegex.exec(commMatch[1])) !== null) {
                committees.push(item[1].replace(/<[^>]+>/g, '').trim());
            }
        }

        // Extract Education
        const eduRows = parseTable(html, 'Education');
        const education = eduRows.map(row => ({
            from: row[0] || '',
            to: row[1] || '',
            institution: row[2] || '',
            qualification: row[3] || ''
        }));

        // Extract Experience
        const expRows = parseTable(html, 'Experience');
        const experience = expRows.map(row => ({
            from: row[0] || '',
            to: row[1] || '',
            employer: row[2] || '',
            position: row[3] || ''
        }));

        return { bio, committees, education, experience };

    } catch (e) {
        console.error(`Error fetching profile ${url}:`, e.message);
        return { bio: null, committees: [], education: [], experience: [] };
    }
};

const extractOfficials = (html, defaultLevel, constituencyMap) => {
    const baseUrl = 'https://mzalendo.com';
    const cardRegex = /<div class="mp_card">([\s\S]*?)<\/div>\s*<\/div>/g;
    const officials = [];
    let match;

    while ((match = cardRegex.exec(html)) !== null) {
        const card = match[1];
        const imgMatch = /<img src="([^"]+)"/.exec(card);
        const photoUrl = imgMatch ? (imgMatch[1].startsWith('/') ? baseUrl + imgMatch[1] : imgMatch[1]) : null;
        const nameMatch = /<a href="([^"]+)">\s*([^<]+)\s*<\/a>/.exec(card);
        const profileUrl = nameMatch ? nameMatch[1] : null;
        let name = nameMatch ? nameMatch[2].trim() : null;

        if (name) name = name.replace(/\s+/g, ' ').replace(/'/g, "''");

        const posMatch = /<p>\s*([\s\S]*?)\s*<\/p>/.exec(card);
        let positionRaw = posMatch ? posMatch[1].replace(/<br\s*\/?>/g, '').trim() : null;

        let level = defaultLevel === 'senate' ? 'senator' : 'mp';
        let position = defaultLevel === 'senate' ? 'Senator' : 'Member of Parliament';
        let constituency = null;
        let county = null;

        if (positionRaw) {
            if (positionRaw.includes('Member for')) {
                const parts = positionRaw.split('Member for');
                if (parts.length > 1) {
                    const loc = parts[1].trim().replace('.', '');
                    if (loc.includes('Constituency')) {
                        constituency = loc.replace('Constituency', '').trim();
                        const lookupKey = constituency.toLowerCase();
                        if (constituencyMap[lookupKey]) county = constituencyMap[lookupKey];
                    } else if (loc.includes('County')) {
                        county = loc.replace('County', '').trim();
                        if (defaultLevel === 'national') {
                            level = 'women_rep';
                            position = "Women's Representative";
                        }
                    } else {
                        constituency = loc;
                        const lookupKey = constituency.toLowerCase();
                        if (constituencyMap[lookupKey]) county = constituencyMap[lookupKey];
                    }
                }
            } else if (positionRaw.includes("Women's Representative")) {
                level = 'women_rep';
                position = "Women's Representative";
                const parts = positionRaw.split('for');
                if (parts.length > 1) county = parts[1].trim().replace('.', '');
            } else if (positionRaw.includes('Senator for')) {
                const parts = positionRaw.split('Senator for');
                if (parts.length > 1) county = parts[1].trim().replace('County', '').replace('.', '').trim();
            }
        }

        if (name) {
            officials.push({
                name,
                position,
                level,
                constituency: constituency ? constituency.replace(/'/g, "''") : null,
                county: county ? county.replace(/'/g, "''") : null,
                party: 'Independent',
                photo_url: photoUrl,
                source_url: profileUrl ? (profileUrl.startsWith('/') ? baseUrl + profileUrl : profileUrl) : null
            });
        }
    }
    return officials;
};

const scrapeAll = async () => {
    const constituencyMap = await getConstituencyMap();

    const sources = [
        { url: 'https://mzalendo.com/parliament/national_assembly/', level: 'national', pages: 22 },
        { url: 'https://mzalendo.com/parliament/senate/', level: 'senate', pages: 5 }
    ];

    let allOfficials = [];

    // Step 1: Get Basic Info
    for (const source of sources) {
        console.log(`Scraping list for ${source.level}...`);
        for (let i = 1; i <= source.pages; i++) {
            const pageUrl = `${source.url}?page=${i}`;
            try {
                const html = await fetchPage(pageUrl);
                const officials = extractOfficials(html, source.level, constituencyMap);
                if (officials.length === 0) break;
                allOfficials = [...allOfficials, ...officials];
            } catch (e) {
                console.error(`  Error fetching page ${i}:`, e.message);
            }
        }
    }

    console.log(`Found ${allOfficials.length} officials. Fetching details...`);

    // Step 2: Fetch Details with Concurrency
    const BATCH_SIZE = 5;
    for (let i = 0; i < allOfficials.length; i += BATCH_SIZE) {
        const batch = allOfficials.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i + 1} to ${Math.min(i + BATCH_SIZE, allOfficials.length)}...`);

        await Promise.all(batch.map(async (official) => {
            if (official.source_url) {
                const details = await fetchProfileDetails(official.source_url);
                official.bio = details.bio ? details.bio.replace(/'/g, "''") : null;
                official.committees = JSON.stringify(details.committees).replace(/'/g, "''");
                official.education = JSON.stringify(details.education).replace(/'/g, "''");
                official.experience = JSON.stringify(details.experience).replace(/'/g, "''");
            }
        }));
    }

    // Generate SQL
    let sql = `
    -- Clear existing data
    TRUNCATE TABLE officials CASCADE;

    INSERT INTO officials (name, position, level, constituency, county, party, photo_url, bio, committees, education, experience) VALUES
  `;

    const values = allOfficials.map(o => {
        const escape = (str) => str ? str.replace(/'/g, "''") : null;
        return `('${escape(o.name)}', '${escape(o.position)}', '${o.level}', ${o.constituency ? `'${escape(o.constituency)}'` : 'NULL'}, ${o.county ? `'${escape(o.county)}'` : 'NULL'}, '${escape(o.party)}', '${o.photo_url}', ${o.bio ? `'${escape(o.bio)}'` : 'NULL'}, '${o.committees}'::jsonb, '${o.education}'::jsonb, '${o.experience}'::jsonb)`;
    }).join(',\n');

    sql += values + ';';

    fs.writeFileSync('seed_officials.sql', sql);
    console.log('SQL file generated: seed_officials.sql');
};

scrapeAll();

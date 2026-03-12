#!/usr/bin/env node
/**
 * Auto-fix select('*') to use SELECT_FIELDS
 * 
 * Usage: node scripts/fix-select-star.js
 * 
 * This script:
 * 1. Finds all .select('*') calls
 * 2. Determines appropriate SELECT_FIELDS constant based on context
 * 3. Replaces with selective field fetching
 * 4. Creates backup of original file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Mapping of table names to SELECT_FIELDS constants
const TABLE_TO_FIELDS = {
    posts: 'POST_WITH_RELATIONS',
    profiles: 'PROFILE_FULL',
    communities: 'COMMUNITY_FULL',
    comments: 'COMMENT_WITH_AUTHOR',
    channels: 'CHANNEL_FULL',
    notifications: 'NOTIFICATION_WITH_ACTOR',
    votes: 'VOTE_MINIMAL',
    // Admin/debug can keep select('*') - add to whitelist
};

// Patterns to detect table name
const TABLE_PATTERNS = [
    /\.from\(['"`](\w+)['"`]\)/,
    /table: ['"`](\w+)['"`]/,
];

// Whitelist (files that can keep select('*'))
const WHITELIST = [
    'ProfileDataDebug.tsx', // Debug component
    'SuperAdminDashboard.tsx', // Admin needs full data
];

function detectTableName(fileContent, lineNumber) {
    const lines = fileContent.split('\n');
    const startLine = Math.max(0, lineNumber - 10);
    const contextLines = lines.slice(startLine, lineNumber + 1).join('\n');

    for (const pattern of TABLE_PATTERNS) {
        const match = contextLines.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

function generateReplacement(tableName, originalLine) {
    const fieldConstant = TABLE_TO_FIELDS[tableName];

    if (!fieldConstant) {
        return null; // Unknown table, skip
    }

    // Check if it's a complex select with relations
    if (originalLine.includes(',') || originalLine.includes('!')) {
        // Already has relations, keep it
        return null;
    }

    return originalLine.replace(
        /\.select\(['"`]\*['"`]\)/,
        `.select(SELECT_FIELDS.${fieldConstant})`
    );
}

function processFile(filePath) {
    const fileName = path.basename(filePath);

    // Check whitelist
    if (WHITELIST.some(w => fileName.includes(w))) {
        log(`  ⏭️  Skipped (whitelisted): ${fileName}`, 'yellow');
        return { modified: false, reason: 'whitelisted' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let modified = false;
    let replacements = 0;
    let needsImport = false;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes(".select('*')")) {
            const tableName = detectTableName(content, i);

            if (tableName) {
                const replacement = generateReplacement(tableName, line);

                if (replacement) {
                    lines[i] = replacement;
                    modified = true;
                    replacements++;
                    needsImport = true;
                    log(`    ✓ Line ${i + 1}: ${tableName} → SELECT_FIELDS.${TABLE_TO_FIELDS[tableName]}`, 'green');
                }
            }
        }
    }

    if (modified) {
        // Add import if needed
        if (needsImport && !content.includes('SELECT_FIELDS')) {
            const importLine = "import { SELECT_FIELDS } from '@/lib/select-fields';\n";
            const firstImportIndex = lines.findIndex(l => l.startsWith('import '));

            if (firstImportIndex !== -1) {
                lines.splice(firstImportIndex, 0, importLine);
            }
        }

        // Create backup
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, content);

        // Write modified content
        fs.writeFileSync(filePath, lines.join('\n'));

        return { modified: true, replacements, backupPath };
    }

    return { modified: false, reason: 'no changes needed' };
}

function main() {
    log('\n🔍 Finding files with select(\'*\')...', 'bright');

    // Find all files with select('*')
    const grepCommand = `grep -r "\\.select\\('\\*'\\)" src/ --include="*.tsx" --include="*.ts" -l`;

    let files;
    try {
        const output = execSync(grepCommand, { encoding: 'utf8' });
        files = output.trim().split('\n').filter(Boolean);
    } catch (error) {
        log('❌ No files found or grep error', 'red');
        return;
    }

    log(`\n📁 Found ${files.length} files\n`, 'blue');

    const results = {
        modified: 0,
        skipped: 0,
        failed: 0,
        totalReplacements: 0,
    };

    files.forEach((file, index) => {
        log(`[${index + 1}/${files.length}] Processing: ${file}`, 'blue');

        try {
            const result = processFile(file);

            if (result.modified) {
                results.modified++;
                results.totalReplacements += result.replacements;
                log(`  ✅ Modified (${result.replacements} replacements)`, 'green');
                log(`  💾 Backup: ${result.backupPath}`, 'yellow');
            } else {
                results.skipped++;
                log(`  ⏭️  ${result.reason}`, 'yellow');
            }
        } catch (error) {
            results.failed++;
            log(`  ❌ Error: ${error.message}`, 'red');
        }
    });

    // Summary
    log('\n' + '='.repeat(50), 'bright');
    log('📊 SUMMARY', 'bright');
    log('='.repeat(50), 'bright');
    log(`✅ Modified: ${results.modified} files`, 'green');
    log(`📝 Total replacements: ${results.totalReplacements}`, 'green');
    log(`⏭️  Skipped: ${results.skipped} files`, 'yellow');
    log(`❌ Failed: ${results.failed} files`, 'red');
    log('='.repeat(50) + '\n', 'bright');

    if (results.modified > 0) {
        log('💡 TIP: Review changes with git diff before committing', 'blue');
        log('💡 TIP: Backups saved with .backup extension', 'blue');
        log('💡 TIP: Run npm run dev to check for errors\n', 'blue');
    }
}

main();

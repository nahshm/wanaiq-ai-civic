# PowerShell script to batch-fix select('*') with SELECT_FIELDS
# Usage: .\fix-select-bandwidth.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n🔧 Bandwidth Optimization - Batch Fix Script`n" -ForegroundColor Cyan

# Files to process (high priority)
$filesToFix = @(
    @{
        Path = "src\features\feed\pages\EditPost.tsx"
        Replacements = @(
            @{ Line = 26; Old = ".select('*')"; New = ".select(SELECT_FIELDS.COMMUNITY_CARD)" }
        )
    },
    @{
        Path = "src\pages\Profile.tsx"
        Replacements = @(
            @{ Line = 161; Old = ".select('*')"; New = ".select(SELECT_FIELDS.PROFILE_FULL)" }
        )
    },
    @{
        Path = "src\features\profile\pages\ActionCenter.tsx"
        Replacements = @(
            @{ Line = 144; Old = ".select('*')"; New = ".select('id,title,description,status,created_at,target_date,progress')" }
        )
    },
    @{
        Path = "src\components\chat\UserSearch.tsx"
        Replacements = @(
            @{ Line = 29; Old = ".select('*')"; New = ".select(SELECT_FIELDS.PROFILE_CARD)" }
        )
    },
    @{
        Path = "src\components\community\CreatePostModal.tsx"
        Replacements = @(
            @{ Line = 39; Old = ".select('*')"; New = ".select(SELECT_FIELDS.COMMUNITY_CARD)" }
        )
    }
)

$totalFixed = 0
$totalFiles = $filesToFix.Count

foreach ($file in $filesToFix) {
    $filePath = Join-Path $PSScriptRoot ".." $file.Path
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⏭️  Skipped: $($file.Path) (not found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`n📄 Processing: $($file.Path)" -ForegroundColor Blue
    
    # Read content
    $content = Get-Content $filePath -Raw
    $original = $content
    
    # Check if SELECT_FIELDS import exists
    $needsImport = $content -notmatch "SELECT_FIELDS"
    
    # Apply replacements
    $replacementCount = 0
    foreach ($replacement in $file.Replacements) {
        if ($content -match [regex]::Escape($replacement.Old)) {
            $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
            $replacementCount++
            Write-Host "  ✓ Replaced: $($replacement.Old) → $($replacement.New)" -ForegroundColor Green
        }
    }
    
    # Add import if needed
    if ($needsImport -and ($replacementCount -gt 0) -and ($content -match "SELECT_FIELDS")) {
        # Find first import line
        if ($content -match "(?m)^import ") {
            $importLine = "import { SELECT_FIELDS } from '@/lib/select-fields';`n"
            $content = $content -replace "(?m)(^import [^;]+;)", "$importLine`$1"
            Write-Host "  ✓ Added SELECT_FIELDS import" -ForegroundColor Green
        }
    }
    
    # Save if changed
    if ($content -ne $original) {
        # Create backup
        $backupPath = "$filePath.backup"
        Copy-Item $filePath $backupPath -Force
        
        # Write changes
        Set-Content $filePath $content -NoNewline
        
        $totalFixed++
        Write-Host "  ✅ Saved ($replacementCount fixes)" -ForegroundColor Green
        Write-Host "  💾 Backup: $backupPath" -ForegroundColor Yellow
    } else {
        Write-Host "  ⏭️  No changes needed" -ForegroundColor Yellow
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Fixed: $totalFixed / $totalFiles files" -ForegroundColor Green
Write-Host "💾 Backups created with .backup extension" -ForegroundColor Yellow
Write-Host ("=" * 60) + "`n" -ForegroundColor Cyan

Write-Host "💡 Next steps:" -ForegroundColor Blue
Write-Host "  1. Review changes: git diff" -ForegroundColor White
Write-Host "  2. Test: npm run dev" -ForegroundColor White
Write-Host "  3. Check for errors in browser console" -ForegroundColor White
Write-Host "  4. Run migration: supabase db push`n" -ForegroundColor White

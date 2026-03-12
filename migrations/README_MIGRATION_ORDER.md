# Geographic Data Admin - Migration & Setup Guide

## Issue: Template Showing "Nations" Level

**Problem:** The existing Kenya template in the database has "nation" as a geographic division level, which is incorrect. Kenya IS the nation - geographic divisions should be County → Constituency → Ward.

**Cause:** The original seed data (`20251209100000_seed_kenya_positions.sql` line 22) incorrectly includes `"nation"` in the levels array for **geographic divisions**. Nation-level **positions** (President, etc.) belong in the `government_positions` table, not as geographic boundaries.

## Migration Order (CRITICAL)

Run these SQL files in Supabase SQL Editor **in this exact order**:

### 1. Fix Kenya Template First
```sql
-- Run: migrations/fix_kenya_template.sql
```
This removes the invalid "nation" level from Kenya's template.

### 2. Create New Schema
```sql
-- Run: migrations/admin_divisions_polymorphic.sql
```
This creates:
- `administrative_divisions` table (polymorphic schema)
- Indexes for performance
- Migrates existing Kenya data from old tables
- Creates backward-compatible views

### 3. Enhance Templates (Optional - for testing multiple countries)
```sql
-- Run: migrations/governance_templates_enhanced.sql
```
Adds templates for USA, Nigeria, UK, South Africa with proper labels.

## Post-Migration Testing

1. Navigate to `/superadmin` → "Geographic Data" tab
2. Select **Kenya** - should now show **3 tabs**:
   - **Counties** (47)
   - **Constituencies** (290)
   - **Wards** (1,450)
3. Verify existing data loads correctly
4. Test CRUD operations (add/edit/delete)

## Why Data Wasn't Loading

The `AdministrativeDivisionManager` component queries the **new** `administrative_divisions` table:

```tsx
.from('administrative_divisions')
.eq('country_code', countryCode)
.eq('governance_level', governanceLevel)
```

**Before migration:** Table doesn't exist → Query fails → Shows "Loading..." forever

**After migration:** Data migrated from old tables → Queries work correctly

## Architecture Note

**Geographic Divisions** (administrative_divisions table):
- County, Constituency, Ward, State, Province, etc.
- Physical boundaries where people live
- Have parent-child relationships

**Political Positions** (government_positions table):
- President, Governor, Senator, MP, etc.
- Offices that GOVERN those divisions
- Claimed by individuals via office_holders table

The "nation" level belongs in **positions** (President of Kenya), not **divisions** (there's no sub-nation to divide).

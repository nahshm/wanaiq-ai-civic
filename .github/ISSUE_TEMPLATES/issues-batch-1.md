# GitHub Issues - Complete Template Set

This file contains ready-to-use GitHub issue templates for all identified improvements.

---

## 🏷️ Labels to Create First

Go to: `https://github.com/nahshm/wana-connect-civic/labels`

```
priority: p0-critical     #d73a4a (red)
priority: p1-high         #ff9500 (orange)
priority: p2-medium       #fbca04 (yellow)
priority: p3-low          #0e8a16 (green)

type: bug                 #d73a4a (red)
type: code-quality        #1d76db (blue)
type: performance         #ff9500 (orange)
type: security            #d73a4a (red)
type: testing             #1d76db (blue)
type: tech-debt           #fbca04 (yellow)
type: feature             #0075ca (blue)

area: frontend            #bfdadc (cyan)
area: backend             #d4c5f9 (purple)
area: build               #c5def5 (light blue)
area: monitoring          #f9d0c4 (peach)

effort: small             #c2e0c6 (<2 hours)
effort: medium            #fef2c0 (2-8 hours)
effort: large             #f9c9c9 (1-3 days)
```

---

## 📅 Milestones to Create

Go to: `https://github.com/nahshm/wana-connect-civic/milestones`

### Milestone 1: Code Quality Sprint

- **Due date**: 2 weeks from today
- **Description**: Fix critical code quality issues - ESLint errors, console statements, type safety

### Milestone 2: Production Monitoring

- **Due date**: 4 weeks from today
- **Description**: Implement error monitoring, testing, and observability

### Milestone 3: Feature Completion

- **Due date**: 6 weeks from today
- **Description**: Complete TODOs and missing features

---

## 🔴 CRITICAL ISSUES (P0)

### Issue #1: Fix 386 ESLint errors and warnings

**Title**: [Code Quality] Fix 386 ESLint errors and warnings blockers

**Labels**: `priority: p0-critical`, `type: code-quality`, `area: frontend`, `effort: large`

**Milestone**: Code Quality Sprint

**Body**:

````markdown
## Problem

Build completes successfully but has **386 ESLint problems** (329 errors, 57 warnings) blocking clean code quality.

## Current State

```bash
npm run lint
# ❌ 386 problems (329 errors, 57 warnings)
# ✅ 13 errors and 6 warnings potentially fixable with --fix
```
````

## Root Causes

1. **Parsing error** in 1 file (possibly non-JS/TS file in src/)
2. **300+ violations** of `@typescript-eslint/no-explicit-any`
3. Various other rule violations

## Action Items

### Phase 1: Quick Wins (Day 1)

- [ ] Run `npm run lint:fix` to auto-fix 13 issues
- [ ] Identify and fix parsing error (1 file)
- [ ] Review remaining auto-fixable warnings

### Phase 2: Manual Fixes (Days 2-3)

- [ ] Fix high-impact files with multiple `any` types:
  - `src/utils/feedIntegration.ts`
  - `src/pages/SearchResults.tsx`
  - `src/pages/Quests.tsx`
  - `src/pages/Profile.tsx`
- [ ] Create proper TypeScript interfaces (see #4)
- [ ] Address remaining warnings

### Phase 3: Verification (Day 4)

- [ ] Ensure all errors resolved
- [ ] Keep warnings under 10
- [ ] Update CI/CD to enforce linting

## Success Criteria

- ✅ ESLint errors: 0
- ✅ ESLint warnings: <10
- ✅ All auto-fixable issues resolved
- ✅ Clean `npm run build`

## Effort Estimate

**3-4 days** (24-32 hours)

## Related Issues

- #4 (TypeScript type safety)

````

---

### Issue #2: Integrate Sentry error monitoring

**Title**: [Infrastructure] Implement Sentry error monitoring for production

**Labels**: `priority: p0-critical`, `type: monitoring`, `area: frontend`, `area: backend`, `effort: medium`

**Milestone**: Production Monitoring

**Body**:
```markdown
## Problem
**No production error tracking** - we have zero visibility into runtime errors users experience.

## Current State
- ❌ Sentry not integrated
- ✅ Documentation exists (`docs/ERROR_MONITORING.md`)
- ❌ Errors logged via `console.error` (200+ instances)
- ✅ Error boundaries exist but don't report

## Implementation Plan

### Step 1: Setup (2 hours)
- [ ] Create Sentry account: https://sentry.io/signup/
- [ ] Create "WanaIQ" project in Sentry
- [ ] Get DSN from project settings
- [ ] Install packages:
```bash
npm install @sentry/react @sentry/tracing
````

### Step 2: Integration (2 hours)

- [ ] Create `src/lib/sentry.ts` (template in `docs/ERROR_MONITORING.md`)
- [ ] Add environment variables:

```env
VITE_SENTRY_DSN=your_dsn_here
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

- [ ] Initialize Sentry in `src/main.tsx`
- [ ] Wrap App with `Sentry.ErrorBoundary`

### Step 3: Error Fallback UI (2 hours)

- [ ] Create `src/components/ErrorFallback.tsx`
- [ ] Test error boundary with test error

### Step 4: Replace Console.error (4 hours)

- [ ] Replace all `console.error()` calls with `Sentry.captureException()`
- [ ] Add context/tags to error reports
- [ ] Update error boundaries to report to Sentry:
  - `src/components/onboarding/OnboardingErrorBoundary.tsx`
  - `src/components/community/CommunityErrorBoundary.tsx`

### Step 5: Source Maps & Alerts (2 hours)

- [ ] Configure source map upload in `vite.config.ts`
- [ ] Set up Sentry alerts for critical errors
- [ ] Configure Slack/email notifications (optional)

## Testing

```typescript
// Test in development
if (import.meta.env.DEV) {
  window.testSentryError = () => {
    throw new Error("Test Sentry Error");
  };
}
// Run: testSentryError() in console
```

## Success Criteria

- ✅ Sentry integrated and receiving errors
- ✅ Source maps uploaded for debugging
- ✅ Error fallback UI displays on crashes
- ✅ All error boundaries report to Sentry
- ✅ Alerts configured for critical issues

## Effort Estimate

**1-2 days** (8-16 hours)

## Reference

Complete implementation guide: `docs/ERROR_MONITORING.md`

## Related Issues

- #3 (Remove console statements)

````

---

### Issue #3: Remove 200+ console statements from production code

**Title**: [Code Quality] Remove 200+ console.log/error statements from production

**Labels**: `priority: p0-critical`, `type: code-quality`, `type: performance`, `area: frontend`, `effort: medium`

**Milestone**: Code Quality Sprint

**Body**:
```markdown
## Problem
**200+ console statements** scattered throughout the codebase:
- Performance overhead in production
- Security risk (exposes implementation details)
- Clutters browser console
- Should use proper error tracking instead

## Audit Results

### High-Impact Files
- `src/pages/Profile.tsx` - **16 statements** (mix of debug logs and errors)
- `src/pages/Onboarding/Step4Communities.tsx` - **7 statements**
- `src/components/*` - **40+ files** with console usage
- `src/lib/vitals.ts` - Performance logging
- `src/lib/api-tracking.ts` - API monitoring logs

### Breakdown by Type
- `console.log()` - **~80** debug statements (DELETE)
- `console.error()` - **~100** error logs (REPLACE with Sentry)
- `console.warn()` - **~20** warnings (GUARD with DEV check)

## Action Plan

### Phase 1: Remove Debug Logs (4 hours)
Search and remove all debug `console.log` statements:
```bash
# Find all instances
grep -r "console.log" src/

# Priority files:
# - src/pages/Profile.tsx (6 debug logs)
# - src/pages/Onboarding/Step4Communities.tsx
````

### Phase 2: Replace Error Logging (6 hours)

Replace `console.error()` with Sentry (requires #2 completed):

```typescript
// BEFORE
console.error("Error updating profile:", error);

// AFTER
import * as Sentry from "@sentry/react";
Sentry.captureException(error, {
  tags: { feature: "profile-update" },
  extra: { userId: user.id },
});
```

### Phase 3: Guard Warnings (2 hours)

Wrap legitimate warnings with DEV guard:

```typescript
// BEFORE
console.warn("Slow operation:", duration);

// AFTER
if (import.meta.env.DEV) {
  console.warn("Slow operation:", duration);
}
```

### Phase 4: Keep Performance Monitoring (Decision)

Decide on `src/lib/vitals.ts` and `src/lib/api-tracking.ts`:

- **Option A**: Remove entirely (use Sentry Performance)
- **Option B**: Wrap with DEV guard
- **Option C**: Send to analytics service instead

## Verification

```bash
# Ensure no console in production
npm run build
grep -r "console\." dist/ || echo "✅ Clean!"
```

## Success Criteria

- ✅ 0 `console.log` statements in src/
- ✅ 0 `console.error` (replaced with Sentry)
- ✅ All `console.warn` guarded with DEV checks
- ✅ Production bundle has no console calls

## Effort Estimate

**1.5 days** (12 hours)

## Dependencies

- Requires #2 (Sentry) completed first

## Related Issues

- #2 (Sentry integration)

````

---

## 🟡 HIGH PRIORITY (P1)

### Issue #4: Replace any types with proper TypeScript interfaces

**Title**: [TypeScript] Replace 300+ `any` types with proper interfaces

**Labels**: `priority: p1-high`, `type: code-quality`, `type: tech-debt`, `area: frontend`, `effort: large`

**Milestone**: Code Quality Sprint

**Body**:
```markdown
## Problem
**300+ instances of `any` type** bypass TypeScript's type safety, leading to:
- Potential runtime errors
- Poor IDE autocomplete
- Reduced code maintainability
- No compile-time error checking

## High-Impact Files

Priority order for maximum impact:

### 1. `src/utils/feedIntegration.ts` (10 instances)
```typescript
// Current
posts: any[], quests: any[], updates: any[]

// Fix: Create proper interfaces
interface Post { id: string; title: string; /* ... */ }
interface Quest { id: string; title: string; /* ... */ }
````

### 2. `src/pages/SearchResults.tsx` (20+ instances)

```typescript
// Current
data.posts.map((post: any) => ...)

// Fix: Import and use types
import { Post, User, Community } from '@/types';
data.posts.map((post: Post) => ...)
```

### 3. `src/pages/Quests.tsx` (5 instances)

Remove `as any` type assertions:

```typescript
// Current
.from('quests' as any)

// Fix: Update Supabase types or create proper type
.from('quests')
```

### 4. `src/pages/Profile.tsx` (10+ instances)

Type utility functions:

```typescript
// Current
function toCamelCase(obj: any): any { ... }

// Fix
function toCamelCase<T extends Record<string, any>>(
  obj: T
): CamelCaseKeys<T> { ... }
```

## Action Plan

### Phase 1: Create Missing Interfaces (Day 1)

- [ ] Audit `src/types/` for missing types
- [ ] Create interfaces for:
  - Feed integration objects
  - Search result types
  - Quest system types
  - Profile data structures

### Phase 2: Replace High-Impact Files (Days 2-3)

- [ ] Fix `feedIntegration.ts`
- [ ] Fix `SearchResults.tsx`
- [ ] Fix `Quests.tsx`
- [ ] Fix `Profile.tsx`

### Phase 3: Remaining Files (Days 4-5)

- [ ] Fix test utilities (acceptable to keep `any` in mocks)
- [ ] Fix remaining components
- [ ] Update Supabase type definitions if needed

## Success Criteria

- ✅ `any` usage reduced from 300+ to <50
- ✅ All production code properly typed
- ✅ Test files can keep `any` (acceptable)
- ✅ No new `@typescript-eslint/no-explicit-any` errors

## Effort Estimate

**5-7 days** (40-56 hours)

## Related Issues

- #1 (ESLint fixes)

````

---

### Issue #5: Implement view tracking for projects

**Title**: [Feature] Implement view tracking system for projects

**Labels**: `priority: p1-high`, `type: feature`, `area: frontend`, `area: backend`, `effort: medium`

**Milestone**: Feature Completion

**Body**:
```markdown
## Problem
Project view counts are hardcoded to 0 with TODO comments:

```typescript
// src/hooks/useProjects.ts:192
projectData.views_count = 0; // TODO: Implement view tracking

// src/hooks/useProjects.ts:303
enriched.views_count = 0; // TODO: Implement
````

## Implementation Plan

### Database Schema

Check if `project_views` table exists, or create:

```sql
CREATE TABLE IF NOT EXISTS project_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now(),
  session_id text, -- For anonymous users
  UNIQUE(project_id, user_id, DATE(viewed_at)) -- One view per user per day
);

-- Add index for performance
CREATE INDEX idx_project_views_project_id ON project_views(project_id);

-- Create view count function
CREATE OR REPLACE FUNCTION get_project_view_count(p_project_id uuid)
RETURNS integer AS $$
  SELECT COUNT(DISTINCT user_id)::integer
  FROM project_views
  WHERE project_id = p_project_id;
$$ LANGUAGE sql STABLE;
```

### Frontend Implementation

#### 1. Create tracking hook

```typescript
// src/hooks/useProjectViews.ts
export const useTrackProjectView = () => {
  const { user } = useAuth();

  const trackView = async (projectId: string) => {
    const { error } = await supabase.from("project_views").insert({
      project_id: projectId,
      user_id: user?.id,
      session_id: !user ? getSessionId() : null,
    });

    if (error && error.code !== "23505") {
      // Ignore unique constraint
      console.error("Failed to track view:", error);
    }
  };

  return { trackView };
};
```

#### 2. Update ProjectDetail page

```typescript
// src/features/accountability/pages/ProjectDetail.tsx
const { trackView } = useTrackProjectView();

useEffect(() => {
  if (projectId) {
    trackView(projectId);
  }
}, [projectId]);
```

#### 3 Update useProjects hook

```typescript
// src/hooks/useProjects.ts
// Replace hardcoded 0 with actual count
const { data: viewCount } = await supabase.rpc("get_project_view_count", {
  p_project_id: project.id,
});

projectData.views_count = viewCount || 0;
```

## Success Criteria

- ✅ Database schema created
- ✅ Views tracked on project detail page
- ✅ View counts display correctly
- ✅ Deduplication works (1 view per user per day)
- ✅ Anonymous users tracked via session ID

## Effort Estimate

**1-2 days** (8-16 hours)

```

---

**[CONTINUE IN NEXT FILE DUE TO LENGTH...]**

Save this as `.github/ISSUE_TEMPLATES/issues-batch-1.md` and I'll create the remaining issues in the next files.
```

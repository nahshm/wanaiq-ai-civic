# GitHub Issues - Batch 2 (Remaining Issues)

## 🟡 HIGH PRIORITY (P1) - Continued

### Issue #6: Complete voting and post creation in communities

**Title**: [Feature] Implement real voting and post creation mutations in communities

**Labels**: `priority: p1-high`, `type: feature`, `area: frontend`, `effort: medium`

**Milestone**: Feature Completion

**Body**:

````markdown
## Problem

Community voting and post creation are marked as TODO in `src/hooks/useCommunityData.ts`:

```typescript
// Line 164
// TODO: Implement real voting with React Query mutation

// Line 168
// TODO: Implement real post creation with React Query mutation
```
````

## Implementation Plan

### 1. Voting Mutation (4 hours)

```typescript
// src/hooks/useCommunityVoting.ts
export const useCommunityVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, voteType }: VoteParams) => {
      const { data, error } = await supabase.from("post_votes").upsert(
        {
          post_id: postId,
          user_id: user.id,
          vote_type: voteType,
        },
        {
          onConflict: "post_id,user_id",
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["community-posts"]);
      queryClient.invalidateQueries(["post-votes"]);
    },
  });
};
```

### 2. Post Creation Mutation (4 hours)

```typescript
// src/hooks/useCommunityPost.ts
export const useCreateCommunityPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: CreatePostInput) => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          ...postData,
          community_id: communityId,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["community-posts"]);
      toast({ title: "Post created successfully!" });
    },
  });
};
```

### 3. Update useCommunityData.ts (2 hours)

- [ ] Remove TODO comments
- [ ] Import and use new mutation hooks
- [ ] Add optimistic updates for better UX
- [ ] Handle error states properly

## Success Criteria

- ✅ Voting works in community feeds
- ✅ Post creation functional
- ✅ React Query cache invalidated correctly
- ✅ Optimistic UI updates implemented
- ✅ Error handling with user feedback

## Effort Estimate

**1.5 days** (10-12 hours)

````

---

### Issue #7: Optimize bundle size below 500KB

**Title**: [Performance] Optimize bundle size to reduce initial load time

**Labels**: `priority: p1-high`, `type: performance`, `area: build`, `effort: medium`

**Milestone**: Code Quality Sprint

**Body**:
```markdown
## Problem
Build shows chunk size warning:
````

⚠ Some chunks are larger than 500 KiB after minification.
Consider using dynamic import() to code-split the application

````

## Analysis Needed

### Step 1: Analyze Bundle (1 hour)
```bash
npm install -D vite-bundle-visualizer
````

```typescript
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    // ... existing plugins
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

Then run:

```bash
npm run build
# Opens bundle visualization
```

### Step 2: Identify Large Dependencies

Common culprits:

- [ ] Lucide React icons (tree-shake unused)
- [ ] TipTap editor + extensions
- [ ] Recharts graphing library
- [ ] React Query DevTools
- [ ] Date-fns (use date-fns/esm)

### Step 3: Implement Code Splitting (8 hours)

#### Already Done ✅

- Routes are lazy-loaded via `React.lazy()`

#### TODO

- [ ] Split TipTap editor:

```typescript
const RichTextEditor = lazy(() => import("@/components/posts/RichTextEditor"));
```

- [ ] Split Recharts:

```typescript
const AnalyticsCharts = lazy(() => import("@/pages/Dashboard/Analytics"));
```

- [ ] Configure manual chunks:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-ui': ['@radix-ui/react-*'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
        'vendor-charts': ['recharts'],
      }
    }
  }
}
```

### Step 4: Tree Shaking (4 hours)

- [ ] Ensure imports use named exports:

```typescript
// ❌ Bad
import * as Icons from "lucide-react";

// ✅ Good
import { Home, User, Settings } from "lucide-react";
```

- [ ] Remove unused dependencies:

```bash
npm install -D depcheck
npx depcheck
```

## Success Criteria

- ✅ Main bundle < 500KB
- ✅ Vendor chunks properly split
- ✅ No duplicate code across chunks
- ✅ Lighthouse performance score > 90

## Effort Estimate

**2 days** (14-16 hours)

````

---

## 🟢 MEDIUM PRIORITY (P2)

### Issue #8: Add filter modal for Civic Clips

**Title**: [Feature] Implement filter modal for Civic Clips page

**Labels**: `priority: p2-medium`, `type: feature`, `area: frontend`, `effort: small`

**Milestone**: Feature Completion

**Body**:
```markdown
## Problem
Filter button on Civic Clips page has empty handler:

```typescript
// src/features/feed/pages/CivicClips.tsx:78
onFilterClick={() => {/* TODO: open filter modal */ }}
````

## Implementation Plan

### 1. Create Filter Modal Component (3 hours)

```typescript
// src/features/feed/components/CivicClipsFilters.tsx
export const CivicClipsFiltersModal = ({ open, onOpenChange, onApply }) => {
  const [filters, setFilters] = useState({
    category: 'all',
    duration: 'any',
    sortBy: 'recent',
    location: null
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Civic Clips</DialogTitle>
        </DialogHeader>

        {/* Category filter */}
        <Select value={filters.category} onValueChange={...}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
          </SelectContent>
        </Select>

        {/* Duration filter */}
        {/* Location filter */}
        {/* Sort filter */}

        <Button onClick={() => onApply(filters)}>
          Apply Filters
        </Button>
      </DialogContent>
    </Dialog>
  );
};
```

### 2. Update CivicClips Page (1 hour)

```typescript
const [filtersOpen, setFiltersOpen] = useState(false);
const [activeFilters, setActiveFilters] = useState({});

<CivicClipsFiltersModal
  open={filtersOpen}
  onOpenChange={setFiltersOpen}
  onApply={setActiveFilters}
/>
```

### 3. Apply Filters to Query (2 hours)

Update the clips query to use active filters

## Success Criteria

- ✅ Filter modal opens on button click
- ✅ Filters persist during session
- ✅ Clips refresh when filters applied
- ✅ Clear filters button works

## Effort Estimate

**1 day** (6-8 hours)

````

---

### Issue #9: Complete position claim redirect flow

**Title**: [Feature] Add redirect to position view page after claim

**Labels**: `priority: p2-medium`, `type: feature`, `area: frontend`, `effort: small`

**Milestone**: Feature Completion

**Body**:
```markdown
## Problem
After claiming a position, there's no redirect:

```typescript
// src/features/governance/components/ClaimPositionModal.tsx:186
// TODO: Redirect to position view page
````

## Implementation Plan

### 1. Create Position View Route (if missing)

Check if `/position/:positionId` or `/office/:positionId` route exists

### 2. Add Redirect Logic (1 hour)

```typescript
// After successful claim
const handleClaimSuccess = async (positionId: string) => {
  toast({
    title: "Position claimed successfully!",
    description: "Redirecting to your position page...",
  });

  // Wait for toast to be visible
  await new Promise((resolve) => setTimeout(resolve, 1500));

  navigate(`/position/${positionId}`);
};
```

### 3. Update Modal Close Behavior (30 min)

- [ ] Close modal on success
- [ ] Invalidate relevant queries
- [ ] Show loading state during redirect

## Success Criteria

- ✅ Redirects to position page after claim
- ✅ Position page displays correctly
- ✅ User sees success message
- ✅ Modal closes automatically

## Effort Estimate

**2-4 hours**

````

---

### Issue #10: Add E2E tests for critical flows

**Title**: [Testing] Implement E2E tests for critical user journeys

**Labels**: `priority: p2-medium`, `type: testing`, `area: frontend`, `effort: large`

**Milestone**: Production Monitoring

**Body**:
```markdown
## Problem
Zero end-to-end tests for critical user flows. Need confidence that core journeys work.

## Test Scenarios

### 1. Authentication Flow
- [ ] Sign up with email/password
- [ ] Email verification (mock)
- [ ] Sign in
- [ ] Sign out
- [ ] Password reset

### 2. Onboarding Flow
- [ ] Location selection (County → Constituency → Ward)
- [ ] Interest selection
- [ ] Community joining
- [ ] Profile completion
- [ ] Redirect to home feed

### 3. Post Creation & Voting
- [ ] Navigate to create post
- [ ] Fill in post form (text + image)
- [ ] Submit post
- [ ] Verify post appears in feed
- [ ] Upvote/downvote post
- [ ] Verify vote count updates

### 4. Community Interaction
- [ ] Browse communities
- [ ] Join community
- [ ] View community feed
- [ ] Create post in community
- [ ] Comment on post

### 5. Official Tracking
- [ ] Search for official
- [ ] View official profile
- [ ] Track promise
- [ ] Monitor project

## Tool Setup

### Option A: Playwright (Recommended)
```bash
npm install -D @playwright/test
npx playwright install
````

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can sign up and complete onboarding", async ({ page }) => {
  await page.goto("http://localhost:5173/auth");

  // Sign up
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "TestPass123!");
  await page.click('button:has-text("Sign Up")');

  // Onboarding
  await expect(page).toHaveURL(/.*onboarding/);
  // ... rest of flow
});
```

### Option B: Cypress

```bash
npm install -D cypress
npx cypress open
```

## Success Criteria

- ✅ 5+ critical flows covered
- ✅ Tests run in CI/CD
- ✅ Tests pass on main branch
- ✅ Screenshot/video on failure

## Effort Estimate

**3-5 days** (24-40 hours)

````

---

### Issue #11: Code cleanup and organization

**Title**: [Tech Debt] Clean up duplicate files and organize code structure

**Labels**: `priority: p2-medium`, `type: tech-debt`, `area: frontend`, `area: backend`, `effort: medium`

**Milestone**: Code Quality Sprint

**Body**:
```markdown
## Issues Found

### 1. Duplicate Files
- [ ] `ClaimPositionModal.tsx` exists in 2 locations:
  - `src/features/governance/components/`
  - `src/components/governance/`
  → Verify which is used, delete the other

- [ ] Governance types duplicated:
  - `src/types/governance.ts`
  - `src/features/governance/types/governance.ts`
  → Consolidate into single source

### 2. Python Files in src/
These should not be in the React project:
- [ ] `src/video_processor.py`
- [ ] `src/video_analyzer.py`
- [ ] `src/main.py`
- [ ] `src/security/*.py`

**Action**: Move to separate `/backend` directory or delete if unused

### 3. Deprecated/Unused Code
- [ ] `src/hooks/useAuth.ts` - Marked as deprecated
- [ ] `src/components/debug/ProfileDataDebug.tsx` - Debug component
- [ ] Commented-out debug code in `Profile.tsx:793`

### 4. File Organization
Too many files in `/lib`:
- [ ] Create `/lib/performance/` for vitals, api-tracking
- [ ] Create `/lib/media/` for video utils, compression
- [ ] Create `/lib/errors/` for error tracking, auth errors

## Success Criteria
- ✅ No duplicate files
- ✅ Python files removed from src/
- ✅ Deprecated code deleted
- ✅ Logical folder structure

## Effort Estimate
**1-2 days** (8-16 hours)
````

---

## 🔵 LOW PRIORITY (P3)

### Issue #12: Create coding guidelines documentation

**Title**: [Docs] Create comprehensive coding guidelines for contributors

**Labels**: `priority: p3-low`, `type: docs`, `area: frontend`, `effort: small`

**Milestone**: (No milestone - ongoing)

**Body**:

```markdown
## Goal

Standardize code style and practices across the project.

## Guidelines to Document

### 1. Code Style

- TypeScript strict mode
- Naming conventions (camelCase vs PascalCase)
- File naming (kebab-case for components)
- Import ordering

### 2. Component Structure

- Functional components only
- Hooks usage patterns
- Props interface naming
- Event handler naming (`handleClick` not `onClick`)

### 3. State Management

- When to use React Query vs useState
- Context usage guidelines
- Global state patterns

### 4. Error Handling

- Always use Sentry for errors (not console.error)
- User-friendly error messages
- Retry logic for transient failures

### 5. Testing

- Unit test requirements
- Mock patterns
- E2E test structure

## Deliverable

Create `CONTRIBUTING.md` with:

- Code style guide
- Git workflow
- PR requirements
- Testing requirements

## Effort Estimate

**4-6 hours**
```

---

### Issue #13: Security audit and RLS policy review

**Title**: [Security] Comprehensive security audit and RLS policy verification

**Labels**: `priority: p3-low`, `type: security`, `area: backend`, `effort: medium`

**Milestone**: Production Monitoring

**Body**:

````markdown
## Security Checklist

### 1. Row Level Security (RLS)

- [ ] Verify ALL tables have RLS enabled
- [ ] Test policies with different user roles
- [ ] Ensure no data leakage between users
- [ ] Document policy logic

### 2. Input Validation

- [ ] Audit all forms have Zod schemas
- [ ] Check API endpoints validate input
- [ ] XSS prevention (verify TipTap sanitization)
- [ ] SQL injection prevention (Supabase handles)

### 3. Rate Limiting

- [ ] Implement on post creation
- [ ] Implement on voting
- [ ] Implement on image upload
- [ ] Implement on comment posting

### 4. API Security

- [ ] Verify no secrets in client bundle
- [ ] Check CORS configuration
- [ ] Review Supabase anon key usage
- [ ] Audit environment variables

### 5. Content Security

- [ ] DOMPurify configured correctly
- [ ] Image uploads size-limited
- [ ] File type restrictions enforced
- [ ] Content moderation hooks

## Tools

```bash
# Check for secrets
npm install -D @trufflesecurity/trufflehog
trufflehog filesystem ./src

# Audit dependencies
npm audit
npm audit fix
```
````

## Success Criteria

- ✅ All tables have RLS
- ✅ Rate limiting on sensitive endpoints
- ✅ No secrets in code
- ✅ Input validation comprehensive

## Effort Estimate

**2-3 days** (16-24 hours)

````

---

### Issue #14: Performance optimizations - caching & queries

**Title**: [Performance] Implement advanced caching and query optimization

**Labels**: `priority: p3-low`, `type: performance`, `area: frontend`, `area: backend`, `effort: large`

**Milestone**: (Future milestone)

**Body**:
```markdown
## Optimization Opportunities

### 1. React Query Caching
```typescript
// Configure better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
````

### 2. Database Indexes

Review and add missing indexes:

- [ ] `posts.community_id`
- [ ] `comments.post_id`
- [ ] `post_votes (post_id, user_id)`
- [ ] `profiles.username`

### 3. Image Optimization

- [ ] Enable Supabase Storage transformations
- [ ] Serve WebP format
- [ ] Implement responsive images
- [ ] Lazy load offscreen images

### 4. Code-Level

- [ ] Memoize expensive computations
- [ ] Use `useCallback` for event handlers
- [ ] Implement virtual scrolling for long lists
- [ ] Debounce search inputs

## Success Criteria

- ✅ Lighthouse score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3.5s
- ✅ Database query times < 100ms

## Effort Estimate

**3-5 days** (24-40 hours)

````

---

### Issue #15: Fetch promises and questions for officials

**Title**: [Feature] Add promises and questions tables for official tracking

**Labels**: `priority: p2-medium`, `type: feature`, `area: backend`, `area: frontend`, `effort: medium`

**Milestone**: Feature Completion

**Body**:
```markdown
## Problem
Official page has TODOs for promises and questions:

```typescript
// src/features/governance/pages/OfficePage.tsx:143-144
// TODO: Fetch promises when table exists
// TODO: Fetch questions when table exists
````

## Implementation Plan

### 1. Database Schema (2 hours)

```sql
-- Promises table
CREATE TABLE official_promises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  official_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'broken')),
  deadline date,
  created_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE official_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  official_id uuid REFERENCES profiles(id),
  asked_by uuid REFERENCES profiles(id),
  question text NOT NULL,
  answer text,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE official_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_questions ENABLE ROW LEVEL SECURITY;
```

### 2. Frontend Hooks (4 hours)

```typescript
// src/hooks/useOfficialPromises.ts
export const useOfficialPromises = (officialId: string) => {
  return useQuery({
    queryKey: ["official-promises", officialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_promises")
        .select("*")
        .eq("official_id", officialId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
```

### 3. UI Components (6 hours)

- [ ] Promises list component
- [ ] Promise status badges
- [ ] Questions list component
- [ ] Ask question form
- [ ] Answer question interface (for verified officials)

## Success Criteria

- ✅ Tables created with proper RLS
- ✅ Promises display on official page
- ✅ Questions显示 on official page
- ✅ Users can ask questions
- ✅ Officials can answer questions

## Effort Estimate

**2 days** (12-16 hours)

````

---

## 📝 Quick Reference: Issue Creation Checklist

For each issue above:

1. **Go to**: https://github.com/nahshm/wana-connect-civic/issues/new
2. **Copy-paste** the title and body from above
3. **Add labels** as specified
4. **Assign to milestone** as specified
5. **Optional**: Assign to yourself if working on it

## Auto-Import Script (Advanced)

If you want to bulk-create issues via GitHub CLI:

```bash
# Install GitHub CLI
# https://cli.github.com/

# Login
gh auth login

# Create issues from this file
gh issue create \
  --title "[Code Quality] Fix 386 ESLint errors and warnings" \
  --body-file .github/ISSUE_TEMPLATES/issue-1-body.md \
  --label "priority: p0-critical,type: code-quality" \
  --milestone "Code Quality Sprint"
````

Save this as `.github/ISSUE_TEMPLATES/issues-batch-2.md`

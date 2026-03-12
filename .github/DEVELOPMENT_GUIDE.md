# WanaIQ Development Guide v2.0

**AI-Powered Civic Engagement Platform for Kenya**

**Version:** 2.0  
**Last Updated:** February 6, 2026  
**Platform:** WanaConnect Civic (WanaIQ)  
**Repository:** https://github.com/nahshm/wana-connect-civic

---

## 1. PLATFORM IDENTITY & CORE MISSION

You are developing **WanaIQ**, Kenya's first comprehensive AI-powered civic engagement platform. Your purpose is to:

- Build a civic tech platform that combines viral engagement mechanics with democratic accountability
- Ensure all code, designs, and features serve Kenya's civic engagement needs
- Maintain technical excellence while adhering to our proven architecture
- Support rapid development through intelligent patterns and best practices

**Core Values:**

- **Nonpartisan**: All civic content must be factual, balanced, and politically neutral
- **Inclusive**: Multi-language support (English, Swahili, 41+ local languages) is mandatory
- **Accessible**: Mobile-first, bandwidth-optimized for Kenya's infrastructure
- **Transparent**: Open development process with clear documentation

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Current Technology Stack (MANDATORY)

**ALWAYS use these technologies:**

**Frontend Web:**

- React 18 + TypeScript
- Vite 5.x (fast builds, HMR)
- React Router v6 (client-side routing)
- TanStack Query (server state)
- Tailwind CSS (styling)
- shadcn/ui (component library)

**Backend:**

- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- PostgREST (automatic REST API)
- Row Level Security (RLS)

**State Management:**

- TanStack Query for server state
- React Context for global client state
- React Hook Form for form state

**UI Components:**

- shadcn/ui (48+ components)
- Radix UI primitives
- Lucide React icons
- TipTap rich text editor

**Developer Tools:**

- TypeScript (strict mode)
- ESLint (code quality)
- Jest (unit testing)
- Playwright (E2E testing)
- Zod (validation)

**Future Additions (Phase 2+):**

- AI/ML: Groq API with Llama 3
- Vector DB: pgvector extension
- Mobile: React Native + Expo (optional)
- Caching: Redis Cloud
- Monitoring: Sentry

### 2.2 What NOT to Use

**NEVER suggest:**

- ❌ Next.js (we use Vite for better control)
- ❌ GraphQL (we use REST via Supabase)
- ❌ Express backend (we use Supabase serverless)
- ❌ Firebase (we use Supabase)
- ❌ MySQL (PostgreSQL only)
- ❌ Redux/MobX (use TanStack Query + Context)

### 2.3 Design System Standards

**UI/UX Philosophy: Minimalist, Clean, Professional**

Inspired by: Reddit (discussions), Notion (content), Discord (community)

**Required Design Patterns:**

- Card-based layouts for all content containers
- Maximum 3 primary colors + neutral grays
- Generous white space (minimum 24px between major sections)
- Typography: System fonts for performance
- Icons: Lucide React (outlined style, 24px standard)
- Shadows: Subtle only (`shadow-sm`, `shadow-md`)
- No gradients except for CTAs
- Transitions: 200-300ms ease-in-out
- Dark mode support (via next-themes)

**Component Structure (MANDATORY):**

```typescript
/**
 * @fileoverview Brief description of component purpose
 * @component
 */

import { useState } from 'react';
import type { ComponentProps } from '@/types';

/**
 * ComponentName - Brief description
 * @param {ComponentProps} props - Component props
 * @returns {JSX.Element}
 */
export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2
}) => {
  // 1. Hooks at top (useState, useEffect, custom hooks)
  const [state, setState] = useState<string>('');

  // 2. Derived values
  const isValid = state.length > 0;

  // 3. Event handlers grouped
  const handleSubmit = () => {
    // Handler logic
  };

  // 4. Early returns for loading/error states
  if (!prop1) {
    return <div>Loading...</div>;
  }

  // 5. Main render return
  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
};
```

**Accessibility Requirements (NON-NEGOTIABLE):**

- All interactive elements must have ARIA labels
- Color contrast ratio minimum 4.5:1
- Keyboard navigation support
- Screen reader compatible
- Touch targets minimum 44x44px
- Focus visible indicators

---

## 3. CODE QUALITY STANDARDS

### 3.1 TypeScript Rules (STRICT)

**NO `any` types allowed:**

```typescript
// ✅ CORRECT: Proper typing
interface CivicReport {
  id: string;
  category: 'water' | 'roads' | 'security' | 'health';
  description: string;
  location: GeoPoint;
  status: ReportStatus;
  created_at: Date;
}

async function submitReport(report: CivicReport): Promise<Report> {
  // Implementation
}

// ❌ INCORRECT: Using 'any'
const report: any = { ... };  // NEVER ALLOWED
async function submitReport(report: any) { ... }  // FORBIDDEN
```

**Type Safety Checklist:**

- [ ] No `any` types (use `unknown` if truly needed)
- [ ] All function parameters typed
- [ ] All function returns typed
- [ ] All component props typed
- [ ] All API responses typed
- [ ] All database queries typed

### 3.2 Error Handling (MANDATORY)

**Never allow silent failures:**

```typescript
// ✅ CORRECT: Comprehensive error handling
try {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Database query failed:", error);
    throw new AppError("Failed to fetch post", 500, error);
  }

  return data;
} catch (error) {
  // Log to monitoring service (when Sentry integrated)
  logger.error("Post fetch failed", { postId, error });

  // Optionally report to Sentry
  // Sentry.captureException(error);

  // User-friendly error
  throw new AppError("Unable to load post. Please try again.", 500);
}

// ❌ INCORRECT: No error handling
const { data } = await supabase.from("posts").select("*"); // DANGEROUS
return data;
```

**Error Handling Patterns:**

```typescript
// Custom AppError class
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Use in React Query
const { data, error, isLoading } = useQuery({
  queryKey: ['post', postId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw new AppError('Failed to fetch post', 500, error);
    return data;
  },
  retry: (failureCount, error) => {
    // Don't retry on 404s
    if (error instanceof AppError && error.statusCode === 404) {
      return false;
    }
    return failureCount < 3;
  }
});

// In component
if (error) {
  return <ErrorState message="Failed to load post" />;
}
```

### 3.3 Documentation Standards

**Every file must have header:**

```typescript
/**
 * @fileoverview Civic post creation and management
 * @module features/feed
 * @requires @supabase/supabase-js
 * @requires @tanstack/react-query
 *
 * This module handles all post creation, editing, and voting logic
 * for the civic engagement feed. Integrates with Supabase for
 * data persistence and real-time updates.
 *
 * Key Features:
 * - Rich text post creation with TipTap
 * - Image/video upload to Supabase Storage
 * - Real-time voting with optimistic updates
 * - Comment threading
 *
 * @author WanaIQ Development Team
 * @since v1.0
 * @see https://docs.wanaiq.com/features/feed
 */
```

**Every public function must have JSDoc:**

````typescript
/**
 * Creates a new civic post
 * @param {CreatePostInput} input - Post creation data
 * @param {string} input.title - Post title (max 300 chars)
 * @param {string} input.content - Post content (markdown)
 * @param {string} input.communityId - Target community ID
 * @param {string[]} [input.mediaUrls] - Optional media attachments
 * @returns {Promise<Post>} Created post with generated ID
 * @throws {AppError} If user is not authenticated
 * @throws {AppError} If community doesn't exist
 * @throws {AppError} If validation fails
 *
 * @example
 * ```ts
 * const post = await createPost({
 *   title: 'Water shortage in Nairobi',
 *   content: 'We've had no water for 3 days...',
 *   communityId: 'nairobi-county'
 * });
 * ```
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  // Implementation
}
````

### 3.4 Testing Requirements

**Minimum 80% code coverage target (start with 60%):**

**Unit Tests (60% of tests):**

```typescript
import { render, screen } from '@testing-library/react';
import { PostCard } from './PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: '123',
    title: 'Test Post',
    content: 'Test content',
    author: {
      id: 'user-1',
      display_name: 'Test User'
    },
    created_at: new Date().toISOString(),
    upvotes: 10,
    downvotes: 2
  };

  it('should render post title and content', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should display author name', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it('should show vote counts', () => {
    render(<PostCard post={mockCard} />);

    expect(screen.getByText('10')).toBeInTheDocument(); // upvotes
  });

  it('should handle missing author gracefully', () => {
    const postWithoutAuthor = { ...mockPost, author: null };

    expect(() => {
      render(<PostCard post={postWithoutAuthor} />);
    }).not.toThrow();
  });
});
```

**Integration Tests (30% of tests):**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePost';

describe('usePost integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
  });

  it('should fetch post from Supabase', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => usePost('test-post-id'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveProperty('id');
    expect(result.current.data).toHaveProperty('title');
  });
});
```

**E2E Tests (10% of tests):**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Post Creation Flow", () => {
  test("user can create a new post", async ({ page }) => {
    // Login
    await page.goto("/auth");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to create post
    await page.goto("/submit");

    // Fill form
    await page.fill('[name="title"]', "Test Civic Issue");
    await page.fill(
      '[name="content"]',
      "This is a test post about water shortage",
    );

    // Select community
    await page.click('[data-testid="community-select"]');
    await page.click("text=Nairobi County");

    // Submit
    await page.click('button:has-text("Post")');

    // Verify redirect to post
    await expect(page).toHaveURL(/\/post\/.+/);
    await expect(page.locator("h1")).toContainText("Test Civic Issue");
  });
});
```

### 3.5 Performance Standards

**Performance Budgets (ENFORCED):**

- Lighthouse Performance Score: >90
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.5s
- Total Blocking Time (TBT): <200ms
- Cumulative Layout Shift (CLS): <0.1

**If metrics exceed budget, STOP and optimize.**

**Optimization Checklist:**

- [ ] Code splitting for routes (React.lazy)
- [ ] Image optimization (responsive, WebP format)
- [ ] Font optimization (system fonts preferred)
- [ ] Debounce search inputs (300ms)
- [ ] Virtual scrolling for long lists (>50 items)
- [ ] Lazy load images below fold
- [ ] Bundle size <500KB initial

**Route Code Splitting (MANDATORY):**

```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// ✅ CORRECT: Lazy load routes
const Home = lazy(() => import('@/pages/Home'));
const PostDetail = lazy(() => import('@/pages/PostDetail'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/c/:name" element={<CommunityPage />} />
      </Routes>
    </Suspense>
  );
}

// ❌ INCORRECT: Import all routes eagerly
import Home from '@/pages/Home';  // Increases initial bundle
```

---

## 4. SUPABASE PATTERNS

### 4.1 Database Query Patterns

**Always use typed queries:**

```typescript
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];

// ✅ CORRECT: Typed Supabase query
async function getPosts(communityId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!posts_user_id_fkey(
        id,
        display_name,
        avatar_url
      ),
      community:communities(
        id,
        name,
        display_name
      )
    `,
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new AppError("Failed to fetch posts", 500, error);
  }

  return data;
}
```

**Use RLS policies (already implemented):**

```sql
-- Example RLS policy (for reference)
CREATE POLICY "Users can view public posts"
  ON posts
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert own posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4.2 Real-time Subscriptions

**Use sparingly (expensive):**

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ✅ CORRECT: Subscribe to specific channel
function usePostUpdates(postId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`
        },
        (payload) => {
          queryClient.invalidateQueries(['post', postId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
}

// ❌ INCORRECT: Subscribe to entire table
supabase.channel('posts').on('postgres_changes', ...).subscribe();  // TOO BROAD
```

### 4.3 File Upload Patterns

**Use Supabase Storage:**

```typescript
async function uploadImage(
  file: File,
  bucket: "avatars" | "media" | "documents",
): Promise<string> {
  // 1. Validate file
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new AppError("Invalid file type. Use JPEG, PNG, or WebP", 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    throw new AppError("File too large. Maximum 5MB allowed", 400);
  }

  // 2. Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${bucket}/${fileName}`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new AppError("Failed to upload file", 500, error);
  }

  // 4. Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}
```

---

## 5. STATE MANAGEMENT PATTERNS

### 5.1 TanStack Query (Server State)

**Use for all server data:**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ✅ CORRECT: Query pattern
export function usePost(postId: string) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw new AppError("Failed to fetch post", 500, error);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ✅ CORRECT: Mutation with optimistic updates
export function useVotePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      voteType,
    }: {
      postId: string;
      voteType: "upvote" | "downvote";
    }) => {
      const { data, error } = await supabase.rpc("vote_post", {
        post_id: postId,
        vote_type: voteType,
      });

      if (error) throw new AppError("Failed to vote", 500, error);
      return data;
    },
    // Optimistic update
    onMutate: async ({ postId, voteType }) => {
      await queryClient.cancelQueries(["post", postId]);

      const previousPost = queryClient.getQueryData(["post", postId]);

      queryClient.setQueryData(["post", postId], (old: Post) => ({
        ...old,
        upvotes: voteType === "upvote" ? old.upvotes + 1 : old.upvotes,
        downvotes: voteType === "downvote" ? old.downvotes + 1 : old.downvotes,
      }));

      return { previousPost };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["post", variables.postId],
        context?.previousPost,
      );
    },
    // Refetch on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(["post", variables.postId]);
    },
  });
}
```

### 5.2 React Context (Client State)

**Use for global UI state only:**

```typescript
import { createContext, useContext, useState } from 'react';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Implementation...

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 6. MULTILINGUAL SUPPORT (PHASE 1.5)

### 6.1 i18n Implementation (UPCOMING)

**Will use react-i18next:**

```typescript
// Future implementation pattern
import { useTranslation } from 'react-i18next';

export function WelcomeMessage() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.subtitle')}</p>

      <button onClick={() => i18n.changeLanguage('sw')}>
        Swahili
      </button>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
    </div>
  );
}
```

**Translation file structure:**

```json
// public/locales/en/common.json
{
  "welcome": {
    "title": "Welcome to WanaIQ",
    "subtitle": "Your civic engagement platform"
  },
  "post": {
    "create": "Create Post",
    "title_placeholder": "What's happening in your community?",
    "submit": "Post"
  }
}

// public/locales/sw/common.json
{
  "welcome": {
    "title": "Karibu WanaIQ",
    "subtitle": "Jukwaa lako la ushiriki wa kiraia"
  },
  "post": {
    "create": "Unda Chapisho",
    "title_placeholder": "Nini kinaendelea katika jamii yako?",
    "submit": "Chapisha"
  }
}
```

**CURRENT REQUIREMENT:**
Until i18n is implemented, all user-facing strings must be extracted to constants for easy translation later:

```typescript
// ✅ CORRECT: Extractable strings
const STRINGS = {
  WELCOME_TITLE: 'Welcome to WanaIQ',
  WELCOME_SUBTITLE: 'Your civic engagement platform',
  POST_CREATE: 'Create Post'
};

export function WelcomeMessage() {
  return (
    <div>
      <h1>{STRINGS.WELCOME_TITLE}</h1>
      <p>{STRINGS.WELCOME_SUBTITLE}</p>
    </div>
  );
}

// ❌ INCORRECT: Hardcoded strings
export function WelcomeMessage() {
  return <h1>Welcome to WanaIQ</h1>;  // HARD TO TRANSLATE LATER
}
```

---

## 7. AI/ML INTEGRATION (PHASE 2)

### 7.1 Future AI Architecture

**When AI features are added (post-launch):**

```typescript
// Example: Groq API integration pattern
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

/**
 * AI-powered civic query assistant
 * Uses Groq Llama 3 for natural language understanding
 */
export async function civicQueryAssistant(
  userQuery: string,
  language: "en" | "sw" = "en",
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are a helpful civic engagement assistant for Kenya. 
          Provide factual, nonpartisan information about government processes.
          Respond in ${language === "sw" ? "Swahili" : "English"}.`,
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
      temperature: 0.3, // Low for factual accuracy
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new AppError("AI query failed", 500, error);
  }
}
```

### 7.2 RAG Pattern (Future)

**Retrieval Augmented Generation for civic knowledge:**

```typescript
// Future implementation with pgvector
async function civicRAG(userQuestion: string) {
  // 1. Generate embedding (future)
  const embedding = await generateEmbedding(userQuestion);

  // 2. Vector search in Supabase (requires pgvector extension)
  const { data: relevantDocs } = await supabase.rpc("match_civic_documents", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
  });

  // 3. Inject context into LLM prompt
  const context = relevantDocs.map((d) => d.content).join("\n\n");

  const prompt = `Based on these verified sources from Kenyan law:
  
${context}

Question: ${userQuestion}

Please provide a factual answer citing the sources above.`;

  // 4. Get LLM response with citations
  const response = await groq.chat.completions.create({
    model: "llama-3-8b-8192",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  return {
    answer: response.choices[0].message.content,
    sources: relevantDocs.map((d) => ({
      title: d.title,
      url: d.url,
    })),
  };
}
```

---

## 8. SECURITY & PRIVACY

### 8.1 Security Checklist (Every Feature)

- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (use Supabase parameterized queries)
- [ ] XSS prevention (use DOMPurify for user HTML)
- [ ] CSRF protection (Supabase handles this)
- [ ] Rate limiting (implement in Edge Functions)
- [ ] Authentication required for write operations
- [ ] Authorization checks (RLS policies)
- [ ] Secrets in `.env` files (never in code)
- [ ] HTTPS enforced (Supabase default)
- [ ] Content Security Policy headers

### 8.2 Input Validation

**Always use Zod:**

```typescript
import { z } from "zod";

// ✅ CORRECT: Zod validation
const CreatePostSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(300, "Title too long"),
  content: z
    .string()
    .min(10, "Content too short")
    .max(40000, "Content too long"),
  communityId: z.string().uuid("Invalid community ID"),
  mediaUrls: z.array(z.string().url()).optional(),
});

type CreatePostInput = z.infer<typeof CreatePostSchema>;

async function createPost(input: unknown): Promise<Post> {
  // Validate input
  const validated = CreatePostSchema.parse(input);

  // Use validated data
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: validated.title,
      content: validated.content,
      community_id: validated.communityId,
      user_id: session.user.id,
    })
    .select()
    .single();

  if (error) throw new AppError("Failed to create post", 500, error);
  return data;
}

// ❌ INCORRECT: No validation
async function createPost(input: any) {
  // UNSAFE
  const { data } = await supabase.from("posts").insert(input);
  return data;
}
```

### 8.3 Data Privacy

**Minimal data collection:**

- Only collect data necessary for features
- Anonymous analytics (when implemented)
- User consent for personalization
- Data deletion within 30 days of request
- No third-party data sharing

**Anonymize sensitive data:**

```typescript
// ✅ CORRECT: Anonymize report locations
const report = {
  category: "water",
  location: anonymizeLocation(gps, 100), // Blur to 100m radius
  description: sanitizeInput(userInput),
  user_id: session.user.id, // Stored securely in auth system
};

// ❌ INCORRECT: Storing PII in public tables
const report = {
  name: "John Doe", // NEVER store real names
  phone: "+254...", // NEVER store contact info
  exact_location: gps, // TOO PRECISE
};
```

---

## 9. GIT WORKFLOW

### 9.1 Branch Naming

**Convention:**

```
feature/[feature-name]
bugfix/[issue-description]
hotfix/[critical-issue]
chore/[maintenance-task]

Examples:
feature/civic-agent-router
feature/multilingual-support
bugfix/post-card-overflow
hotfix/authentication-tokens
chore/upgrade-dependencies
```

### 9.2 Commit Messages

**Format:**

```
[TYPE]([SCOPE]): Brief description

Detailed explanation of changes
- What changed
- Why it changed
- How to test

Relates to: #issue-number
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```
feat(feed): Add infinite scroll to home feed

- Implemented intersection observer for pagination
- Added loading skeleton for better UX
- Optimized query to fetch 25 posts at a time

Relates to: #42

---

fix(auth): Resolve session expiry redirect loop

- Session expiry now properly redirects to /auth
- Prevented infinite redirect when on /auth page
- Added session refresh logic

Relates to: #38

---

docs(readme): Update deployment instructions

- Added Supabase setup steps
- Documented environment variables
- Added troubleshooting section
```

### 9.3 Pull Request Template

**Every PR must include:**

```markdown
## Description

[Brief description of changes]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] TypeScript types defined (no `any`)
- [ ] Error handling implemented
- [ ] Loading states in UI
- [ ] Mobile responsive
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Unit tests pass (80%+ coverage)
- [ ] Documentation updated
- [ ] No hardcoded credentials
- [ ] Lighthouse score >90

## Screenshots (if UI changes)

[Add screenshots here]

## Related Issues

Closes #[issue number]
```

---

## 10. DEVELOPMENT WORKFLOW

### 10.1 Daily Checklist

**Before starting work:**

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Check for TypeScript errors
npm run type-check

# 4. Check for linting errors
npm run lint

# 5. Run tests
npm test

# 6. Start dev server
npm run dev
```

**Before committing:**

```bash
# 1. Run linter with auto-fix
npm run lint:fix

# 2. Run type check
npm run type-check

# 3. Run all tests
npm test

# 4. Build for production (verify no errors)
npm run build

# 5. Stage changes
git add .

# 6. Commit with proper message
git commit -m "feat(scope): description"

# 7. Push to remote
git push origin feature-branch
```

### 10.2 Code Review Checklist

**Reviewer must verify:**

- [ ] Code follows TypeScript standards (no `any`)
- [ ] Error handling properly implemented
- [ ] Loading/error states in UI components
- [ ] Mobile responsive design
- [ ] Accessibility requirements met
- [ ] Unit tests added (80%+ coverage target)
- [ ] Integration tests for API calls
- [ ] No console.log statements (use logger)
- [ ] No hardcoded credentials or secrets
- [ ] Performance tested (Lighthouse >90)
- [ ] Documentation/comments added
- [ ] Commit messages follow convention

---

## 11. TECHNICAL DEBT TRACKING

### 11.1 Debt Classification

**Label all technical debt:**

```typescript
// TODO: [DEBT-PERF] Optimize this query with database indexing (Est: 2h)
// Current: 500ms query time, Target: <50ms
const results = await supabase.from('reports').select('*');

// TODO: [DEBT-SECURITY] Add rate limiting to this endpoint (Est: 4h)
// Risk: High - vulnerable to abuse
export async function submitReport() { ... }

// TODO: [DEBT-UX] Add loading skeleton (Est: 1h)
// Current: Blank screen during load
export function ReportsList() { ... }

// TODO: [DEBT-A11Y] Add ARIA labels (Est: 30min)
// Missing: Screen reader support
<button onClick={handleClick}>Submit</button>

// TODO: [DEBT-i18n] Add Swahili translation (Est: 1h)
// Missing: Translation for this component
export function WelcomeMessage() { ... }

// TODO: [DEBT-TEST] Add unit tests (Est: 2h)
// Coverage: 0% for this module
export function calculateKarma() { ... }
```

**Categories:**

- `DEBT-PERF`: Performance optimization
- `DEBT-SECURITY`: Security vulnerability
- `DEBT-UX`: User experience issue
- `DEBT-A11Y`: Accessibility gap
- `DEBT-i18n`: Translation missing
- `DEBT-TEST`: Test coverage gap
- `DEBT-REFACTOR`: Code quality issue

### 11.2 Debt Limits

**Maximum debt thresholds:**

- Critical (SECURITY, blocking bugs): **0 items**
- High (UX issues, missing tests): **<5 items**
- Medium (refactoring, enhancements): **<15 items**

**Paydown schedule:**

- Weekly: 20% of time to debt reduction
- Before milestones: All critical debt resolved
- Before launch: All high debt resolved

---

## 12. KENYAN CONTEXT INTEGRATION

### 12.1 Official Data Sources

**Reference these sources:**

- Kenya Law Reports: http://kenyalaw.org
- 47 County Government websites
- National Assembly Hansard
- NG-CDF Board: https://ngcdf.go.ke
- IEBC (electoral data): https://www.iebc.or.ke
- Constitution of Kenya 2010
- County Government Act
- NG-CDF Act 2015

### 12.2 Government Structure

**Three-tier system:**

```typescript
const KENYA_GOVERNMENT = {
  national: {
    branches: ["Executive", "Legislature", "Judiciary"],
    functions: [
      "Foreign affairs",
      "Defense",
      "National security",
      "Monetary policy",
      "Higher education",
    ],
  },
  county: {
    total: 47,
    functions: [
      "County health services",
      "Agriculture",
      "County transport",
      "Pre-primary education",
      "County planning",
      "Trade development",
      "County public works",
      "County roads",
      "Water and sanitation",
      "Refuse removal and solid waste disposal",
    ],
    structure: {
      governor: "Chief executive officer",
      assembly: "Legislative body",
      wards: 1450, // Total across all counties
    },
  },
  ward: {
    representative: "MCA (Member of County Assembly)",
    funds: ["Ward Development Fund"],
    participation: [
      "Town hall meetings",
      "Development committees",
      "Public participation forums",
    ],
  },
};

// Use for routing civic issues
function determineJurisdiction(issueCategory: string): string {
  const countyFunctions = [
    "water",
    "garbage",
    "county_roads",
    "markets",
    "county_health",
    "pre_primary_education",
  ];

  if (countyFunctions.includes(issueCategory)) {
    return "county";
  }

  return "national";
}
```

### 12.3 Cultural Sensitivity

**Language:**

- Swahili widely understood, English official
- Use respectful terms: "Mheshimiwa" (Honorable) for officials
- Avoid tribal references in civic content
- Use gender-neutral language

**Content Moderation:**

- Flag tribal incitement (critical security)
- Detect political hate speech
- Monitor election misinformation
- Identify civic process manipulation

---

## 13. PERFORMANCE OPTIMIZATION

### 13.1 Frontend Optimization

**Image Optimization:**

```typescript
// ✅ CORRECT: Optimized images
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height
}: OptimizedImageProps) {
  return (
    <picture>
      <source
        srcSet={`${src}?format=webp&width=${width || 800}`}
        type="image/webp"
      />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

// ❌ INCORRECT: Unoptimized images
<img src={largeImage} alt="description" />  // No lazy loading, wrong format
```

**Virtual Scrolling:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// ✅ CORRECT: Virtual scrolling for long lists
export function PostList({ posts }: { posts: Post[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,  // Estimated item height
    overscan: 5  // Render 5 extra items
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <PostCard post={posts[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Use for lists with >50 items only
```

**Debouncing:**

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

// ✅ CORRECT: Debounce search input
export function SearchBar() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      // Actual search logic
      performSearch(value);
    }, 300),  // 300ms delay
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleChange} />;
}

// ❌ INCORRECT: Search on every keystroke
export function SearchBar() {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    setQuery(e.target.value);
    performSearch(e.target.value);  // TOO FREQUENT
  };
}
```

### 13.2 Database Optimization

**Query Optimization:**

```sql
-- ✅ CORRECT: Indexed query
CREATE INDEX idx_posts_community_created
ON posts(community_id, created_at DESC);

SELECT * FROM posts
WHERE community_id = 'nairobi-county'
ORDER BY created_at DESC
LIMIT 25;

-- Use EXPLAIN ANALYZE to verify
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE community_id = 'nairobi-county'
ORDER BY created_at DESC
LIMIT 25;
```

**Connection Pooling:**

```typescript
// Supabase handles this automatically
// Max 3 connections per client (default)
// Connection pooling managed by Supabase
```

**Caching Strategy (Future with Redis):**

```typescript
// Future implementation pattern
async function getCachedPosts(communityId: string): Promise<Post[]> {
  // 1. Check cache
  const cached = await redis.get(`posts:${communityId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Fetch from database
  const posts = await fetchPostsFromDB(communityId);

  // 3. Cache for 5 minutes
  await redis.setex(
    `posts:${communityId}`,
    300, // 5 minutes TTL
    JSON.stringify(posts),
  );

  return posts;
}
```

---

## 14. MONITORING & OBSERVABILITY (PHASE 1.5)

### 14.1 Error Monitoring (Sentry - Coming Soon)

**Will integrate Sentry:**

```typescript
// Future Sentry setup
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,  // 10% of transactions

  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  }
});

// Use in error boundaries
import { ErrorBoundary } from '@sentry/react';

export function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <AppContent />
    </ErrorBoundary>
  );
}
```

### 14.2 Performance Monitoring

**Lighthouse CI (To be added):**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Audit URLs using Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://wanaiq.com
            https://wanaiq.com/c/nairobi
          budgetPath: ./budget.json
          uploadArtifacts: true
```

### 14.3 Analytics (Future)

**Privacy-focused analytics:**

```typescript
// Simple event tracking (no PII)
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  // Future: Send to analytics service
  // Must be privacy-compliant (no user tracking)
  console.log("Event:", event, properties);
}

// Usage
trackEvent("post_created", {
  community: communityId,
  has_media: mediaUrls.length > 0,
});
```

---

## 15. DEPLOYMENT

### 15.1 Environment Variables

**Required `.env` file:**

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (Future)
VITE_GROQ_API_KEY=your-groq-api-key
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

**Never commit:**

- `.env` files
- API keys
- Database passwords
- Service account credentials

### 15.2 Build Process

**Production build:**

```bash
# 1. Install dependencies
npm ci  # Clean install

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Test
npm test

# 5. Build
npm run build

# 6. Preview locally
npm run preview
```

### 15.3 Deployment Checklist

**Before every deployment:**

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] ESLint passing (or documented exceptions)
- [ ] No critical technical debt
- [ ] Performance benchmarks met (Lighthouse >90)
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] Environment variables verified
- [ ] Rollback plan documented
- [ ] Changelog updated

---

## 16. TESTING STRATEGY

### 16.1 Testing Pyramid

**Distribution:**

- Unit Tests: 60% (utilities, hooks, components)
- Integration Tests: 30% (API calls, auth flows)
- E2E Tests: 10% (critical user journeys)

**Target Coverage:**

- Phase 1: 60% total coverage
- Phase 2: 80% total coverage
- Critical paths: 100% coverage

### 16.2 Test Setup

**Jest configuration:**

```javascript
// jest.config.js
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
  ],
};
```

**Test utilities:**

```typescript
// src/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

## 17. PHASE ROADMAP

### Phase 1: Current Focus (Weeks 1-6)

**Goals:**

- Fix critical code quality issues
- Improve test coverage to 60%
- Implement error monitoring
- Basic i18n setup (English + Swahili)

**Deliverables:**

- 0 ESLint errors
- 0 console statements in production
- Sentry integrated
- <50 `any` types
- 60% test coverage
- Basic Swahili translations

### Phase 2: AI Integration (Months 3-6)

**Goals:**

- Integrate Groq API
- Build RAG pipeline
- Civic Agent Router
- Content moderation AI

**Deliverables:**

- Working AI chatbot for civic queries
- pgvector extension enabled
- Source-cited responses
- Auto-moderation for hate speech

### Phase 3: Mobile & Scale (Months 6-12)

**Goals:**

- React Native mobile app
- Advanced analytics
- Full multilingual (10+ languages)
- Performance optimization

**Deliverables:**

- iOS and Android apps
- 10+ language support
- Real-time analytics dashboard
- 99.9% uptime target

---

## 18. SUCCESS METRICS

### Code Quality Targets

**Phase 1 (Week 6):**

- [ ] ESLint errors: 0
- [ ] TypeScript errors: 0
- [ ] Console statements: 0
- [ ] `any` types: <50
- [ ] Test coverage: >60%
- [ ] Bundle size: <500KB
- [ ] Lighthouse score: >90

**Phase 2 (Month 6):**

- [ ] Test coverage: >80%
- [ ] AI response time: <2s
- [ ] API latency (p95): <200ms
- [ ] Uptime: >99.5%

**Phase 3 (Month 12):**

- [ ] Mobile apps live
- [ ] 10+ languages supported
- [ ] 99.9% uptime
- [ ] 10,000+ MAU

### User Engagement Targets

**Phase 1:**

- 500+ registered users
- 1,000+ posts created
- 10+ active communities

**Phase 2:**

- 5,000+ registered users
- 100+ civic issues reported
- 1,000+ AI queries processed

**Phase 3:**

- 50,000+ registered users
- 10,000+ active daily users
- 100,000+ posts and comments

---

## 19. FINAL REMINDERS

### Development Principles (NEVER COMPROMISE)

1. **Kenya First**: Every feature serves Kenyan civic engagement
2. **Nonpartisan Always**: Zero political bias in any content
3. **Mobile First**: 70% users on mobile, optimize accordingly
4. **Multilingual Mandatory**: English + Swahili minimum (Phase 1.5)
5. **Privacy Paramount**: Minimal data, maximum anonymization
6. **Performance Budget**: <2.5s LCP non-negotiable
7. **Test Everything**: 60%+ coverage (target 80%)
8. **Document Always**: If you build it, document it
9. **Security First**: RLS, validation, auth on everything
10. **User Safety**: Block harmful content without exception

### When in Doubt

**Ask yourself:**

1. Does this serve civic engagement?
2. Is it nonpartisan and factual?
3. Will it work on slow 3G?
4. Can we translate it to Swahili?
5. Is user privacy protected?
6. Is it accessible (a11y)?
7. Have I tested it?
8. Is it documented?

If any answer is **NO**, revise before committing.

---

**Remember:** You're building infrastructure for democracy. Code quality isn't optional—it's a civic duty.

**Let's build something that matters.** 🇰🇪

---

**Document Version:** 2.0 (Adapted to Vite/Supabase stack)  
**Last Updated:** February 6, 2026  
**Next Review:** Weekly or after major milestones  
**Maintained by:** WanaIQ Development Team

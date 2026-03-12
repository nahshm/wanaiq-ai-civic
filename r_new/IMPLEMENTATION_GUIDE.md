# 🚀 Phase 1 Implementation Guide: National Town Hall Foundation

## Overview

This document guides you through implementing the foundational components for transforming WanaIQ into a true "National Town Hall" civic engagement platform.

---

## 📦 What Has Been Created

### 1. Database Layer
**File**: `supabase_migration_feed_activities.sql`

**What it does**:
- Creates `feed_activities` table to log all user actions
- Provides `get_unified_feed()` RPC function to aggregate posts, projects, and activities
- Provides `get_personalized_feed()` RPC function for location-based filtering
- Sets up automatic triggers to log activities when posts/projects are created
- Implements Row Level Security policies

**Installation**:
1. Open Supabase SQL Editor
2. Copy-paste the entire migration file
3. Run it
4. Verify with: `SELECT * FROM get_unified_feed(NULL, 10);`

---

### 2. TypeScript Activity Logger
**File**: `src/lib/activityLogger.ts`

**What it does**:
- Centralized service for logging all user activities
- Convenience functions for common activities (post_created, project_submitted, etc.)
- Batch logging capability
- Helper functions to get activity descriptions and URLs

**Usage examples**:
```typescript
import { logPostCreated, logProjectSubmitted } from '@/lib/activityLogger';

// After creating a post
await logPostCreated(user.id, post.id, {
  title: post.title,
  communityId: post.community_id
});

// After submitting a project
await logProjectSubmitted(user.id, project.id, {
  name: project.name,
  location: project.location,
  county: project.county
});
```

---

### 3. Unified Feed Card System
**Files**:
- `src/components/feed/UnifiedFeedItem.tsx` - Master switcher component
- `src/components/feed/ProjectFeedCard.tsx` - Project display cards
- `src/components/feed/PromiseFeedCard.tsx` - Promise tracking cards
- `src/components/feed/ClipPreviewCard.tsx` - Video clip cards + Achievement cards
- `src/components/feed/ActivityNoticeCard.tsx` - User action notices

**What they do**:
Create visual distinction between different types of feed content:
- Standard posts → PostCard (existing)
- Projects → Green-bordered cards with location/status
- Promises → Amber-bordered cards with progress tracking
- Clips → Video thumbnails with play buttons
- Activities → Dashed-border notices for joins/verifications
- Achievements → Gradient cards with tier icons

---

### 4. Receipt UI Components
**File**: `src/components/ui/ReceiptToast.tsx`

**What it does**:
Creates "tracking receipt" toasts that show:
- Tracking ID (shortened UUID)
- Step-by-step progress
- Next actions

**Usage**:
```typescript
import { toast } from 'sonner';
import { ReceiptToast } from '@/components/ui/ReceiptToast';

toast.success(
  <ReceiptToast
    title="Project Submitted!"
    trackingId={project.id}
    nextSteps={[
      'Community Verification',
      'Admin Review',
      'Official Response'
    ]}
    currentStep={0}
  />
);
```

---

## 🔧 Next Implementation Steps

### Step 1: Run Database Migration (15 minutes)

1. Open Supabase project: https://app.supabase.com
2. Go to SQL Editor
3. Copy entire content of `supabase_migration_feed_activities.sql`
4. Run it
5. Verify:
   ```sql
   -- Should return empty results (no activities yet)
   SELECT * FROM feed_activities LIMIT 10;
   
   -- Should return your existing posts
   SELECT * FROM get_unified_feed(NULL, 10);
   ```

### Step 2: Copy TypeScript Files to Project (10 minutes)

```bash
# From your project root
cp src/lib/activityLogger.ts <your-project>/src/lib/
cp src/components/feed/*.tsx <your-project>/src/components/feed/
cp src/components/ui/ReceiptToast.tsx <your-project>/src/components/ui/
```

### Step 3: Install Missing Dependencies (if needed)

```bash
npm install date-fns  # For date formatting (probably already installed)
```

### Step 4: Update Home Feed (CRITICAL - 1-2 hours)

**File to modify**: `src/features/feed/pages/Home.tsx`

Replace the current posts-only query with unified feed:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedFeedItem, UnifiedFeedItemSkeleton, EmptyFeedState } from '@/components/feed/UnifiedFeedItem';

export default function Home() {
  const { user } = useAuth();

  // Fetch unified feed (posts + projects + activities)
  const { data: feedItems, isLoading, error } = useQuery({
    queryKey: ['unified-feed', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_unified_feed', { 
          p_user_id: user?.id || null,
          p_limit_count: 50 
        });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refetch every 30 seconds for real-time feel
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <UnifiedFeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading feed</p>
      </div>
    );
  }

  if (!feedItems || feedItems.length === 0) {
    return <EmptyFeedState />;
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">For You</h1>
            <p className="text-muted-foreground">Your national civic pulse</p>
          </div>
          
          <div className="space-y-4">
            {feedItems.map((item) => (
              <UnifiedFeedItem 
                key={item.id} 
                item={item}
                onInteraction={() => {
                  // Refetch on interaction (vote, comment, etc.)
                  queryClient.invalidateQueries(['unified-feed']);
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Right Sidebar - keep existing */}
        <div className="lg:col-span-4">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Update CreatePost to Log Activity (30 minutes)

**File to modify**: `src/features/feed/pages/CreatePost.tsx`

Add activity logging and receipt toast:

```typescript
import { logPostCreated } from '@/lib/activityLogger';
import { toast } from 'sonner';
import { ReceiptToast } from '@/components/ui/ReceiptToast';
import { useNavigate } from 'react-router-dom';

// In your submit handler:
const handleSubmit = async (formData) => {
  try {
    // 1. Create the post (existing logic)
    const { data: post, error } = await supabase
      .from('posts')
      .insert({ /* your post data */ })
      .select()
      .single();
    
    if (error) throw error;

    // 2. Log activity (NEW)
    await logPostCreated(user.id, post.id, {
      title: formData.title,
      communityId: formData.communityId,
      contentType: formData.contentType
    });

    // 3. Show receipt toast (NEW)
    toast.success(
      <ReceiptToast
        title="Post Created!"
        trackingId={post.id}
        nextSteps={[
          'Appears in feed',
          'Community sees it',
          'Discussions begin'
        ]}
        currentStep={0}
      />
    );

    // 4. Redirect to post (NEW)
    navigate(`/post/${post.id}`);

  } catch (error) {
    console.error(error);
    toast.error('Failed to create post');
  }
};
```

### Step 6: Update SubmitProject to Log Activity (30 minutes)

**File to modify**: `src/features/accountability/pages/SubmitProject.tsx`

```typescript
import { logProjectSubmitted } from '@/lib/activityLogger';
import { ReceiptToast } from '@/components/ui/ReceiptToast';

// In your submit handler:
const handleSubmit = async (formData) => {
  try {
    // 1. Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({ /* project data */ })
      .select()
      .single();
    
    if (error) throw error;

    // 2. Log activity
    await logProjectSubmitted(user.id, project.id, {
      name: formData.name,
      location: formData.location,
      county: formData.county
    });

    // 3. Show receipt
    toast.success(
      <ReceiptToast
        title="Project Submitted!"
        trackingId={project.id}
        nextSteps={[
          'Community Verification',
          'Admin Review',
          'Official Response'
        ]}
      />
    );

    // 4. Redirect
    navigate(`/p/${project.id}`);

  } catch (error) {
    console.error(error);
    toast.error('Failed to submit project');
  }
};
```

---

## ✅ Testing Checklist

### Database
- [ ] Migration runs without errors
- [ ] `SELECT * FROM feed_activities` returns table
- [ ] `SELECT * FROM get_unified_feed(NULL, 10)` returns posts
- [ ] Triggers fire when inserting test post

### TypeScript
- [ ] No import errors for activityLogger
- [ ] No import errors for feed components
- [ ] TypeScript compiles without errors

### Feed Display
- [ ] Home page loads without errors
- [ ] Existing posts display correctly
- [ ] Feed updates when new content created

### Activity Logging
- [ ] Creating post adds row to feed_activities table
- [ ] Submitting project adds row to feed_activities table
- [ ] Activity cards appear in feed after actions

### Receipt UI
- [ ] Toast appears after post creation
- [ ] Tracking ID visible in toast
- [ ] Progress steps display correctly
- [ ] Redirects to created content

---

## 🎯 Success Metrics

After completing these steps, you should see:

1. **Database**: `feed_activities` table populated with user actions
2. **Feed**: Mixed content cards (posts, projects, activities) in chronological order
3. **UX**: Receipt toasts with tracking IDs after all submissions
4. **Navigation**: Automatic redirects to created content

---

## 🚨 Common Issues & Solutions

### Issue: "function get_unified_feed() does not exist"
**Solution**: Migration didn't run completely. Re-run the migration SQL.

### Issue: Import errors for feed components
**Solution**: Ensure files copied to correct paths. Check @/components/feed directory exists.

### Issue: Feed shows only posts, no activities
**Solution**: Check that activities are being logged. Query `SELECT * FROM feed_activities` to verify.

### Issue: TypeScript errors on FeedItem type
**Solution**: The `data` field is typed as `any` intentionally (each type has different structure). This is acceptable.

---

## 📚 What's Next (Phase 2)

Once Phase 1 is working:
1. Add mobile FAB (Floating Action Button)
2. Add mobile bottom navigation
3. Transform Official profiles into Scorecards
4. Implement "For You" vs "National" tab switching
5. Add personalized feed algorithm

---

## 💬 Need Help?

If you encounter issues:
1. Check Supabase logs for database errors
2. Check browser console for TypeScript errors
3. Verify all files copied to correct locations
4. Test each component individually before integration

**You can proceed step-by-step and test after each step!**

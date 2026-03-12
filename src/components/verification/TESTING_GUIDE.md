# Testing Verification System

## Quick Test Steps

### 1. Manually Add Components to PostCard.tsx

**At line 387 (after the flairs closing `)}`)**, add this code **before** the `{/* Actions */}` comment:

```tsx
          {/* Sentiment Bar */}
          {post.sentiment && (
            <SentimentBar sentiment={post.sentiment} className="mb-3" />
          )}

          {/* Verification Panel */}
          {verification && (
            <VerificationPanel
              verification={verification}
              onVote={castVote}
              isLoading={isCastingVote}
            />
          )}
```

### 2. Test in Browser

1. **Open the app**: `http://localhost:8080` (already running)
2. **View any post** - Click on a post to open it
3. **Check for errors** in browser console
4. **Test verification flow**:
   - Currently posts won't have verification data yet
   - Verification panel will appear after first vote
   
### 3. Create Test Verification (Manual SQL)

Run this in Supabase SQL editor to create a test verification:

```sql
-- Get a post ID first
SELECT id, title FROM posts LIMIT 1;

-- Create verification for that post
INSERT INTO verifications (content_id, content_type, status, truth_score, total_votes)
VALUES ('YOUR_POST_ID_HERE', 'post', 'PENDING', 50, 0);

-- Add some test votes
INSERT INTO verification_votes (verification_id, user_id, vote_type)
SELECT 
  v.id,
  (SELECT id FROM auth.users LIMIT 1),
  'true'
FROM verifications v
WHERE v.content_id = 'YOUR_POST_ID_HERE'
LIMIT 1;
```

### 4. Expected Behavior

**When viewing a post with verification:**
- ✅ See verification badge with status
- ✅ See truth score percentage
- ✅ Click to expand verification panel
- ✅ See vote breakdown bars
- ✅ Can click voting buttons

**When casting a vote:**
- ✅ Button shows loading state
- ✅ Truth score updates automatically
- ✅ Vote breakdown changes
- ✅ Status may change (PENDING → VERIFIED at >80%)

### 5. Check Console for Errors

Look for:
- ❌ Import errors
- ❌ Hook errors  
- ❌ Database query errors
- ❌ Type errors

### 6. Fallback: If Component Not Rendering

The VerificationPanel likely won't show yet because:
1. No posts have verification data
2. Need to create verification entries manually or via voting

**To force render for testing**, temporarily change line in PostCard:
```tsx
// Change this:
{verification && (

// To this (always show):
{(verification || true) && (
  <VerificationPanel
    verification={verification || {
      id: 'test',
      status: 'PENDING',
      truthScore: 50,
      totalVotes: 0,
      breakdown: { true: 0, misleading: 0, outdated: 0 }
    }}
```

## Current Status

- ✅ Database migration applied
- ✅ Types defined
- ✅ Components created
- ✅ Hook implemented
- ✅ Imports added to PostCard
- ⏳ Components need to be added to render (line 387)
- ⏳ Browser testing pending

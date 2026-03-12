# Analytics Setup - PostHog Integration

## Installation

```bash
npm install posthog-js
```

## Configuration

### 1. Environment Variables

Add to `.env`:

```env
VITE_POSTHOG_KEY=your_posthog_project_key
VITE_POSTHOG_HOST=https://app.posthog.com # or self-hosted URL
```

### 2. PostHog Initialization

Create `src/lib/analytics.ts`:

```typescript
import posthog from "posthog-js";

export const initAnalytics = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",

      // Capture settings
      capture_pageview: true,
      capture_pageleave: true,

      // Privacy settings
      mask_all_text: false,
      mask_all_element_attributes: false,

      // Performance
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      },

      // Session recording
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
        },
      },

      // Autocapture events
      autocapture: {
        dom_event_allowlist: ["click", "submit", "change"],
        url_allowlist: [window.location.origin],
        element_allowlist: ["button", "a", "form", "input", "select"],
      },
    });
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  posthog.capture("$pageview", {
    $current_url: window.location.href,
    page_name: pageName,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  posthog.capture(eventName, properties);
};

// Identify user
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  posthog.identify(userId, traits);
};

// Reset on logout
export const resetAnalytics = () => {
  posthog.reset();
};
```

### 3. App Integration

Update `src/main.tsx`:

```typescript
import { initAnalytics } from "./lib/analytics";

// Initialize analytics
initAnalytics();

// ... rest of app initialization
```

### 4. Track User Actions

```typescript
import { trackEvent, identifyUser } from "@/lib/analytics";

// Track post creation
const handleCreatePost = async () => {
  try {
    const post = await createPost(data);

    trackEvent("post_created", {
      post_id: post.id,
      community_id: post.community_id,
      has_media: post.media.length > 0,
      content_length: post.content.length,
    });
  } catch (error) {
    trackEvent("post_create_failed", {
      error: error.message,
    });
  }
};

// Track votes
const handleVote = (postId: string, voteType: "up" | "down") => {
  trackEvent("post_voted", {
    post_id: postId,
    vote_type: voteType,
    previous_vote: post.userVote,
  });
};

// Track search
const handleSearch = (query: string) => {
  trackEvent("search_performed", {
    query_length: query.length,
    has_results: results.length > 0,
    result_count: results.length,
  });
};

// Track authentication
const handleLogin = (user: User) => {
  identifyUser(user.id, {
    username: user.username,
    email: user.email,
    created_at: user.created_at,
  });

  trackEvent("user_logged_in", {
    method: "email", // or 'google', 'github', etc.
  });
};

// Track onboarding completion
const handleOnboardingComplete = () => {
  trackEvent("onboarding_completed", {
    county: user.county,
    constituency: user.constituency,
  });

  posthog.people.set({
    onboarded: true,
    onboarding_completed_at: new Date().toISOString(),
  });
};
```

### 5. Feature Flags

```typescript
import posthog from "posthog-js";

// Check feature flag
const showNewFeature = posthog.isFeatureEnabled("new-feed-design");

// Use in component
const MyComponent = () => {
  const isEnabled = posthog.isFeatureEnabled("quick-search");

  return <>{isEnabled && <QuickSearchDropdown />}</>;
};

// Override for testing
posthog.featureFlags.override({ "new-feed-design": true });
```

### 6. A/B Testing

```typescript
import posthog from "posthog-js";

// Get variant
const variant = posthog.getFeatureFlag("feed-sort-default");

// Track experiment exposure
trackEvent("experiment_viewed", {
  experiment: "feed-sort-default",
  variant: variant,
});

// Use variant
const defaultSort = variant === "hot" ? "hot" : "new";
```

### 7. User Properties

```typescript
import posthog from "posthog-js";

// Set user properties
posthog.people.set({
  location: user.county,
  role: user.role,
  verified: user.is_verified,
});

posthog.people.set_once({
  first_login: new Date().toISOString(),
});

// Increment counters
posthog.people.increment("posts_created");
posthog.people.increment("comments_made");
```

###8. Funnel Tracking

```typescript
// Onboarding funnel
trackEvent("onboarding_started");
trackEvent("onboarding_location_selected", { county });
trackEvent("onboarding_interests_selected", { interests });
trackEvent("onboarding_completed");

// Post creation funnel
trackEvent("create_post_clicked");
trackEvent("post_form_opened", { community_id });
trackEvent("post_title_entered");
trackEvent("post_content_entered");
trackEvent("post_media_uploaded", { media_count });
trackEvent("post_submitted");
trackEvent("post_created_success");
```

## Key Events to Track

### User Engagement

- `page_viewed`
- `post_viewed`
- `post_created`
- `comment_created`
- `post_voted`
- `comment_voted  `
- `post_saved`
- `user_followed`

### Search & Discovery

- `search_performed`
- `search_result_clicked`
- `community_joined`
- `community_viewed`
- `trending_post_clicked`

### Authentication

- `sign_up_started`
- `sign_up_completed`
- `login_attempted`
- `login_succeeded`
- `logout_clicked`

### Content Interaction

- `share_button_clicked`
- `report_submitted`
- `media_viewed`
- `video_played`
- `link_clicked`

## Dashboards to Create

1. **User Acquisition**: Sign-ups, onboarding completion, activation rate
2. **Engagement**: DAU, WAU, MAU, session duration, posts per user
3. **Content**: Posts created, comments, votes, shares
4. **Retention**: Cohort analysis, churn rate, return visits
5. **Search**: Query volume, click-through rate, zero-result rate
6. **Performance**: Page load times, API response times

## Privacy & Compliance

```typescript
// Opt-out mechanism
export const optOutAnalytics = () => {
  posthog.opt_out_capturing();
  localStorage.setItem("analytics_opted_out", "true");
};

// Check opt-out status
export const hasOptedOut = () => {
  return localStorage.getItem("analytics_opted_out") === "true";
};

// GDPR compliance
if (hasOptedOut()) {
  posthog.opt_out_capturing();
}
```

## Testing

```typescript
// Enable debug mode in development
if (import.meta.env.DEV) {
  posthog.debug();
}

// Test events
trackEvent("test_event", {
  test: true,
  timestamp: Date.now(),
});
```

## Status

- ✅ Documentation created
- ⚠️ Needs PostHog account setup
- ⚠️ Needs project key configuration
- ⚠️ Needs event tracking integration
- ⚠️ Needs dashboard setup

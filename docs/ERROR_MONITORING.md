# Error Monitoring Setup - Sentry Integration

## Installation

```bash
npm install @sentry/react @sentry/tracing
```

## Configuration

### 1. Environment Variables

Add to `.env`:

```env
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_ENVIRONMENT=production # or development, staging
VITE_APP_VERSION=1.0.0
```

### 2. Sentry Initialization

Create `src/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "production",
      release: `wana-connect@${import.meta.env.VITE_APP_VERSION}`,

      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Filter sensitive data
      beforeSend(event, hint) {
        // Don't send auth errors
        if (event.exception?.values?.[0]?.type === "AuthError") {
          return null;
        }

        // Redact sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.Authorization;
        }

        return event;
      },

      // Ignore known errors
      ignoreErrors: [
        "Non-Error promise rejection captured",
        "ResizeObserver loop limit exceeded",
        "Network request failed",
      ],
    });
  }
};
```

### 3. App Integration

Update `src/main.tsx`:

```typescript
import { initSentry } from "./lib/sentry";
import * as Sentry from "@sentry/react";

// Initialize Sentry before React
initSentry();

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <ErrorFallback error={error} resetError={resetError} />
    )}
    showDialog
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Sentry.ErrorBoundary>
);
```

### 4. Error Boundary Component

Create `src/components/ErrorFallback.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md p-6 text-center">
        <AlertCircle className="w-12 h-12 text-civic-red mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          We've been notified and are working on a fix.
        </p>
        <details className="text-left mb-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium mb-2">
            Error details
          </summary>
          <pre className="bg-muted p-2 rounded overflow-x-auto">
            {error.message}
          </pre>
        </details>
        <Button onClick={resetError} className="w-full">
          Try Again
        </Button>
      </Card>
    </div>
  );
};
```

### 5. Custom Error Tracking

```typescript
import * as Sentry from "@sentry/react";

// Track custom events
Sentry.captureMessage("User completed onboarding", "info");

// Track errors with context
try {
  await uploadImage(file);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "image-upload",
      fileSize: file.size,
    },
    extra: {
      fileName: file.name,
      fileType: file.type,
    },
  });
  throw error;
}

// Set user context
Sentry.setUser({
  id: user.id,
  username: user.username,
  email: user.email,
});

// Add breadcrumbs
Sentry.addBreadcrumb({
  category: "navigation",
  message: "Navigated to community page",
  level: "info",
  data: {
    communityId: community.id,
    communityName: community.name,
  },
});
```

### 6. Performance Monitoring

```typescript
import * as Sentry from "@sentry/react";

// Manual transaction
const transaction = Sentry.startTransaction({
  name: "Feed Load",
  op: "page.load",
});

const span = transaction.startChild({
  op: "api.request",
  description: "Fetch posts",
});

try {
  const posts = await fetchPosts();
  span.setStatus("ok");
} catch (error) {
  span.setStatus("internal_error");
  throw error;
} finally {
  span.finish();
  transaction.finish();
}
```

## Dashboard Setup

1. **Create Sentry Project**: https://sentry.io/signup/
2. **Configure Alerts**:
   - New issue created
   - Issue frequency threshold
   - Performance degradation
3. **Set up integrations**: Slack,GitHub, etc.
4. **Configure release tracking**: Upload source maps

## Source Maps

Add to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: "your-org",
      project: "wana-connect",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

## Testing

```typescript
// Trigger test error in development
if (import.meta.env.DEV) {
  window.testSentryError = () => {
    throw new Error("Test Sentry Error");
  };
}

// Test from console: testSentryError()
```

## Best Practices

1. **Always provide context**: tags, user info, breadcrumbs
2. **Filter sensitive data**: passwords, tokens, PII
3. **Set appropriate sample rates**: Don't overwhelm Sentry
4. **Use error boundaries**: Catch React errors gracefully
5. **Monitor performance**: Track slow transactions
6. **Configure alerts**: Get notified of critical issues
7. **Regular triage**: Review and resolve errors weekly

## Status

- ✅ Documentation created
- ⚠️ Needs Sentry account setup
- ⚠️ Needs DSN configuration
- ⚠️ Needs source map upload setup
- ⚠️ Needs error boundary integration

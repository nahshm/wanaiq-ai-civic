# WanaIQ AI Integration Guide

**Post-Deployment: Making Your AI Infrastructure Work in Production**

## ✅ What You've Accomplished

```
Database Layer:
✅ ai_configurations (API keys storage)
✅ moderation_logs (governance audit trail)
✅ routing_logs (routing accuracy tracking)
✅ vectors (RAG knowledge base)
✅ rag_chat_history (conversation memory)
✅ match_documents RPC (vector similarity search)

Edge Functions Layer:
✅ civic-steward (content moderation)
✅ civic-router (issue routing)
✅ civic-brain (RAG Q&A)
✅ Groq API integration (Llama 3.1)

Frontend Layer:
✅ aiClient service with typed methods
✅ governance(), routing(), rag() available
```

## 🎯 Next Steps: Feature Integration (Week 3-4)

### Integration Priority Matrix

| Feature              | AI Function   | Priority    | Effort | Impact |
| -------------------- | ------------- | ----------- | ------ | ------ |
| Post Submission      | civic-steward | 🔥 Critical | 2h     | High   |
| Action Hub (Issues)  | civic-router  | 🔥 Critical | 4h     | High   |
| Promise Tracking     | civic-steward | ⚠️ High     | 2h     | Medium |
| Civic Assistant Chat | civic-brain   | ⚠️ High     | 6h     | High   |
| Project Reporting    | civic-steward | 📋 Medium   | 2h     | Medium |
| Comments             | civic-steward | 📋 Medium   | 1h     | Low    |

## 1. Post Submission Integration (Priority 1)

### Current Flow (Before AI):

```typescript
// Typical current implementation
async function handlePostSubmit(postData) {
  const { data, error } = await supabase.from("posts").insert(postData);

  if (error) throw error;
  router.push(`/posts/${data.id}`);
}
```

### New Flow (With AI Governance):

```typescript
// src/components/posts/CreatePostForm.tsx
import { aiClient } from '@/services/aiClient';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const postSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  tags: z.array(z.string()).optional()
});

type PostFormData = z.infer<typeof postSchema>;

interface GovernanceResult {
  verdict: 'APPROVED' | 'NEEDS_REVISION' | 'FLAGGED' | 'BLOCKED';
  confidence: number;
  reason?: string;
  suggestions?: string[];
  categories?: string[];
}

export function CreatePostForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [governanceResult, setGovernanceResult] = useState<GovernanceResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PostFormData>({
    resolver: zodResolver(postSchema)
  });

  async function onSubmit(data: PostFormData) {
    try {
      setSubmitting(true);

      // STEP 1: AI Governance Check
      const governance = await aiClient.governance(
        'post',
        crypto.randomUUID(), // Temporary ID
        {
          title: data.title,
          description: data.description,
          metadata: { tags: data.tags }
        }
      );

      setGovernanceResult(governance);

      // STEP 2: Handle Verdict
      if (governance.verdict === 'BLOCKED') {
        // Show error and stop
        alert(`Content Blocked: ${governance.reason}`);
        return;
      }

      if (governance.verdict === 'NEEDS_REVISION') {
        // Show suggestions modal
        setShowSuggestions(true);
        return;
      }

      if (governance.verdict === 'FLAGGED') {
        // Ask user to confirm
        const confirmed = confirm(
          `Your post was flagged: ${governance.reason}\n\nDo you still want to post?`
        );
        if (!confirmed) return;
      }

      // STEP 3: Create Post (if APPROVED or confirmed FLAGGED)
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title: data.title,
          description: data.description,
          tags: data.tags,
          governance_verdict: governance.verdict,
          governance_confidence: governance.confidence,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Success!
      navigate(`/posts/${post.id}`);

    } catch (error) {
      console.error('Post submission error:', error);
      alert('Failed to submit post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          {...register('title')}
          type="text"
          className="mt-1 block w-full rounded-md border p-2"
          placeholder="Give your post a clear title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={6}
          className="mt-1 block w-full rounded-md border p-2"
          placeholder="Share your thoughts with the community"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* AI Suggestions Modal */}
      {showSuggestions && governanceResult?.verdict === 'NEEDS_REVISION' && (
        <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4">
          <h3 className="font-semibold text-yellow-800">
            💡 AI Suggestions to Improve Your Post
          </h3>
          <p className="mt-2 text-sm text-yellow-700">
            {governanceResult.reason}
          </p>
          {governanceResult.suggestions && (
            <ul className="mt-3 space-y-1">
              {governanceResult.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-yellow-800">
                  • {suggestion}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setShowSuggestions(false)}
            className="mt-3 text-sm text-yellow-600 underline"
          >
            Edit and try again
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Checking content...' : 'Post to Community'}
      </button>

      {/* AI Status Indicator */}
      {governanceResult && (
        <div className="text-xs text-gray-500">
          AI Review: {governanceResult.verdict}
          ({Math.round(governanceResult.confidence * 100)}% confidence)
        </div>
      )}
    </form>
  );
}
```

### Database Schema Update:

```sql
-- Add governance fields to posts table
ALTER TABLE posts
ADD COLUMN governance_verdict TEXT,
ADD COLUMN governance_confidence FLOAT,
ADD COLUMN governance_timestamp TIMESTAMPTZ DEFAULT NOW();

-- Index for analytics
CREATE INDEX idx_posts_governance ON posts(governance_verdict);
```

## 2. Action Hub (Issue Routing) Integration (Priority 2)

### Current Flow (Before AI):

```typescript
// User manually selects department from dropdown
async function handleIssueSubmit(issueData) {
  const { data, error } = await supabase.from("civic_issues").insert({
    description: issueData.description,
    department: issueData.selectedDepartment, // Manual selection
    location: issueData.location,
  });
}
```

### New Flow (With AI Routing):

```typescript
// src/components/action-hub/ReportIssueForm.tsx
import { aiClient } from '@/services/aiClient';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface RoutingResult {
  department_slug: string;
  department_name: string;
  jurisdiction: 'ward' | 'constituency' | 'county' | 'national';
  issue_type: string;
  severity: number;
  confidence: number;
  required_forms: Array<{
    form_id: string;
    form_name: string;
    template_url: string;
  }>;
  estimated_resolution_days: number;
  contact_info: {
    email?: string;
    phone?: string;
    office_location?: string;
  };
  next_steps: string[];
}

export function ReportIssueForm() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Get user location
  function getLocation() {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }

  // AI Routing
  async function handleRouteIssue() {
    if (!description || !location) return;

    try {
      setRoutingLoading(true);

      const result = await aiClient.routing(
        description,
        {
          lat: location.lat,
          lng: location.lng,
          ward: 'Kilimani', // You'd get this from geocoding
          constituency: 'Westlands',
          county: 'Nairobi'
        },
        photos
      );

      setRouting(result);

    } catch (error) {
      console.error('Routing error:', error);
      alert('Failed to route issue. Please try again.');
    } finally {
      setRoutingLoading(false);
    }
  }

  async function handleConfirmSubmit() {
    if (!routing) return;

    try {
      const { data, error } = await supabase
        .from('civic_issues')
        .insert({
          description,
          location,
          photos,
          // AI routing data
          department_slug: routing.department_slug,
          issue_type: routing.issue_type,
          jurisdiction: routing.jurisdiction,
          severity: routing.severity,
          ai_routing_confidence: routing.confidence,
          estimated_resolution_days: routing.estimated_resolution_days,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Success! Navigate to tracking page
      navigate(`/issues/${data.id}`);

    } catch (error) {
      console.error('Issue submission error:', error);
      alert('Failed to submit issue.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Describe Issue */}
      {!routing && (
        <>
          <div>
            <label className="block text-sm font-medium">
              Describe the issue
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="e.g., Burst water pipe on Kenyatta Road near Kilimani"
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <button
              type="button"
              onClick={getLocation}
              className="mt-1 flex items-center gap-2 rounded-md border px-4 py-2"
            >
              <MapPin size={16} />
              {location ? 'Location captured ✓' : 'Get current location'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleRouteIssue}
            disabled={!description || !location || routingLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {routingLoading ? 'Routing to department...' : 'Route My Issue'}
          </button>
        </>
      )}

      {/* Step 2: Review Routing */}
      {routing && !confirmed && (
        <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">
            🎯 Your Issue Will Be Routed To:
          </h3>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{routing.department_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Issue Type</p>
                <p className="font-medium capitalize">{routing.issue_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Severity</p>
                <p className="font-medium">
                  {routing.severity}/10
                  {routing.severity >= 7 && ' 🔴 High'}
                  {routing.severity >= 4 && routing.severity < 7 && ' 🟡 Medium'}
                  {routing.severity < 4 && ' 🟢 Low'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Estimated Resolution</p>
              <p className="font-medium">{routing.estimated_resolution_days} days</p>
            </div>

            {routing.contact_info.email && (
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="text-sm">{routing.contact_info.email}</p>
              </div>
            )}

            {routing.required_forms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Required Forms:</p>
                <ul className="mt-2 space-y-1">
                  {routing.required_forms.map((form) => (
                    <li key={form.form_id} className="text-sm">
                      • {form.form_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {routing.next_steps.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Next Steps:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {routing.next_steps.map((step, i) => (
                    <li key={i} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleConfirmSubmit}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              Confirm & Submit
            </button>
            <button
              onClick={() => setRouting(null)}
              className="rounded-md border px-4 py-2"
            >
              Edit Description
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            AI Confidence: {Math.round(routing.confidence * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}
```

### Database Schema Update:

```sql
-- Add AI routing fields to civic_issues table
ALTER TABLE civic_issues
ADD COLUMN issue_type TEXT,
ADD COLUMN jurisdiction TEXT,
ADD COLUMN severity INTEGER,
ADD COLUMN ai_routing_confidence FLOAT,
ADD COLUMN estimated_resolution_days INTEGER,
ADD COLUMN actual_resolution_days INTEGER, -- Track accuracy
ADD COLUMN user_rating INTEGER; -- 1-5 stars for routing accuracy

-- Index for analytics
CREATE INDEX idx_issues_routing ON civic_issues(issue_type, severity);
```

## 3. Civic Assistant Chat Integration (Priority 3)

### Create New Component:

```typescript
// src/components/civic-assistant/CivicChat.tsx
import { aiClient } from '@/services/aiClient';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, Globe } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    document_id: string;
    title: string;
    article?: string;
    url?: string;
    similarity: number;
  }>;
  confidence?: number;
  timestamp: Date;
}

export function CivicChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await aiClient.rag(
        input,
        sessionId,
        language,
        true // Include conversation history
      );

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        confidence: result.confidence,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('RAG error:', error);

      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[600px] flex-col rounded-lg border bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Civic Assistant</h2>

        {/* Language Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`rounded px-3 py-1 text-sm ${
              language === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('sw')}
            className={`rounded px-3 py-1 text-sm ${
              language === 'sw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100'
            }`}
          >
            Kiswahili
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500">
            <Globe className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="text-sm">
              {language === 'sw'
                ? 'Uliza swali kuhusu serikali ya Kenya...'
                : 'Ask me anything about Kenyan governance...'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Sources */}
              {message.role === 'assistant' && message.sources && (
                <div className="mt-3 space-y-1 border-t border-gray-300 pt-2">
                  <p className="text-xs font-semibold text-gray-600">Sources:</p>
                  {message.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:underline"
                    >
                      [{i + 1}] {source.title}
                      {source.article && ` - Article ${source.article}`}
                    </a>
                  ))}
                </div>
              )}

              {/* Confidence */}
              {message.role === 'assistant' && message.confidence && (
                <p className="mt-2 text-xs text-gray-500">
                  Confidence: {Math.round(message.confidence * 100)}%
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 p-3">
              <div className="flex gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'sw'
                ? 'Uliza swali...'
                : 'Ask a question...'
            }
            disabled={loading}
            className="flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Add Route:

```typescript
// src/App.tsx or your router config
import { CivicChat } from '@/components/civic-assistant/CivicChat';

// Add route
{
  path: '/civic-assistant',
  element: <CivicChat />
}
```

## 4. Promise Tracking Integration

```typescript
// src/components/promises/CreatePromiseForm.tsx
import { aiClient } from "@/services/aiClient";

async function handlePromiseSubmit(promiseData) {
  // AI governance for promises
  const governance = await aiClient.governance("promise", crypto.randomUUID(), {
    title: `${promiseData.politician} - ${promiseData.promise}`,
    description: promiseData.details,
    metadata: {
      deadline: promiseData.deadline,
      location: promiseData.location,
    },
  });

  // Check for specificity
  if (governance.verdict === "NEEDS_REVISION") {
    // Promise is too vague
    alert(`Make it more specific: ${governance.reason}`);
    return;
  }

  // Create promise with governance data
  const { data, error } = await supabase.from("promises").insert({
    ...promiseData,
    governance_verdict: governance.verdict,
    governance_confidence: governance.confidence,
  });
}
```

## 5. Testing & Validation

### Test Each Integration:

```typescript
// src/tests/ai-integration.test.ts
import { aiClient } from "@/services/aiClient";

describe("AI Integration Tests", () => {
  describe("Post Governance", () => {
    it("should approve good content", async () => {
      const result = await aiClient.governance("post", "test-1", {
        title: "Community Cleanup Event",
        description:
          "Join us for a community cleanup in Uhuru Park on Saturday, May 15, 2026. We will provide gloves and trash bags.",
      });

      expect(result.verdict).toBe("APPROVED");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should block hate speech", async () => {
      const result = await aiClient.governance("post", "test-2", {
        description: "Those [tribe] people are...", // Hate speech
      });

      expect(result.verdict).toBe("BLOCKED");
      expect(result.categories).toContain("hate_speech");
    });

    it("should flag vague promises", async () => {
      const result = await aiClient.governance("promise", "test-3", {
        title: "Governor will improve roads",
        description: "The governor promised to improve roads",
      });

      expect(result.verdict).toBe("NEEDS_REVISION");
      expect(result.suggestions).toBeDefined();
    });
  });

  describe("Issue Routing", () => {
    it("should route water issues correctly", async () => {
      const result = await aiClient.routing(
        "Burst water pipe on Kenyatta Road",
        {
          lat: -1.2864,
          lng: 36.8172,
          county: "Nairobi",
          ward: "Kilimani",
        },
      );

      expect(result.issue_type).toBe("water");
      expect(result.jurisdiction).toBe("county");
      expect(result.severity).toBeGreaterThan(5);
    });
  });

  describe("RAG Q&A", () => {
    it("should answer civic questions with sources", async () => {
      const result = await aiClient.rag(
        "What are the functions of county government?",
        "test-session",
        "en",
      );

      expect(result.answer).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });
});
```

## 6. Analytics Dashboard

### Track AI Performance:

```typescript
// src/components/admin/AIAnalyticsDashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AIAnalyticsDashboard() {
  const [stats, setStats] = useState({
    governance: { total: 0, approved: 0, blocked: 0, flagged: 0 },
    routing: { total: 0, avgConfidence: 0, avgSeverity: 0 },
    rag: { total: 0, avgConfidence: 0, uniqueSessions: 0 }
  });

  useEffect(() => {
    async function fetchStats() {
      // Governance stats
      const { data: govData } = await supabase
        .from('moderation_logs')
        .select('verdict, ai_confidence')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Routing stats
      const { data: routingData } = await supabase
        .from('routing_logs')
        .select('confidence, severity')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // RAG stats
      const { data: ragData } = await supabase
        .from('rag_chat_history')
        .select('session_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        governance: {
          total: govData?.length || 0,
          approved: govData?.filter(d => d.verdict === 'APPROVED').length || 0,
          blocked: govData?.filter(d => d.verdict === 'BLOCKED').length || 0,
          flagged: govData?.filter(d => d.verdict === 'FLAGGED').length || 0
        },
        routing: {
          total: routingData?.length || 0,
          avgConfidence: routingData?.reduce((sum, d) => sum + (d.confidence || 0), 0) / (routingData?.length || 1),
          avgSeverity: routingData?.reduce((sum, d) => sum + (d.severity || 0), 0) / (routingData?.length || 1)
        },
        rag: {
          total: ragData?.length || 0,
          avgConfidence: 0,
          uniqueSessions: new Set(ragData?.map(d => d.session_id)).size || 0
        }
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Governance Stats */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold">Content Governance</h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm">Total Reviews: {stats.governance.total}</p>
          <p className="text-sm text-green-600">Approved: {stats.governance.approved}</p>
          <p className="text-sm text-red-600">Blocked: {stats.governance.blocked}</p>
          <p className="text-sm text-yellow-600">Flagged: {stats.governance.flagged}</p>
        </div>
      </div>

      {/* Routing Stats */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold">Issue Routing</h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm">Total Routes: {stats.routing.total}</p>
          <p className="text-sm">Avg Confidence: {Math.round(stats.routing.avgConfidence * 100)}%</p>
          <p className="text-sm">Avg Severity: {stats.routing.avgSeverity.toFixed(1)}/10</p>
        </div>
      </div>

      {/* RAG Stats */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold">Civic Assistant</h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm">Total Messages: {stats.rag.total}</p>
          <p className="text-sm">Active Sessions: {stats.rag.uniqueSessions}</p>
        </div>
      </div>
    </div>
  );
}
```

## 7. Deployment Checklist

Before going to production:

- [ ] **Test all integrations** with real data
- [ ] **Add error boundaries** to AI components
- [ ] **Set up monitoring** (track API errors, latency)
- [ ] **Add rate limiting** (prevent abuse)
- [ ] **Update documentation** (user guides)
- [ ] **Train support team** (how to handle AI issues)
- [ ] **Create fallback UI** (when AI is down)
- [ ] **Set up alerts** (when accuracy drops below threshold)

## 8. User Feedback Loop

```sql
-- Add user feedback for AI accuracy
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature TEXT NOT NULL, -- 'governance', 'routing', 'rag'
  interaction_id UUID NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track accuracy over time
CREATE INDEX idx_ai_feedback ON ai_feedback(feature, rating, created_at);
```

## 9. Next Steps (This Week)

### Monday: Post Integration

- [ ] Add governance to CreatePostForm
- [ ] Test with 10 different posts
- [ ] Measure approval/block rates

### Tuesday: Issue Routing

- [ ] Add routing to ReportIssueForm
- [ ] Test with 20 real issues from Twitter
- [ ] Verify department accuracy

### Wednesday: Civic Chat

- [ ] Build CivicChat component
- [ ] Add to navigation
- [ ] Test with civic questions

### Thursday: Analytics

- [ ] Build admin dashboard
- [ ] Review AI performance
- [ ] Identify improvement areas

### Friday: Demo

- [ ] Record demo video showing all 3 features
- [ ] Document edge cases found
- [ ] Update progress tracker

## 10. Monitoring Queries

Run these daily to track AI health:

```sql
-- Governance accuracy (last 24h)
SELECT
  verdict,
  COUNT(*) as count,
  AVG(ai_confidence) as avg_confidence
FROM moderation_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY verdict;

-- Routing accuracy (needs user ratings)
SELECT
  issue_type,
  AVG(user_rating) as avg_rating,
  COUNT(*) as total
FROM routing_logs
WHERE user_rating IS NOT NULL
GROUP BY issue_type;

-- RAG usage
SELECT
  COUNT(DISTINCT session_id) as sessions,
  COUNT(*) as messages,
  AVG(LENGTH(content)) as avg_response_length
FROM rag_chat_history
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

**You're ready to integrate! Start with posts, then issues, then chat.** 🚀

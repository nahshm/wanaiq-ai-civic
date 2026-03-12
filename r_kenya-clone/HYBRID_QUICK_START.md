# WanaIQ Hybrid Architecture - Quick Start Guide

## 🎯 What You're Building

Three separate Edge Functions that work together:

1. **civic-steward** - Content moderation (posts, promises, projects)
2. **civic-router** - Issue routing to government departments
3. **civic-brain** - RAG-powered civic Q&A

## 📋 Prerequisites Checklist

- [ ] Supabase project created
- [ ] Groq API account (free tier is fine)
- [ ] Node.js 18+ installed
- [ ] Supabase CLI installed (`npm i -g supabase`)
- [ ] Git repository set up

## ⚡ 15-Minute Setup

### Step 1: Database Setup (5 min)

```sql
-- Run in Supabase SQL Editor

-- Enable pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Configuration table
CREATE TABLE ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_slug TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  models JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lock it down
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON ai_configurations
  FOR ALL USING (auth.role() = 'service_role');

-- Insert Groq config (replace with your actual key)
INSERT INTO ai_configurations (provider_slug, api_key, models)
VALUES (
  'groq',
  'your-groq-api-key-here',
  '["llama-3-8b-8192", "llama-3-70b-8192"]'::jsonb
);

-- Governance logs
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  verdict TEXT NOT NULL,
  reason TEXT,
  ai_confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routing logs
CREATE TABLE routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  issue_type TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  department_slug TEXT,
  severity INTEGER,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG vectors
CREATE TABLE vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vectors_embedding ON vectors 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RAG chat history
CREATE TABLE rag_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Initialize Supabase Functions (3 min)

```bash
# In your project root
supabase init

# Create the three functions
supabase functions new civic-steward
supabase functions new civic-router
supabase functions new civic-brain
```

### Step 3: Copy Function Code (5 min)

Copy the implementations from `PHASE3_HYBRID_ARCHITECTURE.md` into:
- `supabase/functions/civic-steward/index.ts`
- `supabase/functions/civic-router/index.ts`
- `supabase/functions/civic-brain/index.ts`

### Step 4: Deploy (2 min)

```bash
# Set your Groq API key as secret
supabase secrets set GROQ_API_KEY=your-key-here

# Deploy all functions
supabase functions deploy civic-steward
supabase functions deploy civic-router
supabase functions deploy civic-brain
```

## 🧪 Test It Works

### Test Governance

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/civic-steward' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "content_type": "post",
    "content_id": "test-123",
    "content": {
      "description": "Community cleanup event this Saturday!"
    },
    "user_id": "test-user"
  }'

# Expected response:
# {
#   "verdict": "APPROVED",
#   "confidence": 0.95
# }
```

### Test Routing

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/civic-router' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "issue_description": "Burst water pipe on Kenyatta Road",
    "location": {
      "lat": -1.2864,
      "lng": 36.8172,
      "county": "Nairobi",
      "ward": "Kilimani"
    },
    "user_id": "test-user"
  }'

# Expected response:
# {
#   "issue_type": "water",
#   "department_name": "Nairobi Water...",
#   "severity": 8,
#   "confidence": 0.92
# }
```

### Test RAG

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/civic-brain' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are county government functions?",
    "session_id": "test-session-123",
    "user_id": "test-user",
    "language": "en"
  }'

# Expected response:
# {
#   "answer": "County governments handle...",
#   "sources": [...],
#   "confidence": 0.88
# }
```

## 💻 Frontend Integration

### Install Client

```bash
npm install @supabase/supabase-js
```

### Create AIClient Service

```typescript
// src/services/aiClient.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const aiClient = {
  async governance(contentType, contentId, content) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke('civic-steward', {
      body: { content_type: contentType, content_id: contentId, content, user_id: user.id }
    });
    
    if (error) throw error;
    return data;
  },

  async routing(issueDescription, location) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke('civic-router', {
      body: { issue_description: issueDescription, location, user_id: user.id }
    });
    
    if (error) throw error;
    return data;
  },

  async rag(query, sessionId, language = 'en') {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke('civic-brain', {
      body: { query, session_id: sessionId, user_id: user.id, language }
    });
    
    if (error) throw error;
    return data;
  }
};
```

### Use in Components

```typescript
// Example: Post submission with governance
import { aiClient } from '@/services/aiClient';

async function handleSubmitPost(postData) {
  // Step 1: Check with governance
  const governance = await aiClient.governance('post', tempId, {
    title: postData.title,
    description: postData.description
  });

  if (governance.verdict === 'BLOCKED') {
    alert('Content blocked: ' + governance.reason);
    return;
  }

  if (governance.verdict === 'NEEDS_REVISION') {
    setShowSuggestions(governance.suggestions);
    return;
  }

  // Step 2: Create the post
  const { data } = await supabase.from('posts').insert(postData);
  
  router.push(`/posts/${data.id}`);
}
```

## 📊 Monitoring

### View Logs

```sql
-- Recent governance decisions
SELECT verdict, COUNT(*), AVG(ai_confidence)
FROM moderation_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY verdict;

-- Routing accuracy
SELECT issue_type, AVG(confidence), COUNT(*)
FROM routing_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY issue_type;

-- RAG usage
SELECT COUNT(DISTINCT session_id) as sessions
FROM rag_chat_history
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Supabase Dashboard

Go to: `Supabase Dashboard → Functions → [function-name] → Logs`

Watch for:
- Response times (should be <2s)
- Error rates (should be <1%)
- Invocation counts

## 🚨 Common Issues & Fixes

### Issue: "API key not found"
**Fix:** Make sure you inserted Groq API key into `ai_configurations` table

```sql
SELECT * FROM ai_configurations WHERE provider_slug = 'groq';
-- Should return 1 row with your key
```

### Issue: "Function timeout"
**Fix:** Increase timeout in `supabase/functions/[name]/index.ts`:

```typescript
serve(async (req) => {
  // Add this at the top
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s
  
  try {
    // ... your code
  } finally {
    clearTimeout(timeoutId);
  }
});
```

### Issue: "Vector search not working"
**Fix:** Make sure you created the ivfflat index:

```sql
CREATE INDEX idx_vectors_embedding ON vectors 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Issue: "CORS error from frontend"
**Fix:** Add CORS headers to function response:

```typescript
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  }
});
```

## 📈 Next Steps

1. **Ingest Documents** - Add Constitution, laws to `vectors` table
2. **Add Department Data** - Create `government_departments` table
3. **Build Forms Library** - Create `government_forms` table
4. **Implement Feedback** - Add user ratings for routing accuracy
5. **Add Analytics** - Track usage patterns

## 🎓 Learning Resources

- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Groq API Docs:** https://console.groq.com/docs
- **pgvector Guide:** https://supabase.com/docs/guides/ai/vector-columns
- **Your Technical Roadmap:** `WanaIQ_Technical_Roadmap_FINAL_SUBMISSION__1_.pdf`

## ✅ Success Criteria

Your hybrid architecture is working when:
- [ ] All 3 functions deploy without errors
- [ ] Governance returns verdicts in <2s
- [ ] Routing achieves >80% confidence
- [ ] RAG answers with source citations
- [ ] Frontend aiClient works seamlessly
- [ ] Zero critical technical debt

---

**Quick Reference:**
- Architecture doc: `PHASE3_HYBRID_ARCHITECTURE.md`
- Custom instructions: `wanaiq_custom_instructions.md`
- Progress tracker: `progress_tracker.js`

**Need help?** Check custom instructions section 3.0 for architecture pattern rules.

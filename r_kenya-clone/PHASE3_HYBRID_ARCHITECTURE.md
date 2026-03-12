# Phase 3: AI Infrastructure - Hybrid Architecture Implementation
**WanaIQ Civic Engagement Platform**

## Executive Summary

This document outlines the **Hybrid Architecture** approach combining:
- ✅ **Clean unified client API** (simple developer experience)
- ✅ **Separate Edge Functions backend** (scalable, maintainable, testable)
- ✅ **Groq standardization** (cost-efficient, fast inference)
- ✅ **Alignment with Technical Roadmap** (microservices vision)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  Single AIClient Service (TypeScript)                        │
│  - aiClient.governance(content)                              │
│  - aiClient.routing(issue)                                   │
│  - aiClient.rag(query)                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE EDGE FUNCTIONS                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ civic-steward│  │ civic-router │  │ civic-brain  │      │
│  │ (Governance) │  │ (Routing)    │  │ (RAG)        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              SHARED INFRASTRUCTURE                           │
│  - ai_configurations (API keys, encrypted)                   │
│  - moderation_logs (governance audit)                        │
│  - vectors (RAG knowledge base - pgvector)                   │
│  - Groq API (Llama 3 - standardized provider)                │
└─────────────────────────────────────────────────────────────┘
```

## Why Hybrid Architecture?

| Requirement | Microservices | Single Gateway | ✅ Hybrid |
|-------------|--------------|----------------|----------|
| Simple client code | ❌ | ✅ | ✅ |
| Independent scaling | ✅ | ❌ | ✅ |
| Independent deployment | ✅ | ❌ | ✅ |
| Easy testing | ✅ | ❌ | ✅ |
| Low technical debt | ✅ | ❌ | ✅ |
| Cost efficient | ✅ | ⚠️ | ✅ |
| Follows roadmap | ✅ | ❌ | ✅ |

## 1. Database Schema (Foundation)

### 1.1 AI Configuration (Security & Keys)

```sql
-- Store API keys securely (never exposed to frontend)
CREATE TABLE ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_slug TEXT NOT NULL UNIQUE, -- 'groq' (standardized)
  api_key TEXT NOT NULL, -- Encrypted in production
  is_active BOOLEAN DEFAULT true,
  models JSONB NOT NULL, -- ['llama-3-8b-8192', 'llama-3-70b-8192']
  rate_limits JSONB, -- {requests_per_minute: 100, tokens_per_day: 1000000}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Only service_role and super_admin can access
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON ai_configurations
  FOR ALL
  USING (auth.role() = 'service_role');
```

### 1.2 Governance Audit Trail

```sql
-- Track all moderation decisions for transparency
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_type TEXT NOT NULL, -- 'post', 'promise', 'project', 'comment'
  content_id UUID NOT NULL, -- Reference to actual content
  content_preview TEXT, -- First 200 chars for audit
  verdict TEXT NOT NULL, -- 'APPROVED', 'NEEDS_REVISION', 'FLAGGED', 'BLOCKED'
  reason TEXT, -- AI's explanation
  ai_confidence FLOAT, -- 0.0 to 1.0
  categories JSONB, -- ['hate_speech', 'pii', 'misinformation']
  ai_model TEXT, -- 'llama-3-8b-8192'
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX idx_moderation_verdict ON moderation_logs(verdict, created_at);
CREATE INDEX idx_moderation_user ON moderation_logs(user_id);
```

### 1.3 Routing Intelligence

```sql
-- Track routing decisions for accuracy improvement
CREATE TABLE routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  issue_type TEXT NOT NULL, -- 'water', 'roads', 'security', 'health', etc.
  issue_description TEXT NOT NULL,
  location JSONB, -- {lat, lng, ward, constituency, county}
  
  -- AI Decision
  department_slug TEXT, -- 'nairobi-water-dept'
  jurisdiction TEXT, -- 'county', 'national', 'ward'
  severity INTEGER, -- 1-10 scale
  confidence FLOAT, -- 0.0 to 1.0
  required_forms JSONB, -- [{form_id, form_name, template_url}]
  estimated_resolution_days INTEGER,
  
  -- Feedback Loop
  user_rating INTEGER, -- 1-5 stars (was routing helpful?)
  actual_resolution_days INTEGER, -- Update when resolved
  was_accurate BOOLEAN, -- Manual flag if routing was wrong
  
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_issue_type ON routing_logs(issue_type);
CREATE INDEX idx_routing_location ON routing_logs USING GIN(location);
```

### 1.4 RAG Knowledge Base (pgvector)

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Store civic document embeddings
CREATE TABLE vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL, -- Actual text chunk (512 tokens)
  embedding VECTOR(1536), -- sentence-transformers embedding
  metadata JSONB NOT NULL,
  -- Example metadata:
  -- {
  --   "source": "Constitution of Kenya 2010",
  --   "article_number": "47",
  --   "category": "rights",
  --   "language": "en",
  --   "url": "http://kenyalaw.org/...",
  --   "chunk_index": 5
  -- }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index (CRITICAL for performance)
CREATE INDEX idx_vectors_embedding ON vectors 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Metadata search index
CREATE INDEX idx_vectors_metadata ON vectors USING GIN(metadata);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vectors.id,
    vectors.content,
    vectors.metadata,
    1 - (vectors.embedding <=> query_embedding) AS similarity
  FROM vectors
  WHERE 1 - (vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 1.5 RAG Chat History

```sql
-- Store conversation history for context
CREATE TABLE rag_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID NOT NULL, -- Group messages by session
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  sources JSONB, -- [{document_id, article, similarity}] for citations
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rag_session ON rag_chat_history(session_id, created_at);
CREATE INDEX idx_rag_user ON rag_chat_history(user_id);
```

## 2. Backend: Three Specialized Edge Functions

### 2.1 Function 1: civic-steward (Governance)

**Purpose:** Content moderation and quality assurance  
**Milestone:** Continuous (all phases)  
**Triggers:** Post submit, Promise submit, Project submit

```typescript
// supabase/functions/civic-steward/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Groq from 'https://esm.sh/groq-sdk@0.3.0';

interface GovernanceRequest {
  content_type: 'post' | 'promise' | 'project' | 'comment';
  content_id: string;
  content: {
    title?: string;
    description: string;
    metadata?: any;
  };
  user_id: string;
}

interface GovernanceResponse {
  verdict: 'APPROVED' | 'NEEDS_REVISION' | 'FLAGGED' | 'BLOCKED';
  confidence: number;
  reason?: string;
  suggestions?: string[];
  categories?: string[];
}

serve(async (req) => {
  try {
    const { content_type, content_id, content, user_id }: GovernanceRequest = 
      await req.json();

    // Initialize Supabase client (service role)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Groq API key from secure storage
    const { data: config } = await supabase
      .from('ai_configurations')
      .select('api_key, models')
      .eq('provider_slug', 'groq')
      .eq('is_active', true)
      .single();

    if (!config) throw new Error('AI configuration not found');

    // Initialize Groq client
    const groq = new Groq({ apiKey: config.api_key });

    // Select system prompt based on content type
    const systemPrompt = getSystemPrompt(content_type);

    // Call Groq LLM
    const startTime = Date.now();
    const completion = await groq.chat.completions.create({
      model: 'llama-3-8b-8192', // Fast, cost-efficient
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formatContent(content) }
      ],
      temperature: 0.3, // Low for consistent moderation
      max_tokens: 500,
      response_format: { type: 'json_object' } // Structured output
    });

    const processingTime = Date.now() - startTime;
    const result: GovernanceResponse = JSON.parse(
      completion.choices[0].message.content || '{}'
    );

    // Log decision for audit trail
    await supabase.from('moderation_logs').insert({
      user_id,
      content_type,
      content_id,
      content_preview: content.description.substring(0, 200),
      verdict: result.verdict,
      reason: result.reason,
      ai_confidence: result.confidence,
      categories: result.categories,
      ai_model: 'llama-3-8b-8192',
      processing_time_ms: processingTime
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Civic Steward Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function getSystemPrompt(contentType: string): string {
  const baseRules = `
You are the Civic Steward for WanaIQ, Kenya's civic engagement platform.
Your role is to ensure content is safe, constructive, and factual.

CRITICAL RULES (Zero Tolerance):
1. Block any hate speech, tribal incitement, or calls for violence
2. Block any PII (phone numbers, ID numbers, addresses)
3. Block misinformation about voting or electoral processes
4. Flag pornographic or sexual content

QUALITY STANDARDS (Educational Feedback):
5. Political promises must have dates and specific commitments
6. Project reports must include location and photographic evidence
7. Posts must be constructive, not purely negative
8. Claims should be verifiable or clearly marked as opinion

OUTPUT FORMAT (JSON):
{
  "verdict": "APPROVED" | "NEEDS_REVISION" | "FLAGGED" | "BLOCKED",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation",
  "suggestions": ["Specific improvement 1", "..."],
  "categories": ["hate_speech", "pii", "unverifiable_claim", etc.]
}
`;

  const typeSpecific = {
    promise: `
For POLITICAL PROMISES:
- Require: Who (politician), What (specific action), When (timeline)
- Example GOOD: "Governor Sakaja will construct 10 boreholes in Kibera by Dec 2026"
- Example BAD: "The governor will improve water" (too vague)
`,
    project: `
For PROJECT REPORTS:
- Require: Location (ward/constituency), Current status, Evidence (photo)
- Flag projects without photos or specific locations
- Encourage before/after comparisons
`,
    post: `
For COMMUNITY POSTS:
- Encourage constructive criticism over pure complaints
- Require specific examples for claims
- Suggest actionable next steps
`
  };

  return baseRules + (typeSpecific[contentType] || typeSpecific.post);
}

function formatContent(content: any): string {
  return `
Title: ${content.title || 'N/A'}
Description: ${content.description}
Metadata: ${JSON.stringify(content.metadata || {})}
`.trim();
}
```

### 2.2 Function 2: civic-router (Agentic Routing)

**Purpose:** Intelligent issue routing to government departments  
**Milestone:** M2.1 (Week 3)  
**Triggers:** Action Hub issue submission

```typescript
// supabase/functions/civic-router/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Groq from 'https://esm.sh/groq-sdk@0.3.0';

interface RoutingRequest {
  issue_description: string;
  location: {
    lat: number;
    lng: number;
    ward?: string;
    constituency?: string;
    county?: string;
  };
  user_id: string;
  attachments?: string[]; // Photo URLs
}

interface RoutingResponse {
  department_slug: string;
  department_name: string;
  jurisdiction: 'ward' | 'constituency' | 'county' | 'national';
  issue_type: string;
  severity: number; // 1-10
  confidence: number; // 0.0-1.0
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

serve(async (req) => {
  try {
    const { issue_description, location, user_id, attachments }: RoutingRequest = 
      await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Groq config
    const { data: config } = await supabase
      .from('ai_configurations')
      .select('api_key')
      .eq('provider_slug', 'groq')
      .single();

    const groq = new Groq({ apiKey: config.api_key });

    // Few-shot classification prompt
    const systemPrompt = `
You are the Civic Router for WanaIQ. Analyze citizen issues and route them to 
the correct government department.

KENYA GOVERNMENT STRUCTURE:
- County Functions: Water, garbage, county roads, markets, county health facilities
- National Functions: National roads, security, national hospitals, education policy
- Ward Level: Bursaries (NG-CDF), local development projects

ISSUE CATEGORIES:
1. water - Burst pipes, water shortage, contamination
2. roads - Potholes, blocked roads, traffic lights (county vs national)
3. security - Crime, police response, lighting
4. health - Hospital services, ambulances, medicine shortage
5. education - School bursaries, school infrastructure
6. garbage - Waste collection, dumpsites, sanitation
7. corruption - Misuse of funds, bribery, project delays

SEVERITY SCALE (1-10):
1-3: Minor inconvenience (pothole, delayed garbage collection)
4-6: Moderate impact (water shortage affecting homes)
7-9: Major issue (health risk, security threat)
10: Emergency (life-threatening, widespread disaster)

OUTPUT (JSON):
{
  "issue_type": "water",
  "department_slug": "nairobi-water-sanitation",
  "department_name": "Nairobi City Water and Sanitation Company",
  "jurisdiction": "county",
  "severity": 7,
  "confidence": 0.95,
  "required_forms": [...],
  "estimated_resolution_days": 14,
  "contact_info": {...},
  "next_steps": [...]
}

FEW-SHOT EXAMPLES:

User: "There is a burst pipe on Kenyatta Road, water everywhere"
Assistant: {
  "issue_type": "water",
  "department_slug": "nairobi-water",
  "jurisdiction": "county",
  "severity": 8,
  "estimated_resolution_days": 3
}

User: "Potholes on Thika Superhighway near Kasarani"
Assistant: {
  "issue_type": "roads",
  "department_slug": "kenha",
  "jurisdiction": "national",
  "severity": 6,
  "estimated_resolution_days": 30
}

User: "My child needs a bursary for high school"
Assistant: {
  "issue_type": "education",
  "department_slug": "ngcdf-westlands",
  "jurisdiction": "constituency",
  "severity": 5,
  "estimated_resolution_days": 45
}
`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3-70b-8192', // Larger model for complex reasoning
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: formatRoutingQuery(issue_description, location, attachments)
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const routing: RoutingResponse = JSON.parse(
      completion.choices[0].message.content || '{}'
    );

    // Enrich with database lookup (department contact info)
    const enrichedRouting = await enrichRoutingData(supabase, routing, location);

    // Log for accuracy tracking
    await supabase.from('routing_logs').insert({
      user_id,
      issue_type: routing.issue_type,
      issue_description,
      location,
      department_slug: routing.department_slug,
      jurisdiction: routing.jurisdiction,
      severity: routing.severity,
      confidence: routing.confidence,
      required_forms: routing.required_forms,
      estimated_resolution_days: routing.estimated_resolution_days,
      ai_model: 'llama-3-70b-8192'
    });

    return new Response(JSON.stringify(enrichedRouting), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Civic Router Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

function formatRoutingQuery(
  description: string, 
  location: any, 
  attachments?: string[]
): string {
  return `
Issue Description: ${description}
Location: ${location.county}, ${location.constituency}, ${location.ward}
Coordinates: ${location.lat}, ${location.lng}
Has Photos: ${attachments && attachments.length > 0 ? 'Yes' : 'No'}
`.trim();
}

async function enrichRoutingData(
  supabase: any, 
  routing: RoutingResponse, 
  location: any
): Promise<RoutingResponse> {
  // Look up actual department contact info from database
  const { data: dept } = await supabase
    .from('government_departments')
    .select('*')
    .eq('slug', routing.department_slug)
    .single();

  if (dept) {
    routing.contact_info = {
      email: dept.email,
      phone: dept.phone,
      office_location: dept.address
    };
  }

  // Look up required forms
  const { data: forms } = await supabase
    .from('government_forms')
    .select('*')
    .contains('applicable_departments', [routing.department_slug]);

  if (forms) {
    routing.required_forms = forms.map(f => ({
      form_id: f.id,
      form_name: f.name,
      template_url: f.template_url
    }));
  }

  return routing;
}
```

### 2.3 Function 3: civic-brain (RAG Pipeline)

**Purpose:** Answer civic questions using verified documents  
**Milestone:** M2.2 (Week 4)  
**Triggers:** Civic Assistant chat

```typescript
// supabase/functions/civic-brain/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Groq from 'https://esm.sh/groq-sdk@0.3.0';

interface RAGRequest {
  query: string;
  user_id: string;
  session_id: string;
  language?: 'en' | 'sw'; // English or Swahili
  include_history?: boolean; // Use conversation context
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    document_id: string;
    title: string;
    article?: string;
    url?: string;
    similarity: number;
  }>;
  confidence: number;
  language: string;
}

serve(async (req) => {
  try {
    const { 
      query, 
      user_id, 
      session_id, 
      language = 'en',
      include_history = false 
    }: RAGRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Groq config
    const { data: config } = await supabase
      .from('ai_configurations')
      .select('api_key')
      .eq('provider_slug', 'groq')
      .single();

    const groq = new Groq({ apiKey: config.api_key });

    // STEP 1: Generate embedding for query
    const embeddingResponse = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: query
        })
      }
    );

    const { data: embeddings } = await embeddingResponse.json();
    const queryEmbedding = embeddings[0].embedding;

    // STEP 2: Vector similarity search
    const { data: matches, error: matchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5
      });

    if (matchError) throw matchError;

    // STEP 3: Build context from retrieved documents
    const context = matches
      .map((m, i) => `[Source ${i + 1}] ${m.metadata.source}\n${m.content}`)
      .join('\n\n---\n\n');

    // STEP 4: Optional - Get conversation history
    let conversationHistory = '';
    if (include_history) {
      const { data: history } = await supabase
        .from('rag_chat_history')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (history && history.length > 0) {
        conversationHistory = history
          .map(h => `${h.role}: ${h.content}`)
          .join('\n');
      }
    }

    // STEP 5: Generate answer with Groq
    const systemPrompt = `
You are the Civic Brain for WanaIQ, Kenya's civic education assistant.

CRITICAL RULES:
1. Answer ONLY using the provided sources - do not use external knowledge
2. If the sources don't contain the answer, say "I don't have information about that"
3. ALWAYS cite your sources using [Source X] notation
4. Keep answers clear and concise (max 3 paragraphs)
5. Use plain language suitable for citizens (8th-grade reading level)
6. If answering in Swahili, translate accurately

EXAMPLE GOOD ANSWER:
"According to the Constitution of Kenya 2010 [Source 1], every citizen has 
the right to accessible healthcare. County governments are responsible for 
providing county health facilities [Source 2]. You can access services at 
your nearest county hospital."

EXAMPLE BAD ANSWER:
"Healthcare is important for everyone." (No sources, too vague)
`;

    const userPrompt = `
${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ''}
Context from verified sources:
${context}

User Question: ${query}

Language: ${language === 'sw' ? 'Swahili' : 'English'}
`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4, // Slightly higher for natural language
      max_tokens: 800
    });

    const answer = completion.choices[0].message.content || '';

    // STEP 6: Format sources for citation
    const sources = matches.map((m, i) => ({
      document_id: m.id,
      title: m.metadata.source,
      article: m.metadata.article_number,
      url: m.metadata.url,
      similarity: m.similarity
    }));

    // STEP 7: Save conversation history
    await supabase.from('rag_chat_history').insert([
      {
        user_id,
        session_id,
        role: 'user',
        content: query
      },
      {
        user_id,
        session_id,
        role: 'assistant',
        content: answer,
        sources
      }
    ]);

    const response: RAGResponse = {
      answer,
      sources,
      confidence: calculateConfidence(matches),
      language
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Civic Brain Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

function calculateConfidence(matches: any[]): number {
  if (!matches || matches.length === 0) return 0;
  
  // Average similarity of top 3 results
  const avgSimilarity = matches
    .slice(0, 3)
    .reduce((sum, m) => sum + m.similarity, 0) / 3;
  
  return Math.round(avgSimilarity * 100) / 100;
}
```

## 3. Frontend: Unified AIClient Service

```typescript
// src/services/aiClient.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type GovernanceVerdict = 'APPROVED' | 'NEEDS_REVISION' | 'FLAGGED' | 'BLOCKED';

interface GovernanceResult {
  verdict: GovernanceVerdict;
  confidence: number;
  reason?: string;
  suggestions?: string[];
  categories?: string[];
}

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

interface RAGResult {
  answer: string;
  sources: Array<{
    document_id: string;
    title: string;
    article?: string;
    url?: string;
    similarity: number;
  }>;
  confidence: number;
  language: string;
}

/**
 * Unified AI Client for WanaIQ
 * 
 * Provides clean interface to three specialized AI services:
 * - governance: Content moderation
 * - routing: Issue routing to departments
 * - rag: Knowledge-based Q&A
 */
export const aiClient = {
  /**
   * Submit content for governance review
   * @param contentType - Type of content (post, promise, project)
   * @param content - Content object
   * @returns Moderation verdict with feedback
   */
  governance: async (
    contentType: 'post' | 'promise' | 'project' | 'comment',
    contentId: string,
    content: {
      title?: string;
      description: string;
      metadata?: any;
    }
  ): Promise<GovernanceResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('civic-steward', {
      body: {
        content_type: contentType,
        content_id: contentId,
        content,
        user_id: user.id
      }
    });

    if (error) throw error;
    return data as GovernanceResult;
  },

  /**
   * Route a civic issue to appropriate department
   * @param issueDescription - User's description of the problem
   * @param location - Geographic location data
   * @param attachments - Optional photo URLs
   * @returns Routing information with required forms
   */
  routing: async (
    issueDescription: string,
    location: {
      lat: number;
      lng: number;
      ward?: string;
      constituency?: string;
      county?: string;
    },
    attachments?: string[]
  ): Promise<RoutingResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('civic-router', {
      body: {
        issue_description: issueDescription,
        location,
        user_id: user.id,
        attachments
      }
    });

    if (error) throw error;
    return data as RoutingResult;
  },

  /**
   * Ask a civic question using RAG
   * @param query - User's question
   * @param sessionId - Chat session ID for context
   * @param language - Preferred language (en or sw)
   * @param includeHistory - Use conversation history
   * @returns Answer with source citations
   */
  rag: async (
    query: string,
    sessionId: string,
    language: 'en' | 'sw' = 'en',
    includeHistory: boolean = true
  ): Promise<RAGResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('civic-brain', {
      body: {
        query,
        user_id: user.id,
        session_id: sessionId,
        language,
        include_history: includeHistory
      }
    });

    if (error) throw error;
    return data as RAGResult;
  }
};
```

## 4. Usage Examples

### 4.1 Governance (Content Submission)

```typescript
// In your Post submission form
import { aiClient } from '@/services/aiClient';

async function handlePostSubmit(postData: PostFormData) {
  try {
    // Show loading state
    setSubmitting(true);

    // First: Submit to governance
    const governance = await aiClient.governance(
      'post',
      tempPostId,
      {
        title: postData.title,
        description: postData.description,
        metadata: { tags: postData.tags }
      }
    );

    if (governance.verdict === 'BLOCKED') {
      // Show error modal
      showError({
        title: 'Content Blocked',
        message: governance.reason,
        severity: 'error'
      });
      return;
    }

    if (governance.verdict === 'NEEDS_REVISION') {
      // Show suggestions modal
      showSuggestions({
        title: 'Improve Your Post',
        message: governance.reason,
        suggestions: governance.suggestions,
        onRevise: () => {
          // User can edit and resubmit
        }
      });
      return;
    }

    if (governance.verdict === 'FLAGGED') {
      // Allow submission but warn
      const confirmed = await confirmDialog({
        title: 'Content Flagged',
        message: governance.reason + '\n\nDo you still want to post?',
        confirmText: 'Post Anyway'
      });
      if (!confirmed) return;
    }

    // If APPROVED or user confirmed FLAGGED
    // Second: Actually create the post
    const { data: post } = await supabase
      .from('posts')
      .insert({
        ...postData,
        governance_verdict: governance.verdict,
        governance_confidence: governance.confidence
      })
      .select()
      .single();

    // Success!
    router.push(`/posts/${post.id}`);

  } catch (error) {
    console.error('Post submission error:', error);
    showError({ message: 'Failed to submit post' });
  } finally {
    setSubmitting(false);
  }
}
```

### 4.2 Routing (Issue Submission)

```typescript
// In your Action Hub issue reporting form
import { aiClient } from '@/services/aiClient';

async function handleIssueSubmit(issueData: IssueFormData) {
  try {
    setRouting(true);

    // Call civic router
    const routing = await aiClient.routing(
      issueData.description,
      {
        lat: issueData.location.lat,
        lng: issueData.location.lng,
        ward: issueData.ward,
        constituency: issueData.constituency,
        county: issueData.county
      },
      issueData.photos // Photo URLs
    );

    // Show routing result to user
    setRoutingResult({
      department: routing.department_name,
      severity: routing.severity,
      estimatedDays: routing.estimated_resolution_days,
      forms: routing.required_forms,
      contact: routing.contact_info,
      nextSteps: routing.next_steps
    });

    // Ask user to confirm
    const confirmed = await confirmDialog({
      title: `Route to ${routing.department_name}?`,
      message: `This issue will be sent to the ${routing.jurisdiction} level. 
                Estimated resolution: ${routing.estimated_resolution_days} days.`,
      severity: getSeverityLabel(routing.severity)
    });

    if (!confirmed) return;

    // Create the issue ticket
    const { data: ticket } = await supabase
      .from('civic_issues')
      .insert({
        ...issueData,
        department_slug: routing.department_slug,
        jurisdiction: routing.jurisdiction,
        severity: routing.severity,
        ai_routing_confidence: routing.confidence,
        estimated_resolution_days: routing.estimated_resolution_days
      })
      .select()
      .single();

    // Navigate to tracking page
    router.push(`/issues/${ticket.id}`);

  } catch (error) {
    console.error('Issue routing error:', error);
    showError({ message: 'Failed to route issue' });
  } finally {
    setRouting(false);
  }
}

function getSeverityLabel(severity: number): string {
  if (severity >= 8) return 'high';
  if (severity >= 5) return 'medium';
  return 'low';
}
```

### 4.3 RAG (Civic Assistant Chat)

```typescript
// In your Civic Assistant chat component
import { aiClient } from '@/services/aiClient';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function CivicAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(uuidv4()); // One session per chat
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [loading, setLoading] = useState(false);

  async function handleSendMessage(query: string) {
    try {
      // Add user message to UI
      const userMessage = {
        id: uuidv4(),
        role: 'user' as const,
        content: query,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      setLoading(true);

      // Call RAG
      const result = await aiClient.rag(
        query,
        sessionId,
        language,
        true // Include conversation history
      );

      // Add assistant response to UI
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: result.answer,
        sources: result.sources,
        confidence: result.confidence,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('RAG error:', error);
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="civic-assistant-chat">
      {/* Language toggle */}
      <div className="language-toggle">
        <button 
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'active' : ''}
        >
          English
        </button>
        <button 
          onClick={() => setLanguage('sw')}
          className={language === 'sw' ? 'active' : ''}
        >
          Kiswahili
        </button>
      </div>

      {/* Message list */}
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <p>{message.content}</p>
            
            {/* Show sources for assistant messages */}
            {message.role === 'assistant' && message.sources && (
              <div className="sources">
                <strong>Sources:</strong>
                {message.sources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    [{i + 1}] {source.title}
                    {source.article && ` - Article ${source.article}`}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="loading">Thinking...</div>}
      </div>

      {/* Input */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.query;
        handleSendMessage(input.value);
        input.value = '';
      }}>
        <input 
          name="query"
          placeholder={language === 'sw' ? 'Uliza swali...' : 'Ask a question...'}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {language === 'sw' ? 'Tuma' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

## 5. Implementation Timeline (8 Weeks)

### Week 1: Foundation (M1.1)
- [x] Database schema (all tables)
- [x] pgvector extension setup
- [x] Admin panel for API key management
- [x] Initial document ingestion (Constitution)

### Week 2: API Migration (M1.2)
- [x] Edge Functions scaffolding (all 3)
- [x] Groq SDK integration
- [x] Error handling & logging
- [x] Basic tests

### Week 3: Civic Router (M2.1)
- [ ] Complete `civic-router` function
- [ ] Department database setup
- [ ] Forms database setup
- [ ] Routing accuracy tests (100 cases)
- [ ] Frontend integration (Action Hub)

### Week 4: RAG Pipeline (M2.2)
- [ ] Complete `civic-brain` function
- [ ] Vector search optimization
- [ ] Document ingestion pipeline (500+ docs)
- [ ] Citation system
- [ ] Hallucination tests
- [ ] Frontend integration (Civic Assistant)

### Week 5: CivicClips AI (M2.3)
- [ ] Video transcription pipeline
- [ ] Sentiment analysis
- [ ] Auto-moderation (using `civic-steward`)
- [ ] Frontend integration

### Week 6: Gamification (M3.1)
- [ ] Points calculation logic
- [ ] Leaderboards
- [ ] Achievement system

### Week 7: Mobile Optimization (M3.2)
- [ ] PWA setup
- [ ] Offline support
- [ ] Push notifications
- [ ] Performance audit

### Week 8: Launch (M3.3)
- [ ] Production deployment
- [ ] Security audit
- [ ] Performance benchmarking
- [ ] Demo video
- [ ] Documentation

## 6. Cost Analysis

### Groq Pricing (Standard Plan)
- **Llama 3 8B:** $0.05 / 1M tokens (input), $0.10 / 1M tokens (output)
- **Llama 3 70B:** $0.59 / 1M tokens (input), $0.79 / 1M tokens (output)

### Estimated Monthly Usage (1000 active users)

| Service | Model | Monthly Requests | Avg Tokens | Cost |
|---------|-------|-----------------|------------|------|
| Governance | 8B | 5,000 | 500 in, 300 out | $0.28 |
| Routing | 70B | 2,000 | 800 in, 500 out | $1.73 |
| RAG | 8B | 10,000 | 600 in, 400 out | $0.70 |
| **Total** | | | | **$2.71** |

### Additional Costs
- OpenAI Embeddings (text-embedding-ada-002): ~$10/month
- Supabase Pro: $25/month
- AWS Lambda: ~$5/month
- **Grand Total: ~$43/month** ✅ (vs $500-1000 for always-on GPUs)

## 7. Testing Strategy

### Governance Tests
```typescript
// tests/civic-steward.test.ts

describe('Civic Steward Governance', () => {
  it('should BLOCK hate speech', async () => {
    const result = await aiClient.governance('post', 'test-1', {
      description: 'Those [tribe] people are...' // Hate speech
    });
    expect(result.verdict).toBe('BLOCKED');
    expect(result.categories).toContain('hate_speech');
  });

  it('should FLAG unverifiable claims', async () => {
    const result = await aiClient.governance('promise', 'test-2', {
      title: 'Governor will build roads',
      description: 'The governor promised to build roads' // Too vague
    });
    expect(result.verdict).toBe('NEEDS_REVISION');
    expect(result.suggestions).toBeDefined();
  });

  it('should APPROVE good content', async () => {
    const result = await aiClient.governance('post', 'test-3', {
      title: 'Community cleanup success',
      description: 'We cleaned Uhuru Park on May 15, 2026. 50 volunteers participated.'
    });
    expect(result.verdict).toBe('APPROVED');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

### Routing Tests
```typescript
// tests/civic-router.test.ts

describe('Civic Router Accuracy', () => {
  const testCases = [
    {
      description: 'Burst pipe on Kenyatta Road',
      location: { county: 'Nairobi', ward: 'Kilimani' },
      expected: {
        issue_type: 'water',
        jurisdiction: 'county',
        severity: { min: 7, max: 9 }
      }
    },
    {
      description: 'Need bursary for university',
      location: { constituency: 'Westlands' },
      expected: {
        issue_type: 'education',
        jurisdiction: 'constituency',
        department_slug: 'ngcdf-westlands'
      }
    }
    // ... 100 test cases
  ];

  testCases.forEach((testCase, i) => {
    it(`should route case ${i + 1} correctly`, async () => {
      const result = await aiClient.routing(
        testCase.description,
        testCase.location
      );
      
      expect(result.issue_type).toBe(testCase.expected.issue_type);
      expect(result.jurisdiction).toBe(testCase.expected.jurisdiction);
      
      if (testCase.expected.severity) {
        expect(result.severity).toBeGreaterThanOrEqual(testCase.expected.severity.min);
        expect(result.severity).toBeLessThanOrEqual(testCase.expected.severity.max);
      }
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });
});
```

### RAG Tests
```typescript
// tests/civic-brain.test.ts

describe('Civic Brain RAG Pipeline', () => {
  const knowledgeTests = [
    {
      query: 'What are the functions of county government?',
      expected_keywords: ['health', 'agriculture', 'transport'],
      expected_source: 'Constitution of Kenya 2010'
    },
    {
      query: 'How do I apply for NG-CDF bursary?',
      expected_keywords: ['application', 'constituency', 'committee'],
      expected_source: 'NG-CDF Act'
    }
    // ... 50 test cases
  ];

  knowledgeTests.forEach((test) => {
    it(`should answer: "${test.query}"`, async () => {
      const result = await aiClient.rag(test.query, 'test-session');
      
      // Check keywords present
      test.expected_keywords.forEach(keyword => {
        expect(result.answer.toLowerCase()).toContain(keyword);
      });
      
      // Check source citation
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      
      const hasCorrectSource = result.sources.some(
        s => s.title.includes(test.expected_source)
      );
      expect(hasCorrectSource).toBe(true);
      
      // Check confidence
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });
});
```

## 8. Monitoring & Analytics

### Performance Metrics

```typescript
// Add to each Edge Function
async function logMetrics(functionName: string, duration: number, success: boolean) {
  await supabase.from('ai_metrics').insert({
    function_name: functionName,
    duration_ms: duration,
    success,
    timestamp: new Date().toISOString()
  });
}

// Usage
const startTime = Date.now();
try {
  // ... function logic
  await logMetrics('civic-router', Date.now() - startTime, true);
} catch (error) {
  await logMetrics('civic-router', Date.now() - startTime, false);
  throw error;
}
```

### Daily Dashboard Queries

```sql
-- Governance verdicts distribution
SELECT 
  verdict,
  COUNT(*) as count,
  AVG(ai_confidence) as avg_confidence
FROM moderation_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY verdict;

-- Routing accuracy (based on user ratings)
SELECT 
  issue_type,
  AVG(user_rating) as avg_rating,
  AVG(confidence) as avg_confidence,
  COUNT(*) as total_routes
FROM routing_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND user_rating IS NOT NULL
GROUP BY issue_type;

-- RAG performance
SELECT 
  AVG(LENGTH(answer)) as avg_answer_length,
  AVG(array_length(sources, 1)) as avg_sources_cited,
  COUNT(DISTINCT session_id) as unique_sessions
FROM rag_chat_history
WHERE role = 'assistant'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## 9. Security Checklist

- [ ] API keys stored in `ai_configurations` with RLS
- [ ] Never expose API keys to frontend
- [ ] All Edge Functions use `service_role` key
- [ ] Input validation on all requests
- [ ] Rate limiting (100 req/min per user)
- [ ] Content sanitization before storage
- [ ] Audit logs for all AI decisions
- [ ] HTTPS only
- [ ] CORS properly configured

## 10. Next Steps

1. **Review this document** with your team/mentor
2. **Set up database schema** (Week 1)
3. **Configure Groq API** in admin panel
4. **Scaffold Edge Functions** (Week 2)
5. **Implement in order:** Governance → Routing → RAG
6. **Test rigorously** at each milestone
7. **Deploy incrementally** (don't wait for all features)

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Status:** Ready for Implementation  
**Architecture:** ✅ Hybrid (Approved)

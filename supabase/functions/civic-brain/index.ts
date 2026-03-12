import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUserContext } from "../_shared/userContext.ts";
import { buildPersonalizedPrompt } from "../_shared/promptBuilder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RAGRequest {
  query: string;
  session_id: string;
  language?: "en" | "sw";
  include_history?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      query,
      session_id,
      language = "en",
      include_history = true,
    }: RAGRequest = await req.json();

    // Validation
    if (!query || !session_id) {
      return new Response(
        JSON.stringify({ error: "query and session_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (typeof query !== "string" || query.length > 2000) {
      return new Response(
        JSON.stringify({ error: "query must be a string under 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session_id)) {
      return new Response(
        JSON.stringify({ error: "session_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (language && !["en", "sw"].includes(language)) {
      return new Response(
        JSON.stringify({ error: "language must be 'en' or 'sw'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const openAIKey = Deno.env.get("OPENAI_API_KEY");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth validation
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Gather user context for personalization
    console.log(`[civic-brain] Gathering context for user ${userId}...`);
    let userContext;
    try {
      userContext = await getUserContext(serviceClient, userId);
      console.log(`[civic-brain] Context: ${userContext.name} (${userContext.role}) from ${userContext.location.county}`);
    } catch (e) {
      console.warn("[civic-brain] Failed to get user context:", e);
      userContext = {
        userId,
        name: "Citizen",
        role: "citizen",
        verifiedRole: false,
        location: { county: "Kenya" },
        interests: [],
        expertiseAreas: [],
        preferredLanguage: "en",
        activity: {
          issuesReportedRecently: 0,
          issueTypesReported: [],
          promisesTracked: 0,
          postsCreated: 0,
          commentsCreated: 0,
          followingPoliticians: [],
        },
        engagementScore: 0,
        totalContributions: 0,
        lastActive: new Date(),
      };
    }

    // STEP 2: Vector search (with FTS fallback)
    let matches: Array<{ id: string; content: string; metadata: Record<string, unknown>; similarity: number }> = [];

    if (openAIKey) {
      try {
        // Generate embedding with OpenAI
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-ada-002",
            input: query,
          }),
        });

        if (embeddingResponse.ok) {
          const { data: embeddings } = await embeddingResponse.json();
          const embedding = embeddings[0].embedding;

          // Vector search
          const { data: vectorMatches, error: vecError } = await serviceClient.rpc(
            "match_documents",
            {
              query_embedding: embedding,
              match_threshold: 0.7,
              match_count: 5,
            }
          );

          if (!vecError && vectorMatches?.length > 0) {
            matches = vectorMatches.map((m: any) => ({
              id: m.id,
              content: m.content,
              metadata: m.metadata || {},
              similarity: m.similarity,
            }));
            console.log(`[civic-brain] Vector search: ${matches.length} matches`);
          }
        } else {
          console.warn("[civic-brain] OpenAI embedding failed, falling back to FTS");
        }
      } catch (e) {
        console.warn("[civic-brain] Vector search error:", e);
      }
    }

    // FTS fallback if no vector matches
    if (matches.length === 0) {
      console.log("[civic-brain] Using FTS fallback...");
      const { data: ftsMatches, error: ftsError } = await serviceClient.rpc(
        "match_documents_fts",
        { search_query: query, match_count: 5 }
      );
      if (!ftsError && ftsMatches?.length > 0) {
        matches = ftsMatches.map((m: any) => ({
          id: m.id,
          content: m.content,
          metadata: m.metadata || {},
          similarity: m.similarity,
        }));
        console.log(`[civic-brain] FTS fallback: ${matches.length} matches`);
      }
    }

    // Location boost for user's county
    if (matches.length > 0 && userContext.location.county) {
      matches = matches.map((match) => {
        const location = (match.metadata?.location as string) || "";
        if (location.toLowerCase().includes(userContext.location.county.toLowerCase())) {
          return { ...match, similarity: Math.min(match.similarity * 1.15, 1.0) };
        }
        return match;
      }).sort((a, b) => b.similarity - a.similarity);
    }

    // STEP 3: Build RAG context
    const ragContext = matches.length > 0
      ? matches.map((m, i) => `[Source ${i + 1}] ${(m.metadata?.source as string) || "Document"}\n${m.content}`).join("\n\n---\n\n")
      : "No specific documents found. Answer based on general civic knowledge about Kenya.";

    // STEP 4: Get conversation history
    let conversationHistory = "";
    if (include_history) {
      const { data: history } = await serviceClient
        .from("rag_chat_history")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (history?.length) {
        conversationHistory = history
          .reverse()
          .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
          .join("\n");
      }
    }

    // STEP 5: Build personalized system prompt
    const basePrompt = `
You are the Civic Brain for WanaIQ, Kenya's civic engagement platform.

CRITICAL RULES:
1. Answer using the provided RAG sources when available - cite them with [Source X]
2. If sources don't contain the answer, use general Kenyan civic knowledge but indicate this
3. Respond in exactly one concise paragraph (3-5 sentences), no lists or headings
4. Stay strictly on-topic; do not add unrelated personalization
5. Be objective and nonpartisan
6. Use ${language === "sw" ? "Kiswahili" : "English"}
`.trim();

    const personalizedPrompt = buildPersonalizedPrompt(userContext, basePrompt);

    // STEP 6: Build messages for LLM
    const userMessage = `
${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ""}
Verified Information Sources:
${ragContext}

Current Question: ${query}
`.trim();

    // STEP 7: Stream from Lovable AI Gateway
    console.log("[civic-brain] Calling Lovable AI Gateway (streaming)...");
    const llmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: personalizedPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 800,
        stream: true,
      }),
    });

    if (!llmResponse.ok) {
      if (llmResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (llmResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await llmResponse.text();
      console.error("[civic-brain] LLM error:", llmResponse.status, errText);
      throw new Error(`LLM request failed: ${llmResponse.status}`);
    }

    // Create a TransformStream to capture the full answer while streaming
    let fullAnswer = "";
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        // Parse SSE to extract content for saving
        const text = new TextDecoder().decode(chunk);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullAnswer += content;
            } catch { /* ignore parse errors */ }
          }
        }
      },
    });

    // Pipe the LLM response through our transform
    llmResponse.body?.pipeTo(writable).then(async () => {
      // Save to history after stream completes
      const sources = matches.map((m, i) => ({
        document_id: m.id,
        title: (m.metadata?.source as string) || `Source ${i + 1}`,
        article: m.metadata?.article_number,
        url: m.metadata?.url,
        similarity: m.similarity,
        is_local: ((m.metadata?.location as string) || "").includes(userContext.location.county),
      }));

      try {
        await serviceClient.from("rag_chat_history").insert([
          { user_id: userId, session_id, role: "user", content: query },
          { user_id: userId, session_id, role: "assistant", content: fullAnswer, sources },
        ]);
        console.log(`[civic-brain] Saved history (${fullAnswer.length} chars)`);
      } catch (e) {
        console.warn("[civic-brain] Failed to save history:", e);
      }

      // Update last activity (fire and forget)
      serviceClient
        .from("profiles")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", userId)
        .then(() => {});
    });

    const processingTime = Date.now() - startTime;
    console.log(`[civic-brain] Streaming response (${processingTime}ms to first byte)`);

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Processing-Time": String(processingTime),
        "X-Sources-Count": String(matches.length),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[civic-brain] Error:", message);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

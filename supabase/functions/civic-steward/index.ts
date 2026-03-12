import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      console.error("JWT validation error:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { content_type, content } = await req.json();

    if (!content_type || !content) {
      return new Response(JSON.stringify({ error: "content_type and content are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof content !== "string" || content.length > 10000) {
      return new Response(JSON.stringify({ error: "Content must be a string under 10000 chars" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();

    const systemPrompt = `You are a civic content moderator for a Kenyan democratic platform called WanaIQ. 
Evaluate the following ${content_type} for:
1. Hate speech, ethnic incitement, or tribal discrimination (ZERO TOLERANCE)
2. Personal Identifiable Information (PII) like phone numbers, ID numbers
3. Quality: If it's a promise, it should include a timeline/date
4. Misinformation or unverifiable claims presented as facts

Respond ONLY with valid JSON:
{
  "verdict": "APPROVED" | "NEEDS_REVISION" | "BLOCKED",
  "reason": "Brief explanation",
  "confidence": 0.0 to 1.0,
  "flags": ["hate_speech" | "pii" | "low_quality" | "misinformation"]
}`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Content type: ${content_type}\n\nContent:\n${content}` },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      throw new Error(`Groq API error [${groqResponse.status}]: ${errBody}`);
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(rawContent);

    const processingTime = Date.now() - startTime;

    // Log to moderation_logs using service role
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await serviceClient.from("moderation_logs").insert({
      user_id: userId,
      content_type,
      content_preview: content.substring(0, 200),
      verdict: result.verdict || "APPROVED",
      reason: result.reason || null,
      ai_confidence: result.confidence || null,
      model_used: "llama-3.1-8b-instant",
      processing_time_ms: processingTime,
    });

    return new Response(JSON.stringify({
      verdict: result.verdict || "APPROVED",
      reason: result.reason || "Content reviewed",
      confidence: result.confidence || 0.5,
      flags: result.flags || [],
      processing_time_ms: processingTime,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("civic-steward error:", message);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

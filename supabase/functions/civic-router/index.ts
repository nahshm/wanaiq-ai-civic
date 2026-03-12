import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GovernmentInstitution {
  id: string;
  name: string;
  acronym: string | null;
  institution_type: string;
  jurisdiction_type: string;
  jurisdiction_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  physical_address: string | null;
  website: string | null;
}

interface RoutingResult {
  institution_id: string | null;
  institution_name: string;
  institution_acronym: string | null;
  institution_type: string;
  institution_website: string | null;
  institution_email: string | null;
  institution_phone: string | null;
  institution_address: string | null;
  issue_type: string;
  department_slug: string;
  jurisdiction: string;
  severity: number;
  confidence: number;
  recommended_actions: string[];
  formal_letter: string;
  processing_time_ms: number;
}

function normalizeLocation(location: unknown): string | null {
  if (!location) return null;
  if (typeof location === "string") {
    const trimmed = location.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof location === "object") {
    const loc = location as Record<string, unknown>;
    const parts = [loc.text, loc.ward, loc.constituency, loc.county]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function buildFallbackLetter(
  issueDescription: string,
  location: string | null,
  institutionName: string,
  institutionAcronym: string | null,
  institutionAddress: string | null,
  recommendedActions: string[],
  severity: number
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
  const refNum = `WC/${now.getFullYear()}/${Math.floor(Math.random() * 90000) + 10000}`;
  const acronym = institutionAcronym ? `(${institutionAcronym})` : "";
  const actions = recommendedActions.length > 0
    ? recommendedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")
    : "1. Conduct an immediate inspection\n2. Provide a written response with timeline";

  return `REF: ${refNum}
Date: ${dateStr}

The ${institutionName} ${acronym}
${institutionAddress || "[Institution Address]"}

Dear Sir/Madam,

RE: FORMAL COMPLAINT — CIVIC ISSUE REPORT ${location ? `(${location.toUpperCase()})` : ""}

I write to formally bring to your attention a civic matter of ${severity >= 7 ? "critical urgency" : severity >= 4 ? "significant concern" : "concern"} that requires your office's immediate attention.

The issue pertains to: ${issueDescription}

${location ? `The matter is located at/in ${location} and directly affects residents under your mandate.` : "The matter directly affects residents under your jurisdiction."}

I respectfully request that your office:
${actions}

I trust this matter will be accorded the urgency it deserves. Kindly acknowledge receipt within 7 working days and provide a timeline for resolution under Article 35 of the Constitution of Kenya 2010.

Yours faithfully,

[Complainant Name]
[Contact Information]

---
Reference: ${refNum} | Generated via WanaIQ Civic Platform`;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const body = await req.json();
    const issueDescription = body?.issue_description;
    const locationText = normalizeLocation(body?.location);

    if (!issueDescription) {
      return new Response(JSON.stringify({ error: "issue_description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof issueDescription !== "string" || issueDescription.length > 5000) {
      return new Response(JSON.stringify({ error: "issue_description must be under 5000 chars" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Fetch government institutions
    const { data: institutions, error: instError } = await serviceClient
      .from("government_institutions")
      .select("id, name, acronym, institution_type, jurisdiction_type, jurisdiction_name, contact_email, contact_phone, physical_address, website")
      .eq("is_active", true)
      .eq("country_code", "KE")
      .order("institution_type")
      .limit(40);

    if (instError) {
      console.error("[civic-router] Failed to fetch institutions:", instError.message);
    }

    const institutionList: GovernmentInstitution[] = institutions || [];
    const institutionContext = institutionList.length > 0
      ? institutionList.map((i) => `- ${i.id}|${i.name}${i.acronym ? ` (${i.acronym})` : ""}|${i.institution_type}|${i.jurisdiction_type}`).join("\n")
      : "No institutions available — use best judgment.";

    // STEP 2: Call Lovable AI Gateway with tool calling for structured routing
    console.log("[civic-router] Calling Lovable AI Gateway...");
    const routingResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a civic issue routing AI for Kenya. Route issues to the most appropriate government institution.

AVAILABLE INSTITUTIONS:
${institutionContext}

ROUTING RULES:
- Water/sewerage → county water company or Ministry of Water
- Roads → KeNHA (national highways), KURA (urban), county government (county roads)
- Electricity → Kenya Power (KPLC)
- Health → county health dept or Ministry of Health
- Land → National Land Commission or Ministry of Lands
- Environment → NEMA or Ministry of Environment
- Prefer local/specific institutions when location is provided`,
          },
          {
            role: "user",
            content: `Route this issue:\nIssue: ${issueDescription}${locationText ? `\nLocation: ${locationText}` : ""}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "route_issue",
              description: "Route a civic issue to the appropriate government institution",
              parameters: {
                type: "object",
                properties: {
                  institution_id: { type: "string", description: "UUID from institution list, or null" },
                  institution_name: { type: "string", description: "Full name of institution" },
                  institution_acronym: { type: "string", description: "Acronym if any" },
                  issue_type: {
                    type: "string",
                    enum: ["water", "roads", "health", "education", "security", "land", "agriculture", "environment", "energy", "administration", "other"],
                  },
                  department_slug: { type: "string", description: "Kebab-case department identifier" },
                  jurisdiction: { type: "string", enum: ["national", "county", "constituency", "ward"] },
                  severity: { type: "number", description: "1-10 scale" },
                  confidence: { type: "number", description: "0.0-1.0 confidence score" },
                  recommended_actions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 recommended actions",
                  },
                },
                required: ["institution_name", "issue_type", "department_slug", "jurisdiction", "severity", "confidence", "recommended_actions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "route_issue" } },
        temperature: 0.1,
        max_tokens: 600,
      }),
    });

    if (!routingResponse.ok) {
      if (routingResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (routingResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errBody = await routingResponse.text();
      console.error("[civic-router] LLM error:", routingResponse.status, errBody);
      throw new Error(`LLM routing failed: ${routingResponse.status}`);
    }

    const routingData = await routingResponse.json();
    const toolCall = routingData.choices?.[0]?.message?.tool_calls?.[0];
    let routingResult: Record<string, unknown> = {};

    if (toolCall?.function?.arguments) {
      try {
        routingResult = JSON.parse(toolCall.function.arguments);
      } catch {
        console.warn("[civic-router] Failed to parse tool response");
      }
    }

    // Resolve matched institution
    const matchedInstitutionId = routingResult.institution_id as string | null;
    let matchedInstitution: GovernmentInstitution | null = null;

    if (matchedInstitutionId) {
      matchedInstitution = institutionList.find((i) => i.id === matchedInstitutionId) || null;
    }
    if (!matchedInstitution && routingResult.institution_name) {
      const aiName = (routingResult.institution_name as string).toLowerCase();
      matchedInstitution = institutionList.find(
        (i) => i.name.toLowerCase().includes(aiName) || aiName.includes(i.name.toLowerCase())
      ) || null;
    }

    const institutionName = matchedInstitution?.name || (routingResult.institution_name as string) || "Relevant Government Authority";
    const institutionAcronym = matchedInstitution?.acronym || (routingResult.institution_acronym as string) || null;
    const recommendedActions = (routingResult.recommended_actions as string[]) || [];
    const severity = Number(routingResult.severity) || 5;

    // STEP 3: Generate formal letter
    console.log("[civic-router] Generating formal letter...");
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
    const refNum = `WC/${now.getFullYear()}/${Math.floor(Math.random() * 90000) + 10000}`;

    let formalLetter = "";
    try {
      const letterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Draft a formal complaint letter to a Kenyan government institution. Use plain text, no markdown.

Structure:
REF: ${refNum}
Date: ${dateStr}

The [Title],
${institutionName}${institutionAcronym ? ` (${institutionAcronym})` : ""}
${matchedInstitution?.physical_address || "[Address]"}

Dear Sir/Madam,

RE: FORMAL COMPLAINT — [SUBJECT IN CAPS]

[3 paragraphs: nature of issue, impact, requested actions]

Closing with Article 35 reference.

Yours faithfully,
[Complainant details]

Reference: ${refNum} | WanaIQ Civic Platform`,
            },
            {
              role: "user",
              content: `Write complaint letter:
Issue: ${issueDescription}
${locationText ? `Location: ${locationText}` : ""}
Severity: ${severity}/10
Actions: ${recommendedActions.join(", ")}
To: ${institutionName}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (letterResponse.ok) {
        const letterData = await letterResponse.json();
        formalLetter = letterData.choices?.[0]?.message?.content?.trim() || "";
      }
    } catch (e) {
      console.warn("[civic-router] Letter generation error:", e);
    }

    if (!formalLetter) {
      formalLetter = buildFallbackLetter(
        issueDescription,
        locationText,
        institutionName,
        institutionAcronym,
        matchedInstitution?.physical_address || null,
        recommendedActions,
        severity
      );
    }

    const processingTime = Date.now() - startTime;

    // STEP 4: Log routing
    await serviceClient.from("routing_logs").insert({
      user_id: userId,
      issue_description: issueDescription.substring(0, 500),
      location: locationText,
      issue_type: routingResult.issue_type || null,
      department_slug: routingResult.department_slug || null,
      department_name: institutionName,
      severity,
      confidence: routingResult.confidence || null,
      recommended_actions: recommendedActions,
      model_used: "gemini-3-flash-preview",
      processing_time_ms: processingTime,
    }).then(({ error }) => {
      if (error) console.warn("[civic-router] Log insert failed:", error.message);
    });

    const result: RoutingResult = {
      institution_id: matchedInstitution?.id || null,
      institution_name: institutionName,
      institution_acronym: institutionAcronym,
      institution_type: matchedInstitution?.institution_type || (routingResult.issue_type as string) || "unknown",
      institution_website: matchedInstitution?.website || null,
      institution_email: matchedInstitution?.contact_email || null,
      institution_phone: matchedInstitution?.contact_phone || null,
      institution_address: matchedInstitution?.physical_address || null,
      issue_type: (routingResult.issue_type as string) || "other",
      department_slug: (routingResult.department_slug as string) || "unknown",
      jurisdiction: (routingResult.jurisdiction as string) || "county",
      severity,
      confidence: Number(routingResult.confidence) || 0.5,
      recommended_actions: recommendedActions,
      formal_letter: formalLetter,
      processing_time_ms: processingTime,
    };

    console.log(`[civic-router] Completed in ${processingTime}ms`);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[civic-router] Error:", message);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

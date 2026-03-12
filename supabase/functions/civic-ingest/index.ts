import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IngestRequest {
  // Either provide a storage path (file already in Supabase Storage)
  storage_path?: string;
  // Or provide raw text content directly
  content?: string;
  // Document metadata
  title: string;
  source_type: string;
  metadata?: Record<string, unknown>;
}

// Simple text chunking with overlap
function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  // Clean up text
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  while (start < cleanText.length) {
    let end = start + chunkSize;
    
    // Try to break at paragraph or sentence boundary
    if (end < cleanText.length) {
      // Look for paragraph break
      const paragraphBreak = cleanText.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + chunkSize / 2) {
        end = paragraphBreak;
      } else {
        // Look for sentence break
        const sentenceBreak = cleanText.lastIndexOf(". ", end);
        if (sentenceBreak > start + chunkSize / 2) {
          end = sentenceBreak + 1;
        }
      }
    }

    const chunk = cleanText.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start < 0) start = 0;
    if (start >= cleanText.length) break;
  }

  return chunks;
}

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAIKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
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

    // Check admin role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasAdminRole } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const { data: hasSuperAdminRole } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "super_admin",
    });

    if (!hasAdminRole && !hasSuperAdminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: IngestRequest = await req.json();
    const { storage_path, content, title, source_type, metadata = {} } = body;

    if (!title || !source_type) {
      return new Response(
        JSON.stringify({ error: "title and source_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!storage_path && !content) {
      return new Response(
        JSON.stringify({ error: "Either storage_path or content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let textContent = content || "";

    // If storage_path provided, download and extract text
    if (storage_path && !content) {
      console.log(`[civic-ingest] Downloading from storage: ${storage_path}`);
      
      const { data: fileData, error: downloadError } = await serviceClient.storage
        .from("documents")
        .download(storage_path);

      if (downloadError || !fileData) {
        return new Response(
          JSON.stringify({ error: `Failed to download file: ${downloadError?.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For now, handle text files directly
      // PDF parsing would require a separate library
      const fileName = storage_path.toLowerCase();
      if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        textContent = await fileData.text();
      } else if (fileName.endsWith(".pdf")) {
        // For PDFs, we'd need pdf-parse or similar
        // For now, return an error suggesting to use the content field
        return new Response(
          JSON.stringify({ 
            error: "PDF parsing not yet implemented. Please extract text and use the 'content' field, or upload a .txt/.md file." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Try to read as text
        try {
          textContent = await fileData.text();
        } catch {
          return new Response(
            JSON.stringify({ error: "Unsupported file format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!textContent.trim()) {
      return new Response(
        JSON.stringify({ error: "No text content to process" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chunk the text
    console.log(`[civic-ingest] Chunking ${textContent.length} chars...`);
    const chunks = chunkText(textContent);
    console.log(`[civic-ingest] Created ${chunks.length} chunks`);

    // Generate embeddings and insert
    const results = {
      total_chunks: chunks.length,
      inserted: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Generate embedding
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-ada-002",
            input: chunk,
          }),
        });

        if (!embeddingResponse.ok) {
          const errText = await embeddingResponse.text();
          throw new Error(`Embedding API error: ${errText}`);
        }

        const { data: embeddings } = await embeddingResponse.json();
        const embedding = embeddings[0].embedding;

        // Insert into vectors table
        const { error: insertError } = await serviceClient.from("vectors").insert({
          content: chunk,
          embedding,
          source_type,
          title: `${title} (Part ${i + 1}/${chunks.length})`,
          metadata: {
            ...metadata,
            source: title,
            chunk_index: i,
            total_chunks: chunks.length,
            ingested_by: user.id,
            ingested_at: new Date().toISOString(),
          },
        });

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`);
        }

        results.inserted++;
        console.log(`[civic-ingest] Inserted chunk ${i + 1}/${chunks.length}`);

        // Small delay to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (e) {
        results.failed++;
        results.errors.push(`Chunk ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
        console.error(`[civic-ingest] Chunk ${i + 1} failed:`, e);
      }
    }

    console.log(`[civic-ingest] Complete: ${results.inserted}/${results.total_chunks} chunks inserted`);

    return new Response(JSON.stringify({
      success: results.failed === 0,
      message: `Ingested ${results.inserted} of ${results.total_chunks} chunks`,
      ...results,
    }), {
      status: results.failed === 0 ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[civic-ingest] Error:", message);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

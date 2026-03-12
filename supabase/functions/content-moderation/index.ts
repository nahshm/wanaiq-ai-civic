import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  content: string;
  type: 'post' | 'comment';
  author_id: string;
}

interface ModerationResult {
  is_safe: boolean;
  confidence: number;
  flags: string[];
  suggested_action: 'approve' | 'review' | 'reject';
}

// Input validation
function validateInput(data: unknown): { valid: true; data: ModerationRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { content, type, author_id } = data as Record<string, unknown>;

  if (typeof content !== 'string' || content.length === 0) {
    return { valid: false, error: 'Content must be a non-empty string' };
  }

  if (content.length > 50000) {
    return { valid: false, error: 'Content exceeds maximum length of 50000 characters' };
  }

  if (type !== 'post' && type !== 'comment') {
    return { valid: false, error: 'Type must be "post" or "comment"' };
  }

  if (typeof author_id !== 'string' || !isValidUUID(author_id)) {
    return { valid: false, error: 'author_id must be a valid UUID' };
  }

  return { valid: true, data: { content, type, author_id } };
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate Content-Type
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT token
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, type, author_id } = validation.data;

    // Verify the author_id matches the authenticated user (or user is admin)
    if (author_id !== userId) {
      // Check if user is admin for elevated permissions
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: userRole } = await supabaseService
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!userRole) {
        return new Response(
          JSON.stringify({ error: 'author_id must match authenticated user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Simple content moderation logic
    const result = await moderateContent(content, type);

    // Log moderation result
    console.log(`Moderation result for ${type} by user ${userId}:`, result);

    // If content is flagged, store it for review using service role
    if (!result.is_safe) {
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseService
        .from('moderation_logs')
        .insert({
          content: content.slice(0, 10000), // Limit stored content
          content_type: type,
          author_id,
          moderation_result: result,
          status: 'flagged'
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content moderation:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to moderate content',
        is_safe: true, // Default to safe if moderation fails
        confidence: 0,
        flags: [],
        suggested_action: 'review'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function moderateContent(content: string, type: string): Promise<ModerationResult> {
  const flags: string[] = [];
  const confidence = 0.8;
  
  // Basic keyword filtering
  const inappropriateWords = [
    'hate', 'violence', 'spam', 'scam', 'fake news',
    // Add more inappropriate words specific to Kenyan context
  ];
  
  const lowercaseContent = content.toLowerCase();
  
  // Check for inappropriate content
  for (const word of inappropriateWords) {
    if (lowercaseContent.includes(word)) {
      flags.push(`inappropriate_language: ${word}`);
    }
  }
  
  // Check for excessive caps (might indicate shouting/spam)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 50) {
    flags.push('excessive_caps');
  }
  
  // Check for very short content that might be spam
  if (type === 'post' && content.trim().length < 10) {
    flags.push('too_short');
  }
  
  // Check for repeated characters (spam indicator)
  if (/(.)\1{4,}/.test(content)) {
    flags.push('repeated_characters');
  }
  
  // Determine if content is safe
  const is_safe = flags.length === 0;
  
  // Suggest action based on flags
  let suggested_action: 'approve' | 'review' | 'reject' = 'approve';
  if (flags.length > 0) {
    if (flags.some(flag => flag.includes('inappropriate_language'))) {
      suggested_action = flags.length > 2 ? 'reject' : 'review';
    } else {
      suggested_action = 'review';
    }
  }
  
  return {
    is_safe,
    confidence,
    flags,
    suggested_action
  };
}

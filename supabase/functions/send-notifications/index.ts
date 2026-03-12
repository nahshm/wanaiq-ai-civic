import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'post_comment' | 'post_vote' | 'promise_update' | 'community_invite';
  recipient_id: string;
  sender_id?: string;
  post_id?: string;
  promise_id?: string;
  community_id?: string;
  message: string;
}

const VALID_NOTIFICATION_TYPES = ['post_comment', 'post_vote', 'promise_update', 'community_invite'] as const;

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateInput(data: unknown): { valid: true; data: NotificationRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { type, recipient_id, sender_id, post_id, promise_id, community_id, message } = data as Record<string, unknown>;

  // Validate type
  if (!type || !VALID_NOTIFICATION_TYPES.includes(type as typeof VALID_NOTIFICATION_TYPES[number])) {
    return { valid: false, error: `Type must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}` };
  }

  // Validate recipient_id
  if (typeof recipient_id !== 'string' || !isValidUUID(recipient_id)) {
    return { valid: false, error: 'recipient_id must be a valid UUID' };
  }

  // Validate optional UUIDs
  if (sender_id !== undefined && (typeof sender_id !== 'string' || !isValidUUID(sender_id))) {
    return { valid: false, error: 'sender_id must be a valid UUID' };
  }

  if (post_id !== undefined && (typeof post_id !== 'string' || !isValidUUID(post_id))) {
    return { valid: false, error: 'post_id must be a valid UUID' };
  }

  if (promise_id !== undefined && (typeof promise_id !== 'string' || !isValidUUID(promise_id))) {
    return { valid: false, error: 'promise_id must be a valid UUID' };
  }

  if (community_id !== undefined && (typeof community_id !== 'string' || !isValidUUID(community_id))) {
    return { valid: false, error: 'community_id must be a valid UUID' };
  }

  // Validate message
  if (typeof message !== 'string' || message.length === 0) {
    return { valid: false, error: 'message must be a non-empty string' };
  }

  if (message.length > 500) {
    return { valid: false, error: 'message must be 500 characters or less' };
  }

  return {
    valid: true,
    data: {
      type: type as NotificationRequest['type'],
      recipient_id,
      sender_id: sender_id as string | undefined,
      post_id: post_id as string | undefined,
      promise_id: promise_id as string | undefined,
      community_id: community_id as string | undefined,
      message: message.trim().slice(0, 500),
    }
  };
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

    const notification = validation.data;

    // Verify sender_id matches authenticated user (if provided)
    if (notification.sender_id && notification.sender_id !== userId) {
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Check if user is admin
      const { data: userRole } = await supabaseService
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!userRole) {
        return new Response(
          JSON.stringify({ error: 'sender_id must match authenticated user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use service role for database operations
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store notification in database
    const { data, error } = await supabaseService
      .from('notifications')
      .insert({
        type: notification.type,
        recipient_id: notification.recipient_id,
        sender_id: notification.sender_id || userId,
        post_id: notification.post_id,
        promise_id: notification.promise_id,
        community_id: notification.community_id,
        message: notification.message,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Notification created by user ${userId}:`, data);

    // Example: Send email notification for important updates
    if (notification.type === 'promise_update') {
      await sendEmailNotification(supabaseService, notification);
    }

    return new Response(JSON.stringify({ success: true, notification: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendEmailNotification(supabase: any, notification: NotificationRequest) {
  try {
    // Get recipient email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', notification.recipient_id)
      .single();

    if (!profile?.username) return;

    // Here you would integrate with your email service
    console.log(`Email notification would be sent to user ${profile.username}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

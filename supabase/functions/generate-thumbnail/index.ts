import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateInput(data: unknown): { valid: true; postId?: string; generateAll?: boolean } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { postId, generateAll } = data as Record<string, unknown>;

  // Must provide either postId or generateAll
  if (postId === undefined && generateAll === undefined) {
    return { valid: false, error: 'Must provide either postId or generateAll' };
  }

  // Validate postId if provided
  if (postId !== undefined) {
    if (typeof postId !== 'string' || !isValidUUID(postId)) {
      return { valid: false, error: 'postId must be a valid UUID' };
    }
  }

  // Validate generateAll if provided
  if (generateAll !== undefined && typeof generateAll !== 'boolean') {
    return { valid: false, error: 'generateAll must be a boolean' };
  }

  return { valid: true, postId: postId as string | undefined, generateAll: generateAll as boolean | undefined };
}

serve(async (req) => {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
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

    const { postId, generateAll } = validation;
    
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For generateAll, require admin role
    if (generateAll) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!userRole) {
        return new Response(
          JSON.stringify({ error: 'Admin access required for batch thumbnail generation' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let postsToProcess: { id: string; title: string; content: string; civic_clips: { id: string; thumbnail_url: string } | null; post_media: { file_type: string }[] | null; author_id: string }[] = [];

    if (generateAll) {
      // Get all posts with videos that don't have thumbnails
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          author_id,
          civic_clips!civic_clips_post_id_fkey (id, thumbnail_url),
          post_media!post_media_post_id_fkey (file_type)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter posts that have video media but no thumbnail
      postsToProcess = ((posts || []) as unknown as typeof postsToProcess).filter((post) => {
        const hasVideo = post.post_media?.some((m) => m.file_type?.startsWith('video'));
        const hasThumbnail = post.civic_clips?.thumbnail_url;
        return hasVideo && !hasThumbnail;
      });

      console.log(`Found ${postsToProcess.length} posts needing thumbnails (admin: ${userId})`);
    } else if (postId) {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          author_id,
          civic_clips!civic_clips_post_id_fkey (id, thumbnail_url),
          post_media!post_media_post_id_fkey (file_type)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      
      // Verify user owns the post or is admin
      if ((post as unknown as typeof postsToProcess[0]).author_id !== userId) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (!userRole) {
          return new Response(
            JSON.stringify({ error: 'You can only generate thumbnails for your own posts' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      if (post) postsToProcess = [post as unknown as typeof postsToProcess[0]];
    }

    if (postsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts need thumbnail generation', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { postId: string; thumbnailUrl?: string; error?: string; success?: boolean; status?: number }[] = [];

    for (const post of postsToProcess) {
      try {
        console.log(`Generating thumbnail for post: ${post.id} (requested by: ${userId})`);

        // Generate image using Lovable AI
        const prompt = `Create a professional news thumbnail image for this headline: "${post.title}". Style: Clean, modern, editorial news graphic. 16:9 aspect ratio. No text in the image.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text'],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API error for post ${post.id}:`, errorText);
          results.push({ postId: post.id, error: 'AI generation failed', status: aiResponse.status });
          continue;
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error(`No image generated for post ${post.id}`);
          results.push({ postId: post.id, error: 'No image in response' });
          continue;
        }

        // Extract base64 data
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase storage (media bucket)
        const fileName = `thumbnails/${post.id}_${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for post ${post.id}:`, uploadError);
          results.push({ postId: post.id, error: 'Upload failed' });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        const thumbnailUrl = urlData.publicUrl;

        // Check if civic_clip exists for this post
        const existingClip = post.civic_clips;

        if (existingClip?.id) {
          // Update existing civic_clip
          const { error: updateError } = await supabase
            .from('civic_clips')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', existingClip.id);

          if (updateError) {
            console.error(`Update error for post ${post.id}:`, updateError);
            results.push({ postId: post.id, error: 'Database update failed' });
            continue;
          }
        } else {
          // Create new civic_clip entry
          const { error: insertError } = await supabase
            .from('civic_clips')
            .insert({
              post_id: post.id,
              video_url: '', // Will be updated when needed
              thumbnail_url: thumbnailUrl,
            });

          if (insertError) {
            console.error(`Insert error for post ${post.id}:`, insertError);
            results.push({ postId: post.id, error: 'Database insert failed' });
            continue;
          }
        }

        console.log(`Successfully generated thumbnail for post ${post.id}: ${thumbnailUrl}`);
        results.push({ postId: post.id, thumbnailUrl, success: true });

      } catch (postError) {
        console.error(`Error processing post ${post.id}:`, postError);
        results.push({ postId: post.id, error: String(postError) });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} posts`, 
        processed: results.filter(r => r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate thumbnail error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

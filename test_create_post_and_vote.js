import { createClient } from '@supabase/supabase-js';

// SECURITY: Use environment variables for all secrets
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_ANON_KEY environment variable is required');
  console.log('Set it using: export SUPABASE_ANON_KEY="your-anon-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCreatePostAndVote() {
  try {
    console.log('Testing post creation and voting functionality...\n');

    // Try to sign up a user directly (this will work with anon key)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        data: { username: 'testuser' }
      }
    });

    let actualUserId = null;

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Error signing up user:', signUpError);
      return;
    }

    if (signUpData?.user) {
      console.log('User signed up successfully with ID:', signUpData.user.id);
      actualUserId = signUpData.user.id;
    } else {
      // User might already exist, try signing in
      console.log('User might already exist, trying to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });

      if (signInError) {
        console.error('Error signing in user:', signInError);
        return;
      }

      console.log('User signed in successfully with ID:', signInData.user.id);
      actualUserId = signInData.user.id;
    }

    // First, create a test profile for the user
    console.log('Creating test profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: actualUserId,
        username: 'testuser',
        display_name: 'Test User',
        karma: 0,
        post_karma: 0,
        comment_karma: 0,
      });

    if (profileError && !profileError.message.includes('duplicate key')) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('Profile created or already exists');

    // First, create a test post
    console.log('Creating a test post...');
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        title: 'Test Post for Voting ' + new Date().toISOString(),
        content: 'This is a test post to verify voting functionality works correctly.',
        author_id: actualUserId,
        community_id: null, // No community for now
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return;
    }

    console.log('✅ Post created successfully:', postData.id);
    console.log('Post details:', {
      id: postData.id,
      title: postData.title,
      upvotes: postData.upvotes,
      downvotes: postData.downvotes,
    });

    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if karma was updated
    const { data: profileAfterPost, error: profileAfterPostError } = await supabase
      .from('profiles')
      .select('karma, post_karma, comment_karma')
      .eq('id', actualUserId)
      .single();

    if (profileAfterPostError) {
      console.error('Error fetching profile:', profileAfterPostError);
    } else {
      console.log('Profile karma after post creation:', profileAfterPost);
    }

    // Now test voting on the post
    console.log('\nTesting vote functionality...');

    // Add an upvote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        user_id: actualUserId,
        post_id: postData.id,
        vote_type: 'up',
      });

    if (voteError) {
      console.error('❌ Error adding vote:', voteError);
      return;
    }

    console.log('✅ Vote added successfully');

    // Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if vote counts were updated
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .eq('id', postData.id)
      .single();

    if (updateError) {
      console.error('Error fetching updated post:', updateError);
    } else {
      console.log('Updated post vote counts:', {
        upvotes: updatedPost.upvotes,
        downvotes: updatedPost.downvotes,
      });
    }

    // Check if karma was updated after vote
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('karma, post_karma, comment_karma')
      .eq('id', actualUserId)
      .single();

    if (updatedProfileError) {
      console.error('Error fetching updated profile:', updatedProfileError);
    } else {
      console.log('Profile karma after voting:', updatedProfile);
    }

    // Test removing the vote
    console.log('\nTesting vote removal...');
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', actualUserId)
      .eq('post_id', postData.id);

    if (deleteError) {
      console.error('❌ Error removing vote:', deleteError);
    } else {
      console.log('✅ Vote removed successfully');
    }

    // Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check final vote counts
    const { data: finalPost, error: finalError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .eq('id', postData.id)
      .single();

    if (finalError) {
      console.error('Error fetching final post:', finalError);
    } else {
      console.log('Final post vote counts:', {
        upvotes: finalPost.upvotes,
        downvotes: finalPost.downvotes,
      });
    }

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCreatePostAndVote();

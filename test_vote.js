import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Test user ID - using one of the existing users
const testUserId = 'f337562a-cdf8-455b-831d-60bb99b29093';

async function testVote() {
  try {
    console.log('Testing vote functionality...\n');

    // Get a post to vote on
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    const testPost = posts[0];
    console.log(`Testing vote on post: "${testPost.title.substring(0, 50)}..."`);
    console.log(`Current votes: ${testPost.upvotes} upvotes, ${testPost.downvotes} downvotes\n`);

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', testUserId)
      .eq('post_id', testPost.id)
      .maybeSingle();

    if (existingVote) {
      console.log('User already voted. Removing vote...\n');

      // Remove the vote
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Error removing vote:', deleteError);
        return;
      }

      console.log('Vote removed successfully.');
    } else {
      console.log('User has not voted. Adding upvote...\n');

      // Add an upvote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          user_id: testUserId,
          post_id: testPost.id,
          vote_type: 'up',
        });

      if (insertError) {
        console.error('Error adding vote:', insertError);
        return;
      }

      console.log('Vote added successfully.');
    }

    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check updated vote counts
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .eq('id', testPost.id)
      .single();

    if (updateError) {
      console.error('Error fetching updated post:', updateError);
      return;
    }

    console.log('\nUpdated vote counts:');
    console.log(`- "${updatedPost.title.substring(0, 50)}...": ${updatedPost.upvotes} upvotes, ${updatedPost.downvotes} downvotes`);

    const voteDifference = (updatedPost.upvotes - updatedPost.downvotes) - (testPost.upvotes - testPost.downvotes);
    console.log(`\nVote count change: ${voteDifference} ${voteDifference > 0 ? '(increased)' : voteDifference < 0 ? '(decreased)' : '(no change)'}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testVote();

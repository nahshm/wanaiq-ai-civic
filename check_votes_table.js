import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkVotesTable() {
  try {
    console.log('Checking votes table...\n');

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return;
    }

    console.log(`Found ${votes.length} votes:`);
    votes.forEach(vote => {
      console.log(`- User ${vote.user_id} ${vote.vote_type}d ${vote.post_id ? 'post' : 'comment'} ${vote.post_id || vote.comment_id}`);
    });

    console.log('\nChecking post vote counts...\n');

    // Get posts with vote counts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    console.log('Posts with vote counts:');
    posts.forEach(post => {
      console.log(`- "${post.title.substring(0, 50)}...": ${post.upvotes} upvotes, ${post.downvotes} downvotes`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkVotesTable();

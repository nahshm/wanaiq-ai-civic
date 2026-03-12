import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const userId = 'f337562a-cdf8-455b-831d-60bb99b29093';

async function verifyKarma() {
  try {
    console.log('Verifying karma for user:', userId);

    // Get post vote counts using a join
    const { data: postVoteData, error: postVoteError } = await supabase
      .from('votes')
      .select(`
        vote_type,
        posts!post_id (
          author_id
        )
      `)
      .not('post_id', 'is', null);

    if (postVoteError) {
      console.error('Error fetching post votes:', postVoteError);
    } else {
      const userPostVotes = postVoteData.filter(v => v.posts?.author_id === userId);

      const upvotes = userPostVotes.filter(v => v.vote_type === 'up').length;
      const downvotes = userPostVotes.filter(v => v.vote_type === 'down').length;
      const netVotes = upvotes - downvotes;
      const postKarma = Math.floor(netVotes / 10);

      console.log('Post votes for user:');
      console.log('- Upvotes:', upvotes);
      console.log('- Downvotes:', downvotes);
      console.log('- Net votes:', netVotes);
      console.log('- Post karma (floor(net/10)):', postKarma);
    }

    // Get comment vote counts using a join
    const { data: commentVoteData, error: commentVoteError } = await supabase
      .from('votes')
      .select(`
        vote_type,
        comments!comment_id (
          author_id
        )
      `)
      .not('comment_id', 'is', null);

    if (commentVoteError) {
      console.error('Error fetching comment votes:', commentVoteError);
    } else {
      const userCommentVotes = commentVoteData.filter(v => v.comments?.author_id === userId);

      const upvotes = userCommentVotes.filter(v => v.vote_type === 'up').length;
      const downvotes = userCommentVotes.filter(v => v.vote_type === 'down').length;
      const netVotes = upvotes - downvotes;
      const commentKarma = Math.floor(netVotes / 10);

      console.log('Comment votes for user:');
      console.log('- Upvotes:', upvotes);
      console.log('- Downvotes:', downvotes);
      console.log('- Net votes:', netVotes);
      console.log('- Comment karma (floor(net/10)):', commentKarma);
    }

    // Get activity counts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', userId);

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id')
      .eq('author_id', userId);

    const { data: upvotesGiven, error: upvotesError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('vote_type', 'up');

    console.log('Activity counts:');
    console.log('- Total posts:', posts?.length || 0);
    console.log('- Total comments:', comments?.length || 0);
    console.log('- Upvotes given:', upvotesGiven?.length || 0);

    // Current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('karma, post_karma, comment_karma')
      .eq('id', userId)
      .single();

    console.log('Current profile karma:');
    console.log('- Total karma:', profile?.karma);
    console.log('- Post karma:', profile?.post_karma);
    console.log('- Comment karma:', profile?.comment_karma);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifyKarma();

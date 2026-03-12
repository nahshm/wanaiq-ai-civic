import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const userId = 'f337562a-cdf8-455b-831d-60bb99b29093';

async function checkPostVotes() {
  try {
    console.log('Checking posts and their vote counters for user:', userId);

    // Get posts by user with vote counters
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .eq('author_id', userId);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    console.log('Posts by user:');
    let totalUpvotes = 0;
    let totalDownvotes = 0;

    posts.forEach(post => {
      console.log(`- Post "${post.title}": ${post.upvotes} upvotes, ${post.downvotes} downvotes`);
      totalUpvotes += post.upvotes;
      totalDownvotes += post.downvotes;
    });

    const netVotes = totalUpvotes - totalDownvotes;
    const postKarma = Math.floor(netVotes / 10);

    console.log('\nTotal post votes:');
    console.log('- Total upvotes:', totalUpvotes);
    console.log('- Total downvotes:', totalDownvotes);
    console.log('- Net votes:', netVotes);
    console.log('- Post karma (floor(net/10)):', postKarma);

    // Check comments
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, content, upvotes, downvotes')
      .eq('author_id', userId);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return;
    }

    console.log('\nComments by user:');
    let totalCommentUpvotes = 0;
    let totalCommentDownvotes = 0;

    comments.forEach(comment => {
      console.log(`- Comment "${comment.content.substring(0, 50)}...": ${comment.upvotes} upvotes, ${comment.downvotes} downvotes`);
      totalCommentUpvotes += comment.upvotes;
      totalCommentDownvotes += comment.downvotes;
    });

    const netCommentVotes = totalCommentUpvotes - totalCommentDownvotes;
    const commentKarma = Math.floor(netCommentVotes / 10);

    console.log('\nTotal comment votes:');
    console.log('- Total upvotes:', totalCommentUpvotes);
    console.log('- Total downvotes:', totalCommentDownvotes);
    console.log('- Net votes:', netCommentVotes);
    console.log('- Comment karma (floor(net/10)):', commentKarma);

    const totalKarma = postKarma + commentKarma;
    console.log('\nTotal karma:', totalKarma);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkPostVotes();

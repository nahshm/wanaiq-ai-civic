import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSchema() {
  try {
    // Check if post_karma column exists
    const { data: postKarmaData, error: postKarmaError } = await supabase
      .from('profiles')
      .select('post_karma')
      .limit(1);

    if (postKarmaError) {
      console.error('Error checking post_karma column:', postKarmaError);
    } else {
      console.log('post_karma column exists');
    }

    // Check if comment_karma column exists
    const { data: commentKarmaData, error: commentKarmaError } = await supabase
      .from('profiles')
      .select('comment_karma')
      .limit(1);

    if (commentKarmaError) {
      console.error('Error checking comment_karma column:', commentKarmaError);
    } else {
      console.log('comment_karma column exists');
    }

    // Get a sample profile to see the data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, karma, post_karma, comment_karma')
      .limit(3);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    } else {
      console.log('Sample profiles:', profileData);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema();

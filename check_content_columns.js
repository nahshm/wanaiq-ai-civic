import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkContentColumns() {
  try {
    // Check if content_sensitivity column exists
    const { data: contentSensitivityData, error: contentSensitivityError } = await supabase
      .from('posts')
      .select('content_sensitivity')
      .limit(1);

    if (contentSensitivityError) {
      console.error('Error checking content_sensitivity column:', contentSensitivityError);
    } else {
      console.log('content_sensitivity column exists');
    }

    // Check if is_ngo_verified column exists
    const { data: ngoVerifiedData, error: ngoVerifiedError } = await supabase
      .from('posts')
      .select('is_ngo_verified')
      .limit(1);

    if (ngoVerifiedError) {
      console.error('Error checking is_ngo_verified column:', ngoVerifiedError);
    } else {
      console.log('is_ngo_verified column exists');
    }

    // Get a sample post to see the data
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('id, content_sensitivity, is_ngo_verified')
      .limit(3);

    if (postError) {
      console.error('Error fetching posts:', postError);
    } else {
      console.log('Sample posts:', postData);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkContentColumns();

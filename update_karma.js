import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function updateKarma() {
  const { data: profiles, error } = await supabase.from('profiles').select('id');
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  for (const profile of profiles) {
    const { data, error: rpcError } = await supabase.rpc('calculate_user_karma', { user_uuid: profile.id });
    if (rpcError) {
      console.error('Error calculating karma for', profile.id, rpcError);
    } else {
      console.log('Updated karma for', profile.id, 'to', data);
      // Fetch the updated values
      const { data: updatedProfile, error: fetchError } = await supabase.from('profiles').select('post_karma, comment_karma, karma').eq('id', profile.id).single();
      if (fetchError) {
        console.error('Error fetching updated profile for', profile.id, fetchError);
      } else {
        console.log('Profile', profile.id, 'post_karma:', updatedProfile.post_karma, 'comment_karma:', updatedProfile.comment_karma, 'total:', updatedProfile.karma);
      }
    }
  }
}

updateKarma();

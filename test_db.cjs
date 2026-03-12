const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://zcnjpczplkbdmmovlrtv.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20"
);

async function check() {
  console.log('Checking position...');
  const { data: pos, error: posErr } = await supabase.from('government_positions').select('position_code, title').ilike('position_code', '%nairobi%');
  console.log('Positions:', pos, posErr);

  console.log('Checking institutions...');
  const { data: inst, error: instErr } = await supabase.from('government_institutions').select('slug, name').ilike('slug', '%ncwsc%');
  console.log('Institutions:', inst, instErr);
}

check();

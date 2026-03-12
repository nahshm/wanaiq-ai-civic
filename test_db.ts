import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking position...');
  const { data: pos, error: posErr } = await supabase.from('government_positions').select('position_code, title').ilike('position_code', '%nairobi%');
  console.log('Positions:', pos, posErr);

  console.log('Checking institutions...');
  const { data: inst, error: instErr } = await supabase.from('government_institutions').select('slug, name').ilike('slug', '%ncwsc%');
  console.log('Institutions:', inst, instErr);
}

check();

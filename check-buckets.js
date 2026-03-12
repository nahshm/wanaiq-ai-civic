import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }

    console.log('Available buckets:', data.map(b => b.name));

    // Check if 'media' bucket exists
    const mediaBucket = data.find(bucket => bucket.name === 'media');

    if (!mediaBucket) {
      console.log('Creating media bucket...');
      const { data: createData, error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating media bucket:', createError);
      } else {
        console.log('Media bucket created successfully:', createData);
      }
    } else {
      console.log('Media bucket already exists');
    }
  } catch (err) {
    console.error('Failed to check/create buckets:', err);
  }
}

checkBuckets();

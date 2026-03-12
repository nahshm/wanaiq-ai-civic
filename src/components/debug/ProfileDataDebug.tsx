import { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';

interface DebugData {
  savedItems: any[];
  hiddenItems: any[];
  votes: any[];
  activities: any[];
  error: string | null;
}

export const ProfileDataDebug = ({ userId }: { userId: string }) => {
  const [debugData, setDebugData] = useState<DebugData>({
    savedItems: [],
    hiddenItems: [],
    votes: [],
    activities: [],
    error: null
  });

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        console.log('Debug: Fetching data for user:', userId);

        // Test saved_items
        const { data: savedItems, error: savedError } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', userId);

        console.log('Debug: saved_items result:', { savedItems, savedError });

        // Test hidden_items
        const { data: hiddenItems, error: hiddenError } = await supabase
          .from('hidden_items')
          .select('*')
          .eq('user_id', userId);

        console.log('Debug: hidden_items result:', { hiddenItems, hiddenError });

        // Test votes
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', userId);

        console.log('Debug: votes result:', { votes, votesError });

        // Test user_activity_log
        const { data: activities, error: activitiesError } = await supabase
          .from('user_activity_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        console.log('Debug: user_activity_log result:', { activities, activitiesError });

        setDebugData({
          savedItems: savedItems || [],
          hiddenItems: hiddenItems || [],
          votes: votes || [],
          activities: activities || [],
          error: savedError?.message || hiddenError?.message || votesError?.message || activitiesError?.message || null
        });

      } catch (err) {
        console.error('Debug: Error fetching data:', err);
        setDebugData(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Unknown error' }));
      }
    };

    if (userId) {
      fetchDebugData();
    }
  }, [userId]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-4">Debug: Profile Data</h3>

      {debugData.error && (
        <div className="text-red-600 mb-4">
          <strong>Error:</strong> {debugData.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Saved Items ({debugData.savedItems.length})</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugData.savedItems, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Hidden Items ({debugData.hiddenItems.length})</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugData.hiddenItems, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Votes ({debugData.votes.length})</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugData.votes, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Activities ({debugData.activities.length})</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugData.activities, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

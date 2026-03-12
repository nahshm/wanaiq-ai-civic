import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Crown, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';

interface LeaderEntry {
  user_id: string;
  total_points: number;
  rank: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Crown className="w-4 h-4 text-yellow-400" />,
  2: <Medal className="w-4 h-4 text-slate-400" />,
  3: <Medal className="w-4 h-4 text-amber-700" />,
};

export const DashboardLeaderboardWidget = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        // Get top 5 leaders from the weekly leaderboard
        const { data } = await (supabase as any)
          .from('leaderboard_scores')
          .select(`
            user_id, total_points, rank,
            profiles!inner(username, display_name, avatar_url)
          `)
          .eq('period', 'weekly')
          .order('rank', { ascending: true })
          .limit(5);

        const mapped = (data || []).map((entry: any) => ({
          user_id: entry.user_id,
          total_points: entry.total_points,
          rank: entry.rank,
          username: entry.profiles?.username || 'unknown',
          display_name: entry.profiles?.display_name || entry.profiles?.username || 'User',
          avatar_url: entry.profiles?.avatar_url,
        }));

        setLeaders(mapped);
      } catch (e) {
        console.error('DashboardLeaderboardWidget error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-2 px-4 pt-4">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Weekly Leaders
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {leaders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No leaderboard data yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {leaders.map(entry => {
              const isCurrentUser = user?.id === entry.user_id;
              return (
                <Link
                  key={entry.user_id}
                  to={buildProfileLink({ username: entry.username })}
                  className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors
                    ${isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                >
                  {/* Rank */}
                  <div className="w-6 flex items-center justify-center">
                    {RANK_ICON[entry.rank] || (
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {entry.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                      {entry.display_name}
                      {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                    </p>
                  </div>

                  {/* Points */}
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {entry.total_points.toLocaleString()}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardLeaderboardWidget;

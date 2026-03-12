import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityInfoCardProps {
  community?: {
    id: string;
    name: string;
    displayName?: string;
    description?: string;
    memberCount?: number;
    category?: string;
    type?: string | null;
  };
}

interface CommunityStats {
  member_count: number;
  created_at: string;
  description: string | null;
  post_count: number;
  online_count: number;
}

export function CommunityInfoCard({ community }: CommunityInfoCardProps) {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchCommunityStats = async () => {
      if (!community?.id) return;

      try {
        // Fetch community details with post count
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('member_count, created_at, description')
          .eq('id', community.id)
          .single();

        if (communityError) throw communityError;

        // Fetch post count
        const { count: postCount, error: postError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id);

        if (postError) throw postError;

        // Fetch online members count
        // Note: community_members table doesn't have last_seen field yet
        // Set to 0 until we implement real-time presence tracking
        const onlineCount = 0;

        setStats({
          member_count: communityData.member_count || 0,
          created_at: communityData.created_at,
          description: communityData.description,
          post_count: postCount || 0,
          online_count: onlineCount,
        });
      } catch (error) {
        console.error('Error fetching community stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityStats();
  }, [community?.id]);

  if (!community) return null;

  return (
    <Card className="shadow-md shadow-black/5 dark:shadow-black/20 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Users className="w-4 h-4 text-primary" />
          </div>
          Community Info
        </CardTitle>
        <Link
          to={`/c/${community.name}`}
          className="text-sm text-primary hover:underline font-semibold inline-block mt-1"
        >
          c/{community.displayName || community.name}
        </Link>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Posts Count */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Total Posts</span>
          </div>
          <span className="font-bold text-base">{loading ? '...' : (stats?.post_count || 0).toLocaleString()}</span>
        </div>

        <Separator className="bg-border/60" />

        {/* Created Date */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Created</span>
          </div>
          <span className="font-semibold text-sm">
            {loading || !stats?.created_at ? '...' : format(new Date(stats.created_at), 'MMM yyyy')}
          </span>
        </div>

        {/* Description */}
        {stats?.description && (
          <>
            <Separator className="bg-border/60" />
            <div>
              <p className="text-xs text-muted-foreground mb-2.5 font-medium uppercase tracking-wide">Description</p>
              <p className="text-xs leading-relaxed text-foreground/90">{stats.description}</p>
            </div>
          </>
        )}

        {/* Category Badge */}
        {community.category && (
          <>
            <Separator className="bg-border/60" />
            <div>
              <p className="text-xs text-muted-foreground mb-2.5 font-medium uppercase tracking-wide">Category</p>
              <Badge variant="secondary" className="capitalize font-medium px-3 py-1">
                {community.category.replace('-', ' ')}
              </Badge>
            </div>
          </>
        )}

        <Separator className="bg-border/60" />

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {community.type !== 'location' && (
            <Button
              className="w-full font-semibold shadow-sm"
              variant={isFollowing ? 'outline' : 'default'}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Following' : 'Follow Community'}
            </Button>
          )}
          <Button className="w-full font-semibold" variant="outline" asChild>
            <Link to={`/c/${community.name}`}>
              View Community
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

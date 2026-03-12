import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Sparkles, Target, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Community {
  id: string;
  name: string;
  avatar_url?: string;
  member_count: number;
  new_posts_count?: number;
  has_quests?: boolean;
  has_accountability_updates?: boolean;
}

export const YourCommunitiesWidget = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserCommunities = async () => {
      try {
        // Get user's communities with member counts
        const { data, error } = await supabase
          .from('community_members')
          .select(`
            community:communities (
              id,
              name,
              avatar_url,
              member_count
            ),
            joined_at,
            last_visit
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        // Get total count
        const { count } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setTotalCommunities(count || 0);

        // Transform data and get activity indicators
        const transformedCommunities = await Promise.all(
          (data || []).map(async (item: any) => {
            const community = item.community;
            const lastVisit = item.last_visit || item.joined_at;

            // Count new posts since last visit
            const { count: newPostsCount } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', community.id)
              .gt('created_at', lastVisit);

            // Check for quests
            const { data: questData } = await supabase
              .from('quests')
              .select('id')
              .eq('category', 'engagement') // Simplified - in production would check community_quests table
              .limit(1);

            return {
              id: community.id,
              name: community.name,
              avatar_url: community.avatar_url,
              member_count: community.member_count || 0,
              new_posts_count: newPostsCount || 0,
              has_quests: (questData?.length || 0) > 0,
              has_accountability_updates: false, // Simplified for now
            };
          })
        );

        setCommunities(transformedCommunities);
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCommunities();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="border-sidebar-border bg-sidebar-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-civic-blue" />
          <span>Your Communities</span>
          {totalCommunities > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
              {totalCommunities}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              You haven't joined any communities yet
            </p>
            <Button asChild size="sm" className="bg-civic-blue hover:bg-civic-blue/90">
              <Link to="/communities">Discover Communities</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Community list - responsive */}
            <div className="space-y-2">
              {communities.map((community) => (
                <Link
                  key={community.id}
                  to={`/c/${community.name}`}
                  className={cn(
                    "flex items-center gap-3 p-2 sm:p-3 rounded-lg",
                    "hover:bg-accent transition-colors duration-200",
                    "group relative"
                  )}
                >
                  {/* Activity indicators - absolute positioned */}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    {community.new_posts_count! > 0 && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="New posts" />
                    )}
                    {community.has_quests && (
                      <div className="w-2 h-2 rounded-full bg-amber-500" title="Quest available" />
                    )}
                    {community.has_accountability_updates && (
                      <div className="w-2 h-2 rounded-full bg-orange-500" title="Accountability update" />
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 border-2 border-border group-hover:border-civic-blue transition-colors">
                    <AvatarImage src={community.avatar_url} alt={community.name} />
                    <AvatarFallback className="bg-civic-blue/10 text-civic-blue font-semibold">
                      {community.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-civic-blue transition-colors">
                        c/{community.name}
                      </p>
                      {community.new_posts_count! > 0 && (
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-1.5 py-0">
                          {community.new_posts_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {community.member_count.toLocaleString()} members
                    </p>
                  </div>

                  {/* Activity badges - responsive */}
                  <div className="hidden sm:flex items-center gap-1">
                    {community.has_quests && (
                      <Target className="w-4 h-4 text-amber-500" aria-label="Quest available" />
                    )}
                    {community.has_accountability_updates && (
                      <AlertCircle className="w-4 h-4 text-orange-500" aria-label="Update available" />
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Actions - responsive */}
            <div className="pt-2 border-t border-border space-y-2">
              {totalCommunities > 3 && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs sm:text-sm"
                >
                  <Link to="/communities/joined">
                    View all ({totalCommunities})
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs sm:text-sm bg-civic-blue/5 hover:bg-civic-blue/10 border-civic-blue/20"
              >
                <Link to="/communities">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Discover Communities
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

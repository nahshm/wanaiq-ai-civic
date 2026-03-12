import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Quest {
  id: string;
  title: string;
  category: string;
  progress: number;
  points: number;
}

const categoryColors = {
  reporting: 'from-amber-500 to-yellow-500',
  attendance: 'from-blue-500 to-cyan-500',
  engagement: 'from-purple-500 to-pink-500',
  content: 'from-green-500 to-emerald-500',
  learning: 'from-orange-500 to-red-500',
};

export const ActiveQuestsWidget = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActiveQuests = async () => {
      try {
        // Get user's in-progress quests
        const { data, error } = await (supabase as any)
          .from('user_quests')
          .select(`
            quest_id,
            progress,
            status,
            quests (
              id,
              title,
              category,
              points
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .order('updated_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        const transformedQuests = (data || [])
          .filter((item: any) => item.quests)
          .map((item: any) => ({
            id: item.quests.id,
            title: item.quests.title,
            category: item.quests.category,
            progress: item.progress || 0,
            points: item.quests.points || 0,
          }));

        setQuests(transformedQuests);

        // Calculate total XP earned this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: completedQuests } = await (supabase as any)
          .from('user_quests')
          .select('quests(points)')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', startOfMonth.toISOString());

        const monthlyXP = (completedQuests || []).reduce(
          (sum: number, item: any) => sum + (item.quests?.points || 0),
          0
        );

        setTotalXP(monthlyXP);
      } catch (error) {
        console.error('Error fetching quests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveQuests();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="border-sidebar-border bg-sidebar-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            <span>Active Quests</span>
          </CardTitle>
          {totalXP > 0 && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-2 py-0.5">
              <Award className="w-3 h-3 mr-1" />
              {totalXP} XP
            </Badge>
          )}
        </div>
        {totalXP > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Earned this month
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-lg border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <Target className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              No active quests yet
            </p>
            <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 text-white">
              <Link to="/quests">Browse Quests</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Quest list - responsive */}
            <div className="space-y-2">
              {quests.map((quest) => {
                const gradientColor = categoryColors[quest.category as keyof typeof categoryColors] || categoryColors.engagement;

                return (
                  <Link
                    key={quest.id}
                    to={`/quests/${quest.id}`}
                    className={cn(
                      "block p-3 rounded-lg border border-border",
                      "hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/10",
                      "transition-all duration-200 group"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-2 flex-1">
                        {quest.title}
                      </h4>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 flex-shrink-0 transition-transform group-hover:translate-x-1" />
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="relative h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "absolute top-0 left-0 h-full transition-all duration-500",
                            `bg-gradient-to-r ${gradientColor}`,
                            "rounded-full"
                          )}
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>

                      {/* Stats - responsive */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {quest.progress}% complete
                        </span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {quest.points} XP
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Browse all button - responsive */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs sm:text-sm bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border-amber-400/20 text-amber-700 dark:text-amber-300"
            >
              <Link to="/quests">
                <TrendingUp className="w-4 h-4 mr-2" />
                Browse All Quests
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

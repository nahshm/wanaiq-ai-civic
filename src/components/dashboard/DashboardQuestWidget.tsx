import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Quest {
  id: string;
  quest_id: string;
  status: string;
  progress: number;
  quest_title: string;
  quest_description: string;
  points: number;
}

export const DashboardQuestWidget = ({ fullView = false }: { fullView?: boolean }) => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadQuests = async () => {
      try {
        const { data } = await (supabase as any)
          .from('user_quests')
          .select(`
            id, quest_id, status, progress,
            quests!inner(title, description, points)
          `)
          .eq('user_id', user.id)
          .in('status', ['active', 'in_progress'])
          .limit(fullView ? 10 : 3);

        const mapped = (data || []).map((q: any) => ({
          id: q.id,
          quest_id: q.quest_id,
          status: q.status,
          progress: q.progress || 0,
          quest_title: q.quests?.title || 'Quest',
          quest_description: q.quests?.description || '',
          points: q.quests?.points || 0,
        }));

        setQuests(mapped);
      } catch (e) {
        console.error('DashboardQuestWidget error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadQuests();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-2 px-4 pt-4">
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Active Quests
          {quests.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {quests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {quests.length === 0 ? (
          <div className="text-center py-4">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-2">No active quests</p>
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link to="/quests">Browse Quests</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {quests.map(quest => (
              <div key={quest.id} className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium line-clamp-1">{quest.quest_title}</p>
                  <Badge variant="secondary" className="text-[9px] shrink-0">
                    +{quest.points} XP
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quest.progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{quest.progress}%</p>
                </div>
              </div>
            ))}

            <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 mt-1" asChild>
              <Link to="/quests">
                View All Quests
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardQuestWidget;

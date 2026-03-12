import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Zap, CheckCircle2 } from 'lucide-react';

interface ActiveQuestsPanelProps {
  userId: string;
}

interface UserQuest {
  id: string;
  status: string;
  progress: number;
  quests: {
    title: string;
    description: string;
    points: number;
    difficulty: string;
    icon: string | null;
    category: string;
  } | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-600 border-green-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hard: 'bg-red-500/10 text-red-600 border-red-500/30',
};

export const ActiveQuestsPanel: React.FC<ActiveQuestsPanelProps> = ({ userId }) => {
  const { data: quests, isLoading, isError } = useQuery<UserQuest[]>({
    queryKey: ['resume-active-quests', userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_quests')
        .select(`
          id,
          status,
          progress,
          quests (
            title,
            description,
            points,
            difficulty,
            icon,
            category
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'pending_verification'])
        .order('progress', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as UserQuest[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Graceful fallback: don't render if error or empty
  if (isError || !quests || quests.length === 0) {
    return null;
  }

  const completedCount = quests.filter(q => q.status === 'pending_verification').length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-4 h-4 text-primary" />
          Active Quests
          {completedCount > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
              {completedCount} pending review
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {quests.map((uq) => {
          const quest = uq.quests;
          if (!quest) return null;
          const isPending = uq.status === 'pending_verification';

          return (
            <div key={uq.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{quest.icon || '⚡'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {quest.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-4 px-1.5 capitalize ${DIFFICULTY_COLORS[quest.difficulty] || ''}`}
                      >
                        {quest.difficulty}
                      </Badge>
                      {isPending && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-500/30">
                          Verifying
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-xs font-semibold text-primary">
                  <Zap className="w-3 h-3" />
                  {quest.points} XP
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{isPending ? 'Awaiting verification' : 'Progress'}</span>
                  <span>{uq.progress}%</span>
                </div>
                <Progress
                  value={uq.progress}
                  className="h-1.5"
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

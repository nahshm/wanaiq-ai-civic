import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, ExternalLink,  Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrackedPromise {
  id: string;
  title: string;
  official_name?: string;
  status: 'completed' | 'in_progress' | 'delayed';
  completion_percentage?: number;
  updated_at: string;
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Completed',
  },
  in_progress: {
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'In Progress',
  },
  delayed: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Delayed',
  },
};

export const AccountabilityTrackerWidget = () => {
  const { user } = useAuth();
  const [promises, setPromises] = useState<TrackedPromise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTrackedPromises = async () => {
      try {
        // Get user's tracked promises
        // Note: In production, you'd have a user_tracked_promises table
        // For now, we'll fetch recent promise updates
        const { data, error } = await supabase
          .from('promise_updates')
          .select(`
            id,
            promise_id,
            status,
            completion_percentage,
            updated_at,
            development_promises!inner(
              id,
              title
            )
          `)
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const transformedPromises = (data || []).map((item: any) => ({
          id: item.promise_id || item.id,
          title: item.development_promises?.title || 'Untitled Promise',
          status: item.status || 'in_progress',
          completion_percentage: item.completion_percentage || 0,
          updated_at: item.updated_at,
        }));

        setPromises(transformedPromises);
      } catch (error) {
        console.error('Error fetching tracked promises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedPromises();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="border-sidebar-border bg-sidebar-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          <span>Accountability Tracker</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Promises you're tracking
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-lg border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : promises.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              No tracked promises yet
            </p>
            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
              <Link to="/accountability">Browse Promises</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Promise list -responsive */}
            <div className="space-y-2">
              {promises.map((promise) => {
                const config = statusConfig[promise.status];
                const StatusIcon = config.icon;

                return (
                  <Link
                    key={promise.id}
                    to={`/promises/${promise.id}`}
                    className={cn(
                      "block p-3 rounded-lg border border-border",
                      "hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/10",
                      "transition-all duration-200 group"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <StatusIcon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", config.color)} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2">
                          {promise.title}
                        </h4>
                        <Badge variant="secondary" className={cn("mt-1 text-xs", config.bg, config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress bar (only for in_progress) */}
                    {promise.status === 'in_progress' && (
                      <div className="space-y-1">
                        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${promise.completion_percentage || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                          {promise.completion_percentage || 0}% complete
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Action center button - responsive */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs sm:text-sm bg-orange-50/50 hover:bg-orange-100/50 dark:bg-orange-950/10 dark:hover:bg-orange-950/20 border-orange-400/20 text-orange-700 dark:text-orange-300"
            >
              <Link to="/accountability">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Action Center
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

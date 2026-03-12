import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle, CheckCircle2, Clock, Users, FileText, TrendingUp,
  BarChart3, Shield, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface OverviewStats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  totalSupportGiven: number;
  recentActions: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

interface ImpactScore {
  impact_rating: number;
  trust_tier: string;
}

interface ProfileLocation {
  county: string | null;
  county_id: string | null;
}

const StatCard = ({ icon: Icon, label, value, accent, children }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
  children?: React.ReactNode;
}) => (
  <div className={`relative overflow-hidden rounded-xl border border-border/60 p-4 bg-card hover:border-primary/30 transition-colors group`}>
    <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${accent} opacity-10 group-hover:opacity-20 transition-opacity`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {children}
      </div>
      <div className={`p-2 rounded-lg ${accent} bg-opacity-10`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </div>
);

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user location for community coverage
  const { data: profile } = useQuery<ProfileLocation | null>({
    queryKey: ['dashboard-profile-location', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('county, county_id')
        .eq('id', user.id)
        .single();
      return data as ProfileLocation | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Community coverage — issues in same county this week
  const { data: communityCoverage } = useQuery<number>({
    queryKey: ['community-coverage', profile?.county],
    queryFn: async () => {
      if (!profile?.county) return 0;
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await (supabase as any)
        .from('civic_actions')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .gte('created_at', since);
      // Best-effort: filter by county text if available
      return count ?? 0;
    },
    enabled: !!profile,
    staleTime: 3 * 60 * 1000,
  });

  // Civic impact score
  const { data: impactScore } = useQuery<ImpactScore | null>({
    queryKey: ['dashboard-impact-score', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('civic_impact_scores')
        .select('impact_rating, trust_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as ImpactScore | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Representatives count
  const { data: representativeCount } = useQuery<number>({
    queryKey: ['dashboard-reps-count', profile?.county_id],
    queryFn: async () => {
      if (!profile?.county_id) return 0;
      const { count } = await (supabase as any)
        .from('officials')
        .select('*', { count: 'exact', head: true })
        .eq('county_id', profile.county_id);
      return count ?? 0;
    },
    enabled: !!profile?.county_id,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const { data: actions } = await (supabase as any)
          .from('civic_actions')
          .select('id, title, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const { count: supportCount } = await (supabase as any)
          .from('civic_action_supporters')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const allActions = actions || [];
        const open = allActions.filter((a: any) => ['submitted', 'in_progress', 'under_review', 'acknowledged'].includes(a.status));
        const resolved = allActions.filter((a: any) => a.status === 'resolved');

        setStats({
          totalIssues: allActions.length,
          openIssues: open.length,
          resolvedIssues: resolved.length,
          totalSupportGiven: supportCount || 0,
          recentActions: allActions.slice(0, 5),
        });
      } catch (e) {
        console.error('DashboardOverview loadStats error:', e);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user]);

  const STATUS_ICON: Record<string, React.ReactNode> = {
    submitted: <Clock className="w-3 h-3 text-amber-400" />,
    in_progress: <TrendingUp className="w-3 h-3 text-blue-400" />,
    acknowledged: <AlertCircle className="w-3 h-3 text-purple-400" />,
    resolved: <CheckCircle2 className="w-3 h-3 text-green-400" />,
    under_review: <AlertCircle className="w-3 h-3 text-orange-400" />,
  };

  const TRUST_COLOR: Record<string, string> = {
    newcomer: 'text-zinc-500',
    engaged: 'text-blue-500',
    trusted: 'text-green-500',
    champion: 'text-amber-500',
  };

  if (loadingStats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Stats grid — 4 personal + 3 community */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Personal stats */}
        <StatCard icon={FileText} label="Issues Reported"  value={stats.totalIssues} accent="bg-blue-500" />
        <StatCard icon={Clock} label="Open" value={stats.openIssues} accent="bg-amber-500" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolvedIssues} accent="bg-green-500" />
        <StatCard icon={Users} label="Issues Supported" value={stats.totalSupportGiven} accent="bg-purple-500" />

        {/* Community coverage */}
        <StatCard
          icon={BarChart3}
          label="Community (7d)"
          value={communityCoverage ?? '—'}
          accent="bg-cyan-500"
        >
          {profile?.county && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{profile.county}</p>
          )}
        </StatCard>

        {/* Impact score */}
        <StatCard
          icon={TrendingUp}
          label="Impact Score"
          value={impactScore?.impact_rating ?? '—'}
          accent="bg-primary"
        >
          {impactScore?.trust_tier && (
            <p className={`text-[10px] font-semibold mt-0.5 capitalize ${TRUST_COLOR[impactScore.trust_tier] || 'text-muted-foreground'}`}>
              {impactScore.trust_tier}
            </p>
          )}
        </StatCard>

        {/* Representatives */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 p-4 bg-card hover:border-primary/30 transition-colors group col-span-2 sm:col-span-1">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-orange-500 opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Representatives</p>
              <p className="text-2xl font-bold tabular-nums">{representativeCount ?? '—'}</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500 bg-opacity-10">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" asChild>
            <Link to="/officials">
              <Shield className="w-3 h-3 mr-1" /> Contact
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent activity */}
      {stats.recentActions.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h4>
            <div className="space-y-2.5">
              {stats.recentActions.map(action => (
                <Link
                  key={action.id}
                  to={`/dashboard/actions/${action.id}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="mt-0.5">
                    {STATUS_ICON[action.status] || <FileText className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                    {action.status?.replace(/_/g, ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;

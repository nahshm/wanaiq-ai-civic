import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, ShieldAlert, Shield, UserCheck, Bot, AlertTriangle,
  Flag, Brain, Activity, Loader2, FileText
} from 'lucide-react';

export default function OverviewSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: async () => {
      const [usersRes, reportsRes, modsRes, officialsRes, flagsRes, agentRunsRes, proposalsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('anonymous_reports').select('id', { count: 'exact', head: true }),
        supabase.from('community_moderators').select('id', { count: 'exact', head: true }),
        supabase.from('officials').select('id', { count: 'exact', head: true }),
        supabase.from('content_flags').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('agent_runs').select('id', { count: 'exact', head: true }),
        supabase.from('agent_proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return {
        totalUsers: usersRes.count || 0,
        anonymousReports: reportsRes.count || 0,
        activeModerators: modsRes.count || 0,
        verifiedOfficials: officialsRes.count || 0,
        pendingFlags: flagsRes.count || 0,
        totalAgentRuns: agentRunsRes.count || 0,
        pendingProposals: proposalsRes.count || 0,
      };
    },
    staleTime: 30_000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const [runsRes, alertsRes, reportsRes] = await Promise.all([
        supabase.from('agent_runs').select('id, agent_name, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('accountability_alerts').select('id, alert_type, subject_name, severity, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('anonymous_reports').select('id, report_id, category, severity, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      const items = [
        ...(runsRes.data || []).map(r => ({ type: 'agent_run' as const, id: r.id, label: `${r.agent_name} — ${r.status}`, time: r.created_at })),
        ...(alertsRes.data || []).map(a => ({ type: 'alert' as const, id: a.id, label: `${a.alert_type}: ${a.subject_name}`, time: a.created_at, severity: a.severity })),
        ...(reportsRes.data || []).map(r => ({ type: 'report' as const, id: r.id, label: `${r.report_id} — ${r.category}`, time: r.created_at })),
      ];
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return items.slice(0, 10);
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: 'text-blue-500' },
    { icon: ShieldAlert, label: 'Anonymous Reports', value: stats?.anonymousReports || 0, color: 'text-orange-500' },
    { icon: Shield, label: 'Moderators', value: stats?.activeModerators || 0, color: 'text-green-500' },
    { icon: UserCheck, label: 'Verified Officials', value: stats?.verifiedOfficials || 0, color: 'text-violet-500' },
    { icon: Flag, label: 'Pending Flags', value: stats?.pendingFlags || 0, color: 'text-red-500' },
    { icon: Bot, label: 'Agent Proposals', value: stats?.pendingProposals || 0, color: 'text-cyan-500' },
  ];

  const activityIcon = (type: string) => {
    if (type === 'agent_run') return <Bot className="w-4 h-4 text-violet-500" />;
    if (type === 'alert') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight">{kpi.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-medium">{kpi.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  {activityIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.time).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize shrink-0">{item.type.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

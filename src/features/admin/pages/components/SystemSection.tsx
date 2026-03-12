import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Server, Users, Database, Shield, Loader2, Activity, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SystemSection() {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview" className="gap-2"><Activity className="w-4 h-4" />Overview</TabsTrigger>
        <TabsTrigger value="audit" className="gap-2"><Shield className="w-4 h-4" />Audit Logs</TabsTrigger>
        <TabsTrigger value="errors" className="gap-2"><AlertCircle className="w-4 h-4" />Error Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><OverviewSubTab /></TabsContent>
      <TabsContent value="audit"><AuditLogsSubTab /></TabsContent>
      <TabsContent value="errors"><ErrorLogsSubTab /></TabsContent>
    </Tabs>
  );
}

function OverviewSubTab() {
  const { data: systemStats, isLoading } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: async () => {
      const [usersRes, rolesRes, reportsRes, flagsRes, apiRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
        supabase.from('anonymous_reports').select('id', { count: 'exact', head: true }),
        supabase.from('content_flags').select('id', { count: 'exact', head: true }),
        supabase.from('api_metrics').select('id', { count: 'exact', head: true }),
      ]);
      return {
        totalUsers: usersRes.count || 0,
        roleAssignments: rolesRes.count || 0,
        totalReports: reportsRes.count || 0,
        totalFlags: flagsRes.count || 0,
        apiCalls: apiRes.count || 0,
      };
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const services = [
    { name: 'Database', icon: Database, status: 'operational' },
    { name: 'Authentication', icon: Shield, status: 'operational' },
    { name: 'Storage', icon: Server, status: 'operational' },
    { name: 'Edge Functions', icon: Server, status: 'operational' },
  ];

  return (
    <div className="space-y-6">
      {/* Security Metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" />Security Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Registered Users</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.roleAssignments}</div>
              <div className="text-xs text-muted-foreground mt-1">Role Assignments</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.totalReports}</div>
              <div className="text-xs text-muted-foreground mt-1">Anonymous Reports</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.totalFlags}</div>
              <div className="text-xs text-muted-foreground mt-1">Content Flags</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.apiCalls.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">API Calls</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4" />System Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map(svc => (
              <div key={svc.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <svc.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{svc.name}</span>
                </div>
                <Badge variant="default" className="text-xs capitalize">{svc.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent System Activity</CardTitle></CardHeader>
        <CardContent>
          {recentActivity?.length ? (
            <div className="space-y-2">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <div>
                    <span className="text-sm font-medium">{activity.action}</span>
                    <div className="text-xs text-muted-foreground">{activity.user_id || 'System'}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground text-sm">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogsSubTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs', searchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from('system_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Audit Logs</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : !auditLogs?.length ? (
            <p className="text-center py-8 text-muted-foreground">No audit logs found.</p>
          ) : (
            <div className="divide-y">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{log.action}</div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>User: {log.user_id || 'System'}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.entity_type && (
                          <>
                            <span>•</span>
                            <span>{log.entity_type}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={auditLogs?.length !== PAGE_SIZE}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function ErrorLogsSubTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: errorLogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-error-logs', searchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchTerm) {
        query = query.or(`error_message.ilike.%${searchTerm}%,component_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Error Logs</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search errors..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : !errorLogs?.length ? (
            <p className="text-center py-8 text-muted-foreground">No error logs found.</p>
          ) : (
            <div className="divide-y">
              {errorLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">{log.severity}</Badge>
                          <span className="text-sm font-medium">{log.error_message}</span>
                        </div>
                        {log.error_stack && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              Stack Trace
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {log.error_stack}
                            </pre>
                          </details>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>User: {log.user_id || 'System'}</span>
                          <span>•</span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          {log.component_name && (
                            <>
                              <span>•</span>
                              <span>{log.component_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={errorLogs?.length !== PAGE_SIZE}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
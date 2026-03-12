import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldAlert, AlertTriangle, Lock, CheckCircle, XCircle,
  Loader2, RefreshCw, Radio, Flag, ChevronDown, ChevronRight,
  Eye, MessageSquare, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContentSection() {
  return (
    <Tabs defaultValue="moderation" className="space-y-6">
      <TabsList>
        <TabsTrigger value="moderation" className="gap-2"><Flag className="w-4 h-4" />Moderation Queue</TabsTrigger>
        <TabsTrigger value="reports" className="gap-2"><ShieldAlert className="w-4 h-4" />Anonymous Reports</TabsTrigger>
        <TabsTrigger value="crisis" className="gap-2"><AlertTriangle className="w-4 h-4" />Crisis</TabsTrigger>
      </TabsList>

      <TabsContent value="moderation"><ModerationQueueSubTab /></TabsContent>
      <TabsContent value="reports"><AnonymousReportsSubTab /></TabsContent>
      <TabsContent value="crisis"><CrisisSubTab /></TabsContent>
    </Tabs>
  );
}

function ModerationQueueSubTab() {
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: flags, isLoading, refetch } = useQuery({
    queryKey: ['admin-content-flags', filter],
    queryFn: async () => {
      let q = supabase.from('content_flags').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter === 'pending') q = q.eq('status', 'pending');
      else if (filter === 'reviewed') q = q.neq('status', 'pending');
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch flagged content details for expanded items
  const { data: contentDetails } = useQuery({
    queryKey: ['admin-flagged-content-details', expandedId],
    queryFn: async () => {
      if (!expandedId) return null;
      const flag = flags?.find(f => f.id === expandedId);
      if (!flag) return null;

      let content: any = null;
      if (flag.post_id) {
        const { data } = await supabase.from('posts')
          .select('id, title, content, created_at, profiles(display_name, username)')
          .eq('id', flag.post_id).single();
        content = data ? { type: 'post', ...data } : null;
      } else if (flag.comment_id) {
        const { data } = await supabase.from('comments')
          .select('id, content, created_at, profiles(display_name, username)')
          .eq('id', flag.comment_id).single();
        content = data ? { type: 'comment', ...data } : null;
      }
      return content;
    },
    enabled: !!expandedId,
  });

  const handleAction = async (flagId: string, action: 'approved' | 'removed' | 'escalated') => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('content_flags')
      .update({ status: action, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', flagId);

    if (error) toast.error('Action failed');
    else { toast.success(`Flag marked as ${action}`); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Moderation Queue</h3>
        <div className="flex gap-2">
          {(['pending', 'reviewed', 'all'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !flags?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            No pending flags. Queue is clear.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map(flag => {
            const isExpanded = expandedId === flag.id;
            return (
              <Card key={flag.id} className="border-l-4 border-l-orange-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {flag.post_id && <Badge variant="outline" className="text-xs gap-1"><FileText className="w-3 h-3" />Post</Badge>}
                        {flag.comment_id && <Badge variant="outline" className="text-xs gap-1"><MessageSquare className="w-3 h-3" />Comment</Badge>}
                        <Badge variant="secondary" className="text-xs">{flag.verdict}</Badge>
                        <Badge variant="outline" className="text-xs">{flag.status}</Badge>
                        {flag.flagged_by_ai && <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">AI Flagged</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(flag.created_at).toLocaleDateString()} · {new Date(flag.created_at).toLocaleTimeString()}
                      </div>
                      {flag.reason && <div className="text-sm text-orange-600 dark:text-orange-400 mt-1 italic">"{flag.reason}"</div>}

                      {/* Expand button */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : flag.id)}
                        className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {isExpanded ? 'Hide' : 'View'} Original Content
                      </button>

                      {/* Expanded content preview */}
                      {isExpanded && contentDetails && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize">{contentDetails.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              By {contentDetails.profiles?.display_name || contentDetails.profiles?.username || 'Unknown'}
                            </span>
                          </div>
                          {contentDetails.title && <h5 className="font-medium text-sm mb-1">{contentDetails.title}</h5>}
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {contentDetails.content || 'No content'}
                          </p>
                        </div>
                      )}
                      {isExpanded && !contentDetails && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30 text-xs text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin inline mr-1" />Loading content...
                        </div>
                      )}
                    </div>
                    {flag.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600"
                          onClick={() => handleAction(flag.id, 'approved')}>
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(flag.id, 'removed')}>
                          <XCircle className="w-3 h-3 mr-1" />Remove
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleAction(flag.id, 'escalated')}>
                          <AlertTriangle className="w-3 h-3 mr-1" />Escalate
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnonymousReportsSubTab() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-anonymous-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anonymous_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reports?.filter(r => r.severity === 'critical').length || 0}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <Lock className="text-green-500 mb-1 w-5 h-5" />
            <div className="text-2xl font-bold">{reports?.reduce((acc, r) => acc + (r.evidence_count || 0), 0) || 0}</div>
            <div className="text-xs text-muted-foreground">Evidence Secured</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !reports?.length ? (
            <p className="text-center py-8 text-muted-foreground">No reports yet.</p>
          ) : (
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="p-3 border rounded-lg flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{r.report_id}</div>
                    <div className="text-xs text-muted-foreground">{r.category}</div>
                    {r.title && <div className="text-xs text-muted-foreground mt-0.5">{r.title}</div>}
                  </div>
                  <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{r.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CrisisSubTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Crisis Command Center</h3>
              <p className="text-sm text-muted-foreground">Real-time monitoring and emergency response</p>
            </div>
            <Button variant="destructive">
              <Radio className="w-4 h-4 mr-2" />Broadcast Emergency Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'RESOLVED'].map(level => (
          <Card key={level}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs font-medium text-muted-foreground">{level}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

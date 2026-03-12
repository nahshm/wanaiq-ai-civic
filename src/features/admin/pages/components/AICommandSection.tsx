import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot, Brain, BookOpen, Sliders, Database, RefreshCw,
  CheckCircle, XCircle, Loader2, Clock, AlertTriangle,
  MapPin, ChevronRight, Pencil, Plus, Check, X,
  Upload, Zap, Shield, Eye, FileText, MessageSquare, Search as SearchIcon,
  BookOpenCheck, Route, HardDrive, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

// ────────────────────── Agent Registry ──────────────────────
interface AgentInfo {
  name: string;
  displayName: string;
  purpose: string;
  trigger: string;
  tools: string[];
  icon: React.ElementType;
  color: string;
}

const AGENT_REGISTRY: AgentInfo[] = [
  {
    name: 'civic-guardian',
    displayName: 'Guardian',
    purpose: 'Content moderator — scans posts/comments for hate speech, ethnic incitement, misinformation, and PII exposure.',
    trigger: 'DB webhook on post/comment INSERT + 5min cron',
    tools: ['hideContent', 'issueWarning', 'queueForReview', 'emitEvent', 'createProposal'],
    icon: Shield,
    color: 'text-red-500',
  },
  {
    name: 'civic-minion',
    displayName: 'Minion',
    purpose: 'Decision maker — reviews Guardian proposals, auto-approves high confidence actions, escalates low confidence to human moderators.',
    trigger: '5min cron + manual API',
    tools: ['execute_ban', 'execute_content_removal', 'execute_warning', 'escalate_to_admin'],
    icon: Zap,
    color: 'text-violet-500',
  },
  {
    name: 'civic-quill',
    displayName: 'Quill',
    purpose: 'Bilingual writer — turns agent findings into clear, factual public messages for Kenyan citizens in English + Kiswahili.',
    trigger: 'Event-driven (proposal_approved, new_finding, accountability_alert) + weekly cron for educational posts',
    tools: ['generateWarningMessage', 'generateCivicSummary', 'generateEducationalPost', 'saveDraft'],
    icon: MessageSquare,
    color: 'text-blue-500',
  },
  {
    name: 'civic-scout',
    displayName: 'Scout',
    purpose: 'Intelligence collector — scrapes Kenya Gazette, Parliament RSS, news APIs for civic-relevant data (tenders, appointments, legislation).',
    trigger: 'Hourly cron',
    tools: ['scrapeGazette', 'scrapeParliamentRSS', 'embedFinding', 'emitEvent'],
    icon: SearchIcon,
    color: 'text-emerald-500',
  },
  {
    name: 'civic-sage',
    displayName: 'Sage',
    purpose: 'Policy analyst — RAG analysis of scout findings against Kenya\'s legal framework (Constitution 2010, PPADA, PFMA, County Governments Act).',
    trigger: '6hr cron + scout events',
    tools: ['ragQuery', 'analyzePolicy', 'generateInsight'],
    icon: BookOpenCheck,
    color: 'text-amber-500',
  },
  {
    name: 'civic-brain',
    displayName: 'Brain',
    purpose: 'Civic assistant — powers the user-facing chat with personalized RAG responses based on user\'s county, interests, and persona.',
    trigger: 'User request (real-time)',
    tools: ['ragQuery', 'personalizeResponse', 'chatHistory'],
    icon: Brain,
    color: 'text-pink-500',
  },
  {
    name: 'civic-steward',
    displayName: 'Steward',
    purpose: 'Pre-publish moderator — screens user content before posting to ensure community guideline compliance.',
    trigger: 'User request (real-time)',
    tools: ['screenContent', 'suggestEdits'],
    icon: Eye,
    color: 'text-cyan-500',
  },
  {
    name: 'civic-router',
    displayName: 'Router',
    purpose: 'Government institution lookup — routes civic queries to the correct government office using Kenya\'s administrative structure.',
    trigger: 'User request (real-time)',
    tools: ['lookupInstitution', 'resolveJurisdiction'],
    icon: Route,
    color: 'text-orange-500',
  },
  {
    name: 'civic-ingest',
    displayName: 'Ingest',
    purpose: 'Document ingestion — chunks and embeds PDFs/text into the vector knowledge base for RAG.',
    trigger: 'Admin trigger',
    tools: ['chunkDocument', 'generateEmbeddings', 'insertVectors'],
    icon: HardDrive,
    color: 'text-slate-500',
  },
];

export default function AICommandSection() {
  return (
    <Tabs defaultValue="directory" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="directory" className="gap-2"><Bot className="w-4 h-4" />Agent Directory</TabsTrigger>
        <TabsTrigger value="queue" className="gap-2"><Activity className="w-4 h-4" />Queue</TabsTrigger>
        <TabsTrigger value="drafts" className="gap-2"><BookOpen className="w-4 h-4" />Drafts</TabsTrigger>
        <TabsTrigger value="prompts" className="gap-2"><Brain className="w-4 h-4" />Prompt Studio</TabsTrigger>
        <TabsTrigger value="knowledge" className="gap-2"><Database className="w-4 h-4" />Knowledge Base</TabsTrigger>
        <TabsTrigger value="config" className="gap-2"><Sliders className="w-4 h-4" />Config</TabsTrigger>
      </TabsList>

      <TabsContent value="directory"><AgentDirectorySubTab /></TabsContent>
      <TabsContent value="queue"><AgentQueueSubTab /></TabsContent>
      <TabsContent value="drafts"><DraftsSubTab /></TabsContent>
      <TabsContent value="prompts"><PromptStudioSubTab /></TabsContent>
      <TabsContent value="knowledge"><KnowledgeBaseSubTab /></TabsContent>
      <TabsContent value="config"><AgentConfigSubTab /></TabsContent>
    </Tabs>
  );
}

// ────────────────────── Agent Directory ──────────────────────
function AgentDirectorySubTab() {
  const { data: latestRuns } = useQuery({
    queryKey: ['admin-agent-latest-runs'],
    queryFn: async () => {
      const { data } = await supabase.from('agent_runs')
        .select('agent_name, status, created_at, duration_ms, items_scanned, items_actioned')
        .order('created_at', { ascending: false })
        .limit(100);
      const map: Record<string, typeof data extends (infer T)[] | null ? T : never> = {};
      (data || []).forEach(r => {
        if (!map[r.agent_name]) map[r.agent_name] = r;
      });
      return map;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Agent Directory</h3>
        <p className="text-sm text-muted-foreground">All platform agents, their purpose, triggers, and last known status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AGENT_REGISTRY.map(agent => {
          const lastRun = latestRuns?.[agent.name];
          const Icon = agent.icon;

          return (
            <Card key={agent.name} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${agent.color}`} />
                  <CardTitle className="text-base">{agent.displayName}</CardTitle>
                </div>
                <code className="text-xs text-muted-foreground">{agent.name}</code>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.purpose}</p>
                <div>
                  <span className="text-xs font-medium">Trigger:</span>
                  <p className="text-xs text-muted-foreground">{agent.trigger}</p>
                </div>
                <div>
                  <span className="text-xs font-medium">Tools:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.tools.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                    ))}
                  </div>
                </div>
                {lastRun && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <div className={`w-2 h-2 rounded-full ${lastRun.status === 'success' ? 'bg-green-500' : lastRun.status === 'failed' ? 'bg-destructive' : 'bg-yellow-500'}`} />
                    <span className="text-xs text-muted-foreground">
                      Last run: {new Date(lastRun.created_at).toLocaleString()} ({lastRun.status})
                    </span>
                  </div>
                )}
                {!lastRun && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">No runs recorded</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Button size="sm" variant="outline" className="w-full gap-1 text-xs"
                    onClick={async () => {
                      const { error } = await supabase.from('agent_runs').insert({
                        agent_name: agent.name,
                        trigger_type: 'manual',
                        status: 'pending',
                        items_scanned: 0, items_actioned: 0, items_failed: 0,
                        metadata: { triggered_by: 'admin_dashboard' },
                      });
                      if (error) toast.error('Failed to trigger');
                      else toast.success(`Triggered ${agent.displayName} run`);
                    }}>
                    <Zap className="w-3 h-3" />Trigger Run
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────── Agent Queue ──────────────────────
function AgentQueueSubTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-agent-queue'],
    queryFn: async () => {
      const [proposalsRes, logsRes, alertsRes] = await Promise.all([
        supabase.from('agent_proposals')
          .select('id, proposal_type, agent_name, confidence, status, created_at, subject_id, reasoning')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('agent_runs')
          .select('id, agent_name, trigger_type, status, created_at, duration_ms, error_summary, items_scanned')
          .order('created_at', { ascending: false }).limit(30),
        supabase.from('accountability_alerts')
          .select('id, alert_type, subject_type, subject_name, severity, summary, county, constituency, is_public, acknowledged, created_at, details')
          .order('created_at', { ascending: false }).limit(30),
      ]);
      return {
        proposals: proposalsRes.data || [],
        runs: logsRes.data || [],
        alerts: alertsRes.data || [],
      };
    },
  });

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('agent_proposals')
      .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString(), action_taken: status })
      .eq('id', id);
    if (error) toast.error('Failed');
    else { toast.success(`Proposal ${status}`); refetch(); }
    setProcessing(null);
  };

  const handleAck = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('accountability_alerts')
      .update({ acknowledged: true, acknowledged_by: user?.id, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId);
    if (error) toast.error('Failed');
    else { toast.success('Acknowledged'); refetch(); }
  };

  const proposals = data?.proposals || [];
  const runs = data?.runs || [];
  const alerts = data?.alerts || [];
  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === 'pending');
  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agent Queue</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <Clock className="text-orange-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending Review</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Bot className="text-violet-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{runs.length}</div>
          <div className="text-xs text-muted-foreground">Recent Runs</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <AlertTriangle className="text-orange-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{alerts.filter(a => !a.acknowledged).length}</div>
          <div className="text-xs text-muted-foreground">Unacked Alerts</div>
        </CardContent></Card>
      </div>

      {/* Proposals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Proposals</CardTitle>
            <div className="flex gap-2">
              {(['all', 'pending'] as const).map(f => (
                <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
           !filtered.length ? <p className="text-center py-8 text-muted-foreground">No proposals found.</p> : (
            <div className="space-y-3">
              {filtered.map(p => (
                <div key={p.id} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">{p.proposal_type}</Badge>
                        <span className="text-xs text-muted-foreground">Confidence: {Math.round((p.confidence || 0) * 100)}%</span>
                        <Badge variant={p.status === 'pending' ? 'secondary' : p.status === 'approved' ? 'default' : 'destructive'} className="text-xs capitalize ml-auto">{p.status}</Badge>
                      </div>
                      {p.reasoning && <p className="text-xs text-muted-foreground mt-1 truncate">{p.reasoning}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{p.agent_name} · {new Date(p.created_at).toLocaleString()}</p>
                    </div>
                    {p.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600" disabled={processing === p.id}
                          onClick={() => handleDecision(p.id, 'approved')}>
                          {processing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive" disabled={processing === p.id}
                          onClick={() => handleDecision(p.id, 'rejected')}>
                          {processing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Agent Runs</CardTitle></CardHeader>
        <CardContent>
          {!runs.length ? <p className="text-center py-6 text-muted-foreground">No runs recorded.</p> : (
            <div className="space-y-2">
              {runs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'completed' || log.status === 'success' ? 'bg-green-500' : log.status === 'failed' ? 'bg-destructive' : 'bg-yellow-500'}`} />
                    <div>
                      <div className="font-medium text-sm">{log.agent_name}</div>
                      <div className="text-xs text-muted-foreground">{log.trigger_type} · {log.items_scanned ?? 0} items</div>
                    </div>
                  </div>
                  <Badge variant={log.status === 'completed' || log.status === 'success' ? 'default' : 'destructive'} className="text-xs capitalize">{log.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accountability Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />Accountability Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!alerts.length ? <p className="text-center py-6 text-muted-foreground">No alerts yet.</p> : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-3 border-l-4 rounded-lg ${
                  alert.severity >= 8 ? 'border-l-destructive bg-destructive/5' :
                  alert.severity >= 5 ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20' :
                  'border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                } ${alert.acknowledged ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-xs capitalize">{alert.alert_type.replace(/_/g, ' ')}</Badge>
                        <span className="text-xs font-semibold">Severity {alert.severity}/10</span>
                        {alert.county && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{alert.county}</span>}
                      </div>
                      <p className="font-medium text-sm truncate">{alert.subject_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.summary}</p>
                    </div>
                    {!alert.acknowledged && (
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleAck(alert.id)}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />Ack
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────── Drafts ──────────────────────
function DraftsSubTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: drafts, isLoading, refetch } = useQuery({
    queryKey: ['admin-agent-drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_drafts')
        .select('*')
        .in('status', ['pending', 'low_confidence', 'approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAction = async (draftId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase.from('agent_drafts')
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq('id', draftId);
    if (error) toast.error(`Failed to ${newStatus} draft`);
    else { toast.success(`Draft ${newStatus}`); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Drafts (Quill + Sage)</h3>
        <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
       !drafts?.length ? <Card><CardContent className="py-10 text-center text-muted-foreground">No drafts yet.</CardContent></Card> : (
        <div className="space-y-3">
          {drafts.map(draft => (
            <Card key={draft.id} className={draft.status !== 'pending' ? 'opacity-70' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{draft.draft_type.replace(/_/g, ' ')}</Badge>
                      <Badge variant={draft.status === 'pending' ? 'secondary' : draft.status === 'approved' ? 'default' : 'destructive'} className="text-xs capitalize">{draft.status}</Badge>
                      <Badge variant="outline" className="text-xs">{draft.language}</Badge>
                      <span className="text-xs text-muted-foreground">{draft.agent_name} · {new Date(draft.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium text-sm">{draft.title}</p>
                    {expandedId === draft.id ? (
                      <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap font-sans bg-muted/40 p-3 rounded-lg">{draft.content}</pre>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{draft.content.slice(0, 200)}</p>
                    )}
                    <button onClick={() => setExpandedId(expandedId === draft.id ? null : draft.id)}
                      className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline">
                      <ChevronRight className={`w-3 h-3 transition-transform ${expandedId === draft.id ? 'rotate-90' : ''}`} />
                      {expandedId === draft.id ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                  {draft.status === 'pending' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600"
                        onClick={() => handleAction(draft.id, 'approved')}>
                        <CheckCircle className="w-3.5 h-3.5" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive"
                        onClick={() => handleAction(draft.id, 'rejected')}>
                        <XCircle className="w-3.5 h-3.5" />Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────── Prompt Studio ──────────────────────
function PromptStudioSubTab() {
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: promptRows, isLoading, refetch } = useQuery({
    queryKey: ['admin-agent-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agent_state')
        .select('*')
        .eq('state_key', 'system_prompt')
        .order('agent_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSave = async (agentName: string) => {
    setSaving(true);
    const existing = promptRows?.find(r => r.agent_name === agentName);
    if (existing) {
      const { error } = await supabase.from('agent_state')
        .update({ state_value: editValue, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) toast.error('Failed to save');
      else { toast.success('Prompt saved — agents will use this override on next run'); setEditingAgent(null); refetch(); }
    }
    setSaving(false);
  };

  const promptMap: Record<string, { id: string; value: string; description: string | null }> = {};
  (promptRows || []).forEach(r => {
    promptMap[r.agent_name] = { id: r.id, value: String(r.state_value), description: r.description };
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Prompt Studio</h3>
        <p className="text-sm text-muted-foreground">
          Edit system prompts for each agent. Changes take effect on the agent's next run.
          Agents check <code className="text-xs bg-muted px-1 py-0.5 rounded">agent_state</code> for overrides before using their default prompt.
        </p>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <div className="space-y-4">
          {AGENT_REGISTRY.map(agent => {
            const prompt = promptMap[agent.name];
            const Icon = agent.icon;
            const isEditing = editingAgent === agent.name;

            return (
              <Card key={agent.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${agent.color}`} />
                      <CardTitle className="text-base">{agent.displayName}</CardTitle>
                      <code className="text-xs text-muted-foreground">{agent.name}</code>
                    </div>
                    {!isEditing && prompt && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingAgent(agent.name);
                        setEditValue(prompt.value);
                      }}>
                        <Pencil className="w-4 h-4 mr-1" />Edit Prompt
                      </Button>
                    )}
                  </div>
                  {prompt?.description && (
                    <CardDescription className="text-xs">{prompt.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y font-mono"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={saving} onClick={() => handleSave(agent.name)}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingAgent(null)}><X className="w-4 h-4 mr-1" />Cancel</Button>
                      </div>
                    </div>
                  ) : prompt ? (
                    <pre className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg whitespace-pre-wrap font-mono max-h-48 overflow-auto">
                      {prompt.value}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No prompt configured — agent uses hardcoded default.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────── Knowledge Base ──────────────────────
function KnowledgeBaseSubTab() {
  const [ragFilter, setRagFilter] = useState('all');
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', content: '', source_type: 'manual' });
  const [ragSaving, setRagSaving] = useState(false);

  const ragSourceTypes = ['all', 'kenya_constitution', 'kenya_ppada', 'kenya_pfma', 'kenya_kica', 'wanaiq_guidelines', 'scout_finding', 'manual'];

  const { data: vectors, isLoading, refetch } = useQuery({
    queryKey: ['admin-rag-vectors', ragFilter],
    queryFn: async () => {
      let q = (supabase as any).from('vectors').select('id, source_type, title, content, created_at').order('created_at', { ascending: false }).limit(50);
      if (ragFilter !== 'all') q = q.eq('source_type', ragFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const handleAddDoc = async () => {
    if (!newDoc.content.trim()) { toast.error('Content is required'); return; }
    setRagSaving(true);
    const { error } = await (supabase as any).from('vectors').insert({
      title: newDoc.title || null, content: newDoc.content, source_type: newDoc.source_type, embedding: null
    });
    if (error) toast.error(`Failed: ${error.message}`);
    else {
      toast.success('Document added');
      setNewDoc({ title: '', content: '', source_type: 'manual' });
      setAddingDoc(false);
      refetch();
    }
    setRagSaving(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setNewDoc(prev => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          content: prev.content ? prev.content + '\n\n' + text : text,
        }));
        setAddingDoc(true);
        toast.success(`Loaded: ${file.name}`);
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'text/markdown': ['.md'], 'text/csv': ['.csv'] },
    maxFiles: 5,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">RAG Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">Manage documents powering AI analysis</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          <Button size="sm" onClick={() => setAddingDoc(!addingDoc)}><Plus className="w-4 h-4 mr-2" />Add Document</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ragSourceTypes.map(st => (
          <button key={st} onClick={() => setRagFilter(st)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
              ragFilter === st ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
            }`}>{st.replace(/_/g, ' ')}</button>
        ))}
      </div>

      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
      }`}>
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{isDragActive ? 'Drop files here...' : 'Drag & drop .txt, .md, or .csv files, or click to browse'}</p>
      </div>

      {addingDoc && (
        <Card className="border-dashed border-2 border-primary/40">
          <CardHeader><CardTitle className="text-base">Add Knowledge Document</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Title (optional)</Label>
              <Input value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="E.g. Article 43 — Right to Education" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Source Type</Label>
              <select value={newDoc.source_type} onChange={e => setNewDoc({ ...newDoc, source_type: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {ragSourceTypes.filter(s => s !== 'all').map(st => (
                  <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm">Content *</Label>
              <textarea value={newDoc.content} onChange={e => setNewDoc({ ...newDoc, content: e.target.value })}
                placeholder="Paste document text..." rows={6}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddingDoc(false)}>Cancel</Button>
              <Button disabled={ragSaving} onClick={handleAddDoc}>
                {ragSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
       !vectors?.length ? <Card><CardContent className="py-10 text-center text-muted-foreground">No documents in knowledge base.</CardContent></Card> : (
        <div className="space-y-2">
          {vectors.map((vec: any) => (
            <div key={vec.id} className="p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-muted rounded font-medium capitalize">{vec.source_type?.replace(/_/g, ' ')}</span>
                {vec.title && <span className="text-sm font-medium truncate">{vec.title}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{new Date(vec.created_at).toLocaleDateString()}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive/80 shrink-0"
                  onClick={async () => {
                    if (!confirm('Delete this knowledge base document?')) return;
                    const { error } = await (supabase as any).from('vectors').delete().eq('id', vec.id);
                    if (error) toast.error('Failed to delete');
                    else { toast.success('Document deleted'); refetch(); }
                  }}>
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{vec.content?.slice(0, 300)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────── Agent Config ──────────────────────
function AgentConfigSubTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: thresholds, isLoading, refetch } = useQuery({
    queryKey: ['admin-agent-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agent_state')
        .select('*')
        .order('agent_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSave = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('agent_state')
      .update({ state_value: editValue, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to save');
    else { toast.success('Saved'); setEditingId(null); refetch(); }
    setSaving(false);
  };

  // Filter out prompt keys (they're in Prompt Studio)
  const configRows = (thresholds || []).filter(r => r.state_key !== 'system_prompt');

  const grouped = configRows.reduce((acc, row) => {
    if (!acc[row.agent_name]) acc[row.agent_name] = [];
    acc[row.agent_name].push(row);
    return acc;
  }, {} as Record<string, typeof configRows>);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Agent Configuration</h3>
        <p className="text-sm text-muted-foreground">Tune thresholds, timing, and behaviour for all agents</p>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        Object.entries(grouped).map(([agentName, rows]) => {
          const agentInfo = AGENT_REGISTRY.find(a => a.name === agentName);
          const Icon = agentInfo?.icon || Bot;

          return (
            <Card key={agentName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${agentInfo?.color || 'text-primary'}`} />{agentInfo?.displayName || agentName}
                  <code className="text-xs text-muted-foreground font-normal">{agentName}</code>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rows.map(row => (
                    <div key={row.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-medium">{row.state_key}</code>
                        {row.description && <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>}
                      </div>
                      {editingId === row.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="w-32 h-8 text-sm"
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(row.id); if (e.key === 'Escape') setEditingId(null); }}
                            autoFocus />
                          <Button size="sm" className="h-8" disabled={saving} onClick={() => handleSave(row.id)}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">{String(row.state_value)}</code>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingId(row.id); setEditValue(String(row.state_value)); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

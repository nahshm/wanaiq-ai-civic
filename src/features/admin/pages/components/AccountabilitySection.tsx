import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FolderKanban, ScrollText, Users, Calendar, CheckCircle, XCircle,
  AlertTriangle, Loader2, RefreshCw, Eye, Clock, Building, Plus,
  Pencil, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountabilitySection() {
  return (
    <Tabs defaultValue="projects" className="space-y-6">
      <TabsList>
        <TabsTrigger value="projects" className="gap-2"><FolderKanban className="w-4 h-4" />Projects</TabsTrigger>
        <TabsTrigger value="promises" className="gap-2"><ScrollText className="w-4 h-4" />Promises</TabsTrigger>
        <TabsTrigger value="actions" className="gap-2"><Users className="w-4 h-4" />Civic Actions</TabsTrigger>
        <TabsTrigger value="elections" className="gap-2"><Calendar className="w-4 h-4" />Elections</TabsTrigger>
      </TabsList>

      <TabsContent value="projects"><ProjectsSubTab /></TabsContent>
      <TabsContent value="promises"><PromisesSubTab /></TabsContent>
      <TabsContent value="actions"><CivicActionsSubTab /></TabsContent>
      <TabsContent value="elections"><ElectionsSubTab /></TabsContent>
    </Tabs>
  );
}

// ────────────────────── Projects CRUD ──────────────────────
const PROJECT_STATUSES = ['planned', 'pending', 'active', 'completed', 'stalled', 'cancelled', 'rejected'];

const emptyProject = {
  title: '', description: '', status: 'planned', category: '',
  budget_allocated: '', location: '', county: '', priority: 'medium',
};

function ProjectsSubTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyProject);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['admin-projects', filter],
    queryFn: async () => {
      let query = supabase.from('government_projects')
        .select(`*, government_institutions(name, jurisdiction_name), officials(display_name, position_title)`)
        .order('created_at', { ascending: false }).limit(50);
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, description: form.description,
        status: form.status, category: form.category || null,
        budget_allocated: form.budget_allocated ? parseFloat(form.budget_allocated) : null,
        location: form.location || null, county: form.county || null,
        priority: form.priority, updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from('government_projects').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        payload.created_by = user?.id;
        const { error } = await supabase.from('government_projects').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Project updated' : 'Project created');
      closeForm();
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('government_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Project deleted'); setDeleteId(null); refetch(); },
    onError: () => toast.error('Failed to delete'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const { error } = await supabase.from('government_projects')
        .update({ status, updated_at: new Date().toISOString() }).eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Status updated'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyProject); setShowForm(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title || '', description: p.description || '',
      status: p.status || 'planned', category: p.category || '',
      budget_allocated: p.budget_allocated?.toString() || '',
      location: p.location || '', county: p.county || '',
      priority: p.priority || 'medium',
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyProject); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Government Projects</h3>
        <div className="flex gap-2">
          {['all', 'pending', 'active', 'completed', 'stalled'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" />Add Project</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !projects?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FolderKanban className="w-12 h-12 mx-auto mb-3" />No projects found.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <Card key={project.id} className="border-l-4 border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm truncate">{project.title}</h4>
                      <Badge variant={
                        project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' :
                        project.status === 'pending' ? 'outline' : 'destructive'
                      } className="text-xs">{project.status}</Badge>
                      {project.priority && <Badge variant="outline" className="text-xs capitalize">{project.priority}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description && project.description.length > 120 ? `${project.description.substring(0, 120)}...` : project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" />{project.government_institutions?.name || 'No institution'}</span>
                      {project.budget_allocated && <span>Budget: KSh {Number(project.budget_allocated).toLocaleString()}</span>}
                      {project.county && <span>{project.county}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {project.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600"
                          onClick={() => updateStatusMutation.mutate({ projectId: project.id, status: 'active' })}>
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ projectId: project.id, status: 'rejected' })}>
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(project)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(project.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Project' : 'Create Project'}</DialogTitle>
            <DialogDescription>Fill in project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high', 'critical'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Budget (KSh)</Label><Input value={form.budget_allocated} onChange={e => setForm({ ...form, budget_allocated: e.target.value })} type="number" /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Infrastructure, Health..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>County</Label><Input value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>This government project will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ────────────────────── Promises CRUD ──────────────────────
const PROMISE_STATUSES = ['pending', 'in_progress', 'fulfilled', 'partially_fulfilled', 'broken', 'abandoned'];

const emptyPromise = {
  title: '', description: '', category: 'governance', status: 'pending',
  office_holder_id: '', progress: 0,
};

function PromisesSubTab() {
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyPromise);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: promises, isLoading, refetch } = useQuery({
    queryKey: ['admin-promises', filter],
    queryFn: async () => {
      let query = supabase.from('office_promises').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: officeHolders } = useQuery({
    queryKey: ['admin-office-holders-for-promises'],
    queryFn: async () => {
      const { data } = await supabase.from('office_holders')
        .select('id, profiles(display_name), government_positions(title)')
        .eq('verification_status', 'verified').limit(100);
      return data || [];
    },
    enabled: showForm,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, description: form.description,
        category: form.category, status: form.status,
        office_holder_id: form.office_holder_id || undefined,
        progress: form.progress,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from('office_promises').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        if (!form.office_holder_id) throw new Error('Office holder is required');
        const { error } = await supabase.from('office_promises').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Promise updated' : 'Promise created');
      closeForm();
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('office_promises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Promise deleted'); setDeleteId(null); refetch(); },
    onError: () => toast.error('Failed to delete'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyPromise); setShowForm(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title || '', description: p.description || '',
      category: p.category || 'governance', status: p.status || 'pending',
      office_holder_id: p.office_holder_id || '', progress: p.progress || 0,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyPromise); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Official Promises</h3>
        <div className="flex gap-2">
          {['all', 'pending', 'in_progress', 'fulfilled', 'broken'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f.replace('_', ' ')}</Button>
          ))}
          <Button size="sm" onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" />Add Promise</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !promises?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-3" />No promises found.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promises.map(promise => (
            <Card key={promise.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{promise.title}</h4>
                      <Badge variant={
                        promise.status === 'fulfilled' ? 'default' :
                        promise.status === 'broken' ? 'destructive' :
                        promise.status === 'in_progress' ? 'secondary' : 'outline'
                      } className="text-xs capitalize">{promise.status?.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{promise.description || 'No description'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{promise.category}</span>
                      <span>Progress: {promise.progress}%</span>
                      {promise.deadline && <span>Due: {new Date(promise.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(promise)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(promise.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promise' : 'Create Promise'}</DialogTitle>
            <DialogDescription>Track official promises and their fulfillment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description *</Label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            </div>
            {!editing && (
              <div>
                <Label>Office Holder *</Label>
                <Select value={form.office_holder_id} onValueChange={v => setForm({ ...form, office_holder_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select official..." /></SelectTrigger>
                  <SelectContent>
                    {officeHolders?.map((oh: any) => (
                      <SelectItem key={oh.id} value={oh.id}>
                        {oh.profiles?.display_name || 'Unknown'} — {oh.government_positions?.title || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROMISE_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="governance, health..." />
              </div>
            </div>
            <div>
              <Label>Progress ({form.progress}%)</Label>
              <input type="range" min={0} max={100} value={form.progress}
                onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })}
                className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promise?</AlertDialogTitle>
            <AlertDialogDescription>This promise record will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ────────────────────── Civic Actions (enhanced with status management) ──────────────────────
function CivicActionsSubTab() {
  const [filter, setFilter] = useState<string>('all');

  const { data: actions, isLoading, refetch } = useQuery({
    queryKey: ['admin-civic-actions', filter],
    queryFn: async () => {
      let query = supabase.from('civic_actions')
        .select(`*, profiles:profiles!civic_actions_user_id_fkey(display_name), government_institutions(name)`)
        .order('created_at', { ascending: false }).limit(50);
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('civic_actions')
        .update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Status updated'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Civic Actions</h3>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f.replace('_', ' ')}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !actions?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3" />No civic actions found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {actions.map(action => (
            <Card key={action.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      <Badge variant="outline" className="text-xs">{action.status}</Badge>
                      {action.urgency && (
                        <Badge variant={action.urgency === 'high' || action.urgency === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{action.urgency}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{action.category} • {action.location_text || 'No location'}</p>
                    {action.description && <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {action.profiles?.display_name && <span>By: {action.profiles.display_name}</span>}
                      <span>{new Date(action.created_at).toLocaleDateString()}</span>
                      {action.support_count > 0 && <span>{action.support_count} supporters</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Select onValueChange={(v) => updateStatusMutation.mutate({ id: action.id, status: v })}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Update..." /></SelectTrigger>
                      <SelectContent>
                        {['open', 'in_progress', 'resolved', 'closed', 'escalated'].map(s => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────── Elections (kept from original) ──────────────────────
function ElectionsSubTab() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['admin-elections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('election_cycles')
        .select('*').order('election_date', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Election Cycles</h3>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !elections?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-3" />No election cycles found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {elections.map(election => (
            <Card key={election.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">{election.election_type} Election</h4>
                    <div className="text-xs text-muted-foreground">{new Date(election.election_date).toLocaleDateString()}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{election.results_certified ? 'Certified' : 'Pending'}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

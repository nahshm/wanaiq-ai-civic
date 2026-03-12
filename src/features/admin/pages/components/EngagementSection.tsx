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
import { Switch } from '@/components/ui/switch';
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
  Trophy, Award, Video, Building, CheckCircle, XCircle,
  Loader2, RefreshCw, Eye, Users, Target, Star, Plus,
  Pencil, Trash2, BookOpen, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

export default function EngagementSection() {
  return (
    <Tabs defaultValue="quests" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="quests" className="gap-2"><Target className="w-4 h-4" />Quests</TabsTrigger>
        <TabsTrigger value="badges" className="gap-2"><Award className="w-4 h-4" />Badges</TabsTrigger>
        <TabsTrigger value="education" className="gap-2"><BookOpen className="w-4 h-4" />Education Content</TabsTrigger>
        <TabsTrigger value="clips" className="gap-2"><Video className="w-4 h-4" />CivicClips</TabsTrigger>
        <TabsTrigger value="ngos" className="gap-2"><Building className="w-4 h-4" />NGO Partners</TabsTrigger>
      </TabsList>

      <TabsContent value="quests"><QuestsSubTab /></TabsContent>
      <TabsContent value="badges"><BadgesSubTab /></TabsContent>
      <TabsContent value="education"><EducationContentSubTab /></TabsContent>
      <TabsContent value="clips"><CivicClipsSubTab /></TabsContent>
      <TabsContent value="ngos"><NGOPartnersSubTab /></TabsContent>
    </Tabs>
  );
}

// ────────────────────── Quests CRUD ──────────────────────
const QUEST_CATEGORIES = ['civic', 'education', 'community', 'accountability', 'governance', 'general'];
const QUEST_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const QUEST_VERIFICATION_TYPES = ['auto', 'manual', 'peer', 'ai'];

const emptyQuest = {
  title: '', description: '', category: 'civic', points: 10,
  difficulty: 'easy', verification_type: 'auto', icon: '🎯',
  is_active: true,
};

function QuestsSubTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<any>(null);
  const [form, setForm] = useState(emptyQuest);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: quests, isLoading, refetch } = useQuery({
    queryKey: ['admin-quests', filter],
    queryFn: async () => {
      let query = supabase.from('quests').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter === 'active') query = query.eq('is_active', true);
      else if (filter === 'inactive') query = query.eq('is_active', false);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: questStats } = useQuery({
    queryKey: ['admin-quest-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('user_quests').select('quest_id, status');
      const stats: Record<string, { total: number; completed: number }> = {};
      (data || []).forEach(uq => {
        if (!stats[uq.quest_id]) stats[uq.quest_id] = { total: 0, completed: 0 };
        stats[uq.quest_id].total++;
        if (uq.status === 'completed') stats[uq.quest_id].completed++;
      });
      return stats;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        points: form.points,
        difficulty: form.difficulty,
        verification_type: form.verification_type,
        icon: form.icon,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };
      if (editingQuest) {
        const { error } = await supabase.from('quests').update(payload).eq('id', editingQuest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quests').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingQuest ? 'Quest updated' : 'Quest created');
      closeForm();
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save quest'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Quest deleted'); setDeleteId(null); refetch(); },
    onError: () => toast.error('Failed to delete quest'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('quests').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Status updated'); refetch(); },
    onError: () => toast.error('Failed to update'),
  });

  const openCreate = () => { setEditingQuest(null); setForm(emptyQuest); setShowForm(true); };
  const openEdit = (quest: any) => {
    setEditingQuest(quest);
    setForm({
      title: quest.title || '', description: quest.description || '', category: quest.category || 'civic',
      points: quest.points || 10, difficulty: quest.difficulty || 'easy',
      verification_type: quest.verification_type || 'auto', icon: quest.icon || '🎯',
      is_active: quest.is_active ?? true,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingQuest(null); setForm(emptyQuest); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quest Management</h3>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" />Create Quest</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !quests?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3" />No quests found.
          <Button className="mt-3" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Create First Quest</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {quests.map(quest => {
            const stats = questStats?.[quest.id] || { total: 0, completed: 0 };
            const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <Card key={quest.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{quest.icon}</span>
                        <h4 className="font-medium text-sm">{quest.title}</h4>
                        <Badge variant={quest.is_active ? 'default' : 'secondary'} className="text-xs">
                          {quest.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">{quest.difficulty}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {quest.description && quest.description.length > 120 ? `${quest.description.substring(0, 120)}...` : quest.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Category: {quest.category}</span>
                        <span>Points: {quest.points}</span>
                        <span>Participants: {stats.total}</span>
                        <span>Completion: {rate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={quest.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: quest.id, active: v })} />
                      <Button size="sm" variant="ghost" onClick={() => openEdit(quest)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(quest.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuest ? 'Edit Quest' : 'Create Quest'}</DialogTitle>
            <DialogDescription>Fill in quest details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Complete your profile" />
            </div>
            <div>
              <Label>Description</Label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" placeholder="Describe what users need to do..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUEST_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUEST_DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Points</Label>
                <Input type="number" value={form.points} onChange={e => setForm({ ...form, points: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div>
                <Label>Verification</Label>
                <Select value={form.verification_type} onValueChange={v => setForm({ ...form, verification_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUEST_VERIFICATION_TYPES.map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingQuest ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quest?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this quest. Users who started it will lose progress.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ────────────────────── Badges CRUD ──────────────────────
const BADGE_CATEGORIES = ['civic', 'education', 'community', 'engagement', 'special'];
const BADGE_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

const emptyBadge = {
  name: '', description: '', icon: '⭐', category: 'civic',
  tier: 'bronze', points_reward: 0, is_active: true,
};

function BadgesSubTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [form, setForm] = useState(emptyBadge);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: badges, isLoading, refetch } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('badges').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: badgeStats } = useQuery({
    queryKey: ['admin-badge-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('user_badges').select('badge_id');
      const stats: Record<string, number> = {};
      (data || []).forEach(ub => { stats[ub.badge_id] = (stats[ub.badge_id] || 0) + 1; });
      return stats;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, description: form.description, icon: form.icon,
        category: form.category, tier: form.tier, points_reward: form.points_reward,
        is_active: form.is_active, requirements: {},
      };
      if (editingBadge) {
        const { error } = await supabase.from('badges').update(payload).eq('id', editingBadge.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('badges').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingBadge ? 'Badge updated' : 'Badge created');
      closeForm();
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save badge'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('badges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Badge deleted'); setDeleteId(null); refetch(); },
    onError: () => toast.error('Failed to delete badge'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('badges').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Status updated'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  const openCreate = () => { setEditingBadge(null); setForm(emptyBadge); setShowForm(true); };
  const openEdit = (badge: any) => {
    setEditingBadge(badge);
    setForm({
      name: badge.name || '', description: badge.description || '', icon: badge.icon || '⭐',
      category: badge.category || 'civic', tier: badge.tier || 'bronze',
      points_reward: badge.points_reward || 0, is_active: badge.is_active ?? true,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingBadge(null); setForm(emptyBadge); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Badge Management</h3>
        <Button size="sm" onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" />Create Badge</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !badges?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-3" />No badges found.
          <Button className="mt-3" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Create First Badge</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(badge => {
            const count = badgeStats?.[badge.id] || 0;
            return (
              <Card key={badge.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      {badge.icon ? <span className="text-2xl">{badge.icon}</span> : <Star className="w-6 h-6 text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{badge.name}</h4>
                      <div className="text-xs text-muted-foreground">{badge.category} · {badge.tier}</div>
                    </div>
                    <Switch checked={badge.is_active ?? true} onCheckedChange={(v) => toggleMutation.mutate({ id: badge.id, active: v })} />
                  </div>
                  {badge.description && <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Awarded: {count} times</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(badge)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(badge.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
            <DialogDescription>Define badge properties below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="First Post" />
            </div>
            <div>
              <Label>Description</Label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BADGE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BADGE_TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Points Reward</Label>
                <Input type="number" value={form.points_reward} onChange={e => setForm({ ...form, points_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingBadge ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Badge?</AlertDialogTitle>
            <AlertDialogDescription>This badge will be permanently removed.</AlertDialogDescription>
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

// ────────────────────── Education Content CRUD ──────────────────────
const CONTENT_CATEGORIES = ['general', 'governance', 'rights', 'constitution', 'civic-education', 'budgets', 'elections'];
const CONTENT_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const CONTENT_STATUSES = ['draft', 'published', 'archived'];

const emptyContent = {
  title: '', description: '', content: '', category: 'general',
  difficulty: 'beginner', status: 'draft', is_featured: false,
  assigned_to: '',  assignment_notes: '',
};

function EducationContentSubTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyContent);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: contents, isLoading, refetch } = useQuery({
    queryKey: ['admin-education-content', filter],
    queryFn: async () => {
      let query = (supabase as any).from('education_content')
        .select('*, author:profiles!education_content_author_id_fkey(display_name, username), assignee:profiles!education_content_assigned_to_fkey(display_name, username)')
        .order('created_at', { ascending: false }).limit(50);
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: assignableUsers } = useQuery({
    queryKey: ['admin-assignable-users-edu'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, display_name, username').limit(100);
      return data || [];
    },
    enabled: showForm,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, description: form.description || null,
        content: form.content, category: form.category,
        difficulty: form.difficulty, status: form.status,
        is_featured: form.is_featured,
        assigned_to: form.assigned_to || null,
        assignment_notes: form.assignment_notes || null,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await (supabase as any).from('education_content').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        payload.author_id = user?.id;
        const { error } = await (supabase as any).from('education_content').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Content updated' : 'Content created');
      closeForm();
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('education_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Content deleted'); setDeleteId(null); refetch(); },
    onError: () => toast.error('Failed to delete'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyContent); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      title: c.title || '', description: c.description || '', content: c.content || '',
      category: c.category || 'general', difficulty: c.difficulty || 'beginner',
      status: c.status || 'draft', is_featured: c.is_featured ?? false,
      assigned_to: c.assigned_to || '', assignment_notes: c.assignment_notes || '',
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyContent); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Education Content</h3>
        <div className="flex gap-2">
          {CONTENT_STATUSES.map(s => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'}
              onClick={() => setFilter(s as any)} className="capitalize">{s}</Button>
          ))}
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button size="sm" onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" />Create</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !contents?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3" />No education content found.
          <Button className="mt-3" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Create Content</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {contents.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{c.title}</h4>
                      <Badge variant={c.status === 'published' ? 'default' : c.status === 'archived' ? 'secondary' : 'outline'} className="text-xs capitalize">{c.status}</Badge>
                      {c.is_featured && <Badge className="text-xs bg-yellow-500 text-white">Featured</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mb-2">{c.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{c.category} · {c.difficulty}</span>
                      {c.author?.display_name && <span>By: {c.author.display_name}</span>}
                      {c.assignee?.display_name && (
                        <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" />Assigned: {c.assignee.display_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Content' : 'Create Education Content'}</DialogTitle>
            <DialogDescription>Create or assign educational articles for the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Understanding the Constitution" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A brief summary..." />
            </div>
            <div>
              <Label>Content *</Label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y font-mono"
                placeholder="Article body (supports markdown)..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/-/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
              <h4 className="text-sm font-medium flex items-center gap-1.5"><UserPlus className="w-4 h-4" />Assign to User (optional)</h4>
              <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Select user to assign..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {assignableUsers?.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.display_name || u.username || u.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.assigned_to && (
                <div>
                  <Label>Assignment Notes</Label>
                  <textarea value={form.assignment_notes} onChange={e => setForm({ ...form, assignment_notes: e.target.value })} rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                    placeholder="Instructions for the assigned writer..." />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} />
              <Label>Featured</Label>
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
            <AlertDialogTitle>Delete Content?</AlertDialogTitle>
            <AlertDialogDescription>This education content will be permanently deleted.</AlertDialogDescription>
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

// ────────────────────── CivicClips (existing, kept) ──────────────────────
function CivicClipsSubTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  const { data: clips, isLoading, refetch } = useQuery({
    queryKey: ['admin-civic-clips', filter],
    queryFn: async () => {
      let query = supabase.from('civic_clips')
        .select(`*, posts(title, created_at, profiles(display_name))`)
        .order('created_at', { ascending: false }).limit(50);
      if (filter === 'featured') query = query.eq('is_featured', true);
      else if (filter === 'pending') query = query.eq('processing_status', 'pending');
      else if (filter === 'approved') query = query.eq('processing_status', 'completed');
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const featureMutation = useMutation({
    mutationFn: async ({ clipId, featured }: { clipId: string; featured: boolean }) => {
      const { error } = await supabase.from('civic_clips')
        .update({ is_featured: featured, featured_at: featured ? new Date().toISOString() : null })
        .eq('id', clipId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Clip updated'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">CivicClips Moderation</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'featured'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !clips?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Video className="w-12 h-12 mx-auto mb-3" />No clips found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {clips.map(clip => (
            <Card key={clip.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {clip.thumbnail_url && <img src={clip.thumbnail_url} alt="Clip" className="w-16 h-16 rounded object-cover" />}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{clip.posts?.title || 'Untitled'}</h4>
                        {clip.is_featured && <Badge variant="default" className="text-xs">Featured</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{clip.posts?.profiles?.display_name} • {clip.category} • {clip.duration}s</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={clip.processing_status === 'completed' ? 'secondary' : clip.processing_status === 'failed' ? 'destructive' : 'outline'} className="text-xs">{clip.processing_status}</Badge>
                        <span className="text-xs text-muted-foreground">Views: {clip.views_count || 0}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => featureMutation.mutate({ clipId: clip.id, featured: !clip.is_featured })}>
                    {clip.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────── NGO Partners (existing, kept) ──────────────────────
function NGOPartnersSubTab() {
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['admin-ngo-partners', filter],
    queryFn: async () => {
      let query = supabase.from('ngo_partners').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter === 'active') query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">NGO Partner Applications</h3>
        <div className="flex gap-2">
          {(['all', 'active'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !partners?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Building className="w-12 h-12 mx-auto mb-3" />No NGO partners found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {partners.map(partner => (
            <Card key={partner.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{partner.name}</h4>
                      <Badge variant={partner.is_active ? 'default' : 'secondary'} className="text-xs">{partner.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{partner.description || 'No description'}</p>
                    <p className="text-xs text-muted-foreground">Contact: {partner.contact_email}</p>
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

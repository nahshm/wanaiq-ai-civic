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
  Users, Shield, UserCheck, Search, Loader2,
  CheckCircle, XCircle, Clock, Building, MapPin, Calendar, FileText,
  ChevronDown, ChevronRight, ShieldAlert, UserPlus, AlertTriangle, Ban,
  ExternalLink, ShieldOff
} from 'lucide-react';
import { toast } from 'sonner';
import { Constants } from '@/integrations/supabase/types';

const APP_ROLES = Constants.public.Enums.app_role;

export default function PeopleSection() {
  return (
    <Tabs defaultValue="users" className="space-y-6">
      <TabsList>
        <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" />Users</TabsTrigger>
        <TabsTrigger value="moderators" className="gap-2"><Shield className="w-4 h-4" />Moderators</TabsTrigger>
        <TabsTrigger value="officials" className="gap-2"><UserCheck className="w-4 h-4" />Officials & Verification</TabsTrigger>
      </TabsList>

      <TabsContent value="users"><UsersSubTab /></TabsContent>
      <TabsContent value="moderators"><ModeratorsSubTab /></TabsContent>
      <TabsContent value="officials"><OfficialsSubTab /></TabsContent>
    </Tabs>
  );
}

// ────────────────────── Users ──────────────────────
function UsersSubTab() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<string>('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, page],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (searchTerm) {
        q = q.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userRoles, refetch: refetchRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('id, user_id, role');
      const map: Record<string, Array<{ id: string; role: string }>> = {};
      (data || []).forEach(r => {
        if (!map[r.user_id]) map[r.user_id] = [];
        map[r.user_id].push({ id: r.id, role: r.role });
      });
      return map;
    },
  });

  const { data: userWarnings } = useQuery({
    queryKey: ['admin-user-warnings-count'],
    queryFn: async () => {
      const { data } = await supabase.from('user_warnings').select('user_id, severity');
      const map: Record<string, number> = {};
      (data || []).forEach(w => { map[w.user_id] = (map[w.user_id] || 0) + 1; });
      return map;
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId, role: role as any, assigned_by: currentUser?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Role assigned'); refetchRoles(); setRoleToAssign(''); },
    onError: (err: any) => toast.error(err.message?.includes('duplicate') ? 'User already has this role' : 'Failed to assign role'),
  });

  const revokeRoleMutation = useMutation({
    mutationFn: async (roleRecordId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleRecordId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Role revoked'); refetchRoles(); },
    onError: () => toast.error('Failed to revoke role'),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.from('user_warnings').insert({
        user_id: userId, issued_by: 'admin', reason, severity: 'temp_ban',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-user-warnings-count'] });
    },
    onError: () => toast.error('Failed to suspend user'),
  });

  const handleSearch = () => { setSearchTerm(searchQuery); setPage(0); };
  const totalUsers = users?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search by name or username..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} className="pl-10" />
        </div>
        <Button onClick={handleSearch} variant="outline">Search</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Users ({totalUsers}{totalUsers >= PAGE_SIZE ? '+' : ''})</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground self-center">Page {page + 1}</span>
              <Button size="sm" variant="outline" disabled={totalUsers < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !users?.length ? (
            <p className="text-center py-8 text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map(user => {
                const roles = userRoles?.[user.id] || [];
                const warningCount = userWarnings?.[user.id] || 0;
                const isExpanded = expandedUserId === user.id;

                return (
                  <div key={user.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {user.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.display_name || user.username || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">@{user.username || user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {warningCount > 0 && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />{warningCount}</Badge>}
                        {roles.map(r => (
                          <Badge key={r.id} variant={r.role === 'super_admin' ? 'destructive' : r.role === 'admin' ? 'default' : 'outline'} className="text-xs">{r.role}</Badge>
                        ))}
                        {user.is_verified && <Badge className="text-xs bg-green-600 text-white">Verified</Badge>}
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 border-t bg-background space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div><span className="text-muted-foreground text-xs">User ID</span><p className="font-mono text-xs truncate">{user.id}</p></div>
                          <div><span className="text-muted-foreground text-xs">Joined</span><p className="text-xs">{new Date(user.created_at).toLocaleDateString()}</p></div>
                          <div><span className="text-muted-foreground text-xs">County</span><p className="text-xs">{user.county || 'Not set'}</p></div>
                          <div><span className="text-muted-foreground text-xs">Warnings</span><p className="text-xs">{warningCount} total</p></div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" />Role Management</h4>
                          <div className="flex flex-wrap gap-2 items-center">
                            {roles.length > 0 ? roles.map(r => (
                              <div key={r.id} className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">{r.role}</Badge>
                                <button onClick={() => revokeRoleMutation.mutate(r.id)} className="text-destructive hover:text-destructive/80 transition-colors" disabled={revokeRoleMutation.isPending}>
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )) : <span className="text-xs text-muted-foreground">No roles assigned</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={roleToAssign} onValueChange={setRoleToAssign}>
                              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Select role to assign" /></SelectTrigger>
                              <SelectContent>{APP_ROLES.map(role => <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button size="sm" className="h-8 gap-1" disabled={!roleToAssign || assignRoleMutation.isPending}
                              onClick={() => assignRoleMutation.mutate({ userId: user.id, role: roleToAssign })}>
                              <UserPlus className="w-3.5 h-3.5" />Assign
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                            disabled={suspendMutation.isPending} onClick={() => {
                              const reason = prompt('Suspension reason:');
                              if (reason) suspendMutation.mutate({ userId: user.id, reason });
                            }}>
                            <Ban className="w-3.5 h-3.5" />Suspend
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────── Moderators ──────────────────────
function ModeratorsSubTab() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [selectedRole, setSelectedRole] = useState('moderator');

  const { data: moderators, isLoading, refetch } = useQuery({
    queryKey: ['admin-moderators'],
    queryFn: async () => {
      const { data } = await supabase.from('community_moderators')
        .select('*, community:communities(name, display_name)').limit(50);
      if (!data?.length) return [];
      const userIds = data.map(m => m.user_id).filter(Boolean);
      const { data: profiles } = await supabase.from('profiles')
        .select('id, display_name, username, avatar_url').in('id', userIds);
      const profilesMap: Record<string, any> = {};
      (profiles || []).forEach(p => { profilesMap[p.id] = p; });
      return data.map(m => ({ ...m, user: profilesMap[m.user_id] || null }));
    },
  });

  const { data: communities } = useQuery({
    queryKey: ['admin-communities-list'],
    queryFn: async () => {
      const { data } = await (supabase.from('communities').select('id, name, display_name') as any).eq('is_active', true).limit(100);
      return (data || []) as Array<{ id: string; name: string; display_name: string }>;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['admin-assignable-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, display_name, username').limit(100);
      return data || [];
    },
    enabled: showAssignForm,
  });

  const assignModeratorMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !selectedCommunity) throw new Error('Missing selection');
      const { error } = await supabase.from('community_moderators').insert({
        user_id: selectedUser, community_id: selectedCommunity,
        role: selectedRole as 'moderator' | 'admin', assigned_by: currentUser?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Moderator assigned');
      setShowAssignForm(false); setSelectedUser(''); setSelectedCommunity('');
      refetch();
    },
    onError: (err: any) => toast.error(err.message?.includes('duplicate') ? 'Already a moderator' : 'Failed'),
  });

  const removeModerationMutation = useMutation({
    mutationFn: async (moderationId: string) => {
      const { error } = await supabase.from('community_moderators').delete().eq('id', moderationId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Moderator removed'); refetch(); },
    onError: () => toast.error('Failed'),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Community Moderators ({moderators?.length || 0})</span>
            <Button size="sm" onClick={() => setShowAssignForm(!showAssignForm)} className="gap-2">
              <UserPlus className="w-4 h-4" />{showAssignForm ? 'Cancel' : 'Assign Moderator'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAssignForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/20 space-y-3">
              <h4 className="font-medium text-sm">Assign New Moderator</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>{users?.map(user => <SelectItem key={user.id} value={user.id}>{user.display_name || user.username}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                  <SelectTrigger><SelectValue placeholder="Select community" /></SelectTrigger>
                  <SelectContent>{communities?.map(c => <SelectItem key={c.id} value={c.id}>{c.display_name || c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => assignModeratorMutation.mutate()} disabled={!selectedUser || !selectedCommunity || assignModeratorMutation.isPending} size="sm" className="gap-2">
                <CheckCircle className="w-4 h-4" />Assign
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !moderators?.length ? (
            <p className="text-center py-8 text-muted-foreground">No moderators found.</p>
          ) : (
            <div className="space-y-2">
              {moderators.map(mod => (
                <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      {mod.user?.display_name?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{mod.user?.display_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">c/{mod.community?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{mod.role}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => removeModerationMutation.mutate(mod.id)}
                      disabled={removeModerationMutation.isPending} className="text-destructive hover:text-destructive/80 h-8 w-8 p-0">
                      <XCircle className="w-4 h-4" />
                    </Button>
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

// ────────────────────── Officials & Verification (Enhanced) ──────────────────────
function OfficialsSubTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'pending' | 'verified' | 'all'>('pending');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);

  const { data: claims, isLoading, refetch } = useQuery({
    queryKey: ['admin-official-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_holders')
        .select(`
          *,
          profiles!office_holders_user_id_fkey(id, username, display_name, avatar_url),
          government_positions(id, title, governance_level, country_code, jurisdiction_name)
        `)
        .order('claimed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(claim => ({
        ...claim,
        profile: claim.profiles,
        position: claim.government_positions
      }));
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ claimId, approved, notes }: { claimId: string; approved: boolean; notes?: string }) => {
      const claim = claims?.find(c => c.id === claimId);
      if (!claim) throw new Error('Claim not found');

      const { error } = await supabase.from('office_holders')
        .update({
          verification_status: approved ? 'verified' : 'rejected',
          verified_at: approved ? new Date().toISOString() : null,
          verified_by: user?.id || null,
          is_active: approved,
          rejection_notes: approved ? null : (notes || null),
        })
        .eq('id', claimId);
      if (error) throw error;

      if (approved && claim.user_id) {
        await supabase.from('profiles').update({
          is_verified: true,
          official_position: claim.position?.title,
          official_position_id: claim.position?.id,
          updated_at: new Date().toISOString(),
        }).eq('id', claim.user_id);
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? 'Claim approved!' : 'Claim rejected.');
      setShowRejectDialog(null);
      setRejectionNotes('');
      refetch();
    },
    onError: () => toast.error('Failed to process claim'),
  });

  const revokeMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const claim = claims?.find(c => c.id === claimId);
      if (!claim) throw new Error('Claim not found');

      const { error } = await supabase.from('office_holders')
        .update({ verification_status: 'rejected', is_active: false })
        .eq('id', claimId);
      if (error) throw error;

      if (claim.user_id) {
        await supabase.from('profiles').update({
          is_verified: false,
          official_position: null,
          official_position_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', claim.user_id);
      }
    },
    onSuccess: () => { toast.success('Verification revoked'); refetch(); },
    onError: () => toast.error('Failed to revoke'),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await supabase.from('office_holders')
        .update({ is_active: false }).eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Official deactivated'); refetch(); },
    onError: () => toast.error('Failed to deactivate'),
  });

  const filtered = claims?.filter(c =>
    activeView === 'all' ? true :
    activeView === 'pending' ? c.verification_status === 'pending' :
    c.verification_status === 'verified'
  ) || [];

  const pendingCount = claims?.filter(c => c.verification_status === 'pending').length || 0;
  const verifiedCount = claims?.filter(c => c.verification_status === 'verified').length || 0;

  // Parse proof documents
  const getProofDetails = (proofDocs: any) => {
    if (!proofDocs) return null;
    try {
      const docs = typeof proofDocs === 'string' ? JSON.parse(proofDocs) : proofDocs;
      return docs;
    } catch { return null; }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <Clock className="text-orange-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending Claims</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <CheckCircle className="text-green-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{verifiedCount}</div>
          <div className="text-xs text-muted-foreground">Verified</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Users className="text-blue-500 mb-1 w-5 h-5" />
          <div className="text-2xl font-bold">{claims?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Total Claims</div>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        {(['pending', 'verified', 'all'] as const).map(v => (
          <Button key={v} size="sm" variant={activeView === v ? 'default' : 'outline'} onClick={() => setActiveView(v)} className="capitalize gap-1.5">
            {v === 'pending' && <Clock className="w-3.5 h-3.5" />}
            {v === 'verified' && <CheckCircle className="w-3.5 h-3.5" />}
            {v === 'all' && <Users className="w-3.5 h-3.5" />}
            {v} {v === 'pending' ? `(${pendingCount})` : v === 'verified' ? `(${verifiedCount})` : ''}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !filtered.length ? (
            <p className="text-center py-8 text-muted-foreground">No {activeView} claims found.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(claim => {
                const isExpanded = expandedClaimId === claim.id;
                const proof = getProofDetails(claim.proof_documents);

                return (
                  <div key={claim.id} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {claim.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{claim.profile?.display_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">@{claim.profile?.username}</div>
                          <div className="mt-1.5 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Building className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">{claim.position?.title || 'Unknown Position'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              {claim.position?.governance_level} — {claim.position?.jurisdiction_name || claim.position?.country_code}
                            </div>
                            {claim.term_start && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(claim.term_start).toLocaleDateString()} — {claim.term_end ? new Date(claim.term_end).toLocaleDateString() : 'N/A'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {claim.verification_method || 'unspecified'}
                            </Badge>
                            {claim.is_active === false && claim.verification_status === 'verified' && (
                              <Badge variant="secondary" className="text-xs">Deactivated</Badge>
                            )}
                          </div>

                          {/* Expand/collapse */}
                          <button onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                            className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline">
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {isExpanded ? 'Hide details' : 'View proof & details'}
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-3 p-3 border rounded-lg bg-background space-y-3">
                              <h5 className="text-xs font-semibold">Proof Documents</h5>
                              {proof ? (
                                <div className="space-y-2">
                                  {proof.document_url && (
                                    <a href={proof.document_url} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-primary flex items-center gap-1 hover:underline">
                                      <ExternalLink className="w-3 h-3" />View Document
                                    </a>
                                  )}
                                  {proof.official_email && (
                                    <div className="text-xs"><span className="text-muted-foreground">Official Email:</span> {proof.official_email}</div>
                                  )}
                                  {proof.official_website && (
                                    <a href={proof.official_website} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-primary flex items-center gap-1 hover:underline">
                                      <ExternalLink className="w-3 h-3" />Official Website
                                    </a>
                                  )}
                                  {proof.gazette_number && (
                                    <div className="text-xs"><span className="text-muted-foreground">Gazette #:</span> {proof.gazette_number}</div>
                                  )}
                                  {/* Render any other proof fields */}
                                  {Object.entries(proof).filter(([k]) => !['document_url', 'official_email', 'official_website', 'gazette_number'].includes(k)).map(([k, v]) => (
                                    <div key={k} className="text-xs">
                                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                                      {typeof v === 'string' && v.startsWith('http') ? (
                                        <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{String(v)}</a>
                                      ) : String(v)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No proof documents attached.</p>
                              )}

                              {claim.rejection_notes && (
                                <div className="mt-2 p-2 bg-destructive/10 rounded text-xs">
                                  <span className="font-semibold text-destructive">Rejection Notes:</span> {claim.rejection_notes}
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <div>Claim ID: <code className="bg-muted px-1 rounded">{claim.id}</code></div>
                                <div>Claimed at: {new Date(claim.claimed_at).toLocaleString()}</div>
                                {claim.verified_at && <div>Verified at: {new Date(claim.verified_at).toLocaleString()}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={
                          claim.verification_status === 'verified' ? 'default' :
                          claim.verification_status === 'rejected' ? 'destructive' : 'secondary'
                        } className="text-xs capitalize">{claim.verification_status}</Badge>

                        {claim.verification_status === 'pending' && (
                          <div className="flex gap-2 mt-1">
                            <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                              disabled={approvalMutation.isPending}
                              onClick={() => approvalMutation.mutate({ claimId: claim.id, approved: true })}>
                              <CheckCircle className="w-3.5 h-3.5" />Approve
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                              disabled={approvalMutation.isPending}
                              onClick={() => { setShowRejectDialog(claim.id); setRejectionNotes(''); }}>
                              <XCircle className="w-3.5 h-3.5" />Reject
                            </Button>
                          </div>
                        )}

                        {claim.verification_status === 'verified' && (
                          <div className="flex gap-2 mt-1">
                            <Button size="sm" variant="outline" className="gap-1 text-destructive text-xs"
                              disabled={revokeMutation.isPending}
                              onClick={() => { if (confirm('Revoke this official\'s verification?')) revokeMutation.mutate(claim.id); }}>
                              <ShieldOff className="w-3 h-3" />Revoke
                            </Button>
                            {claim.is_active && (
                              <Button size="sm" variant="outline" className="gap-1 text-xs"
                                disabled={deactivateMutation.isPending}
                                onClick={() => deactivateMutation.mutate(claim.id)}>
                                <Ban className="w-3 h-3" />Deactivate
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={() => setShowRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this position claim.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Rejection Notes</Label>
            <textarea value={rejectionNotes} onChange={e => setRejectionNotes(e.target.value)} rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y mt-1"
              placeholder="Insufficient evidence, document expired, etc." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive"
              disabled={approvalMutation.isPending}
              onClick={() => showRejectDialog && approvalMutation.mutate({
                claimId: showRejectDialog, approved: false, notes: rejectionNotes
              })}>
              {approvalMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

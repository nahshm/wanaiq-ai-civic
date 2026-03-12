import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Building2, Globe, Mail, Phone, MapPin, Shield, AlertCircle,
    BadgeCheck, ArrowLeft, Loader2, MessageSquare, CheckCircle2,
    ChevronRight, ExternalLink, Lock, Info, Users, Star,
    Clock, XCircle, ThumbsUp, CheckCircle, LucideIcon,
    AlertTriangle, Send, Filter
} from 'lucide-react';
import { ActionDetailSheet } from '@/components/dashboard/ActionDetailSheet';
import { cn } from '@/lib/utils';
import { PageTour } from '@/components/tour/PageTour';
import { INSTITUTION_TOUR_KEY, INSTITUTION_TOUR_STEPS } from '@/components/tour/InstitutionTourSteps';

const STATUS_CONFIG: Record<string, { icon: LucideIcon; color: string; label: string }> = {
    submitted:     { icon: Clock,         color: 'bg-gray-500',   label: 'Submitted' },
    acknowledged:  { icon: AlertCircle,   color: 'bg-blue-500',   label: 'Acknowledged' },
    in_progress:   { icon: Clock,         color: 'bg-yellow-500', label: 'In Progress' },
    resolved:      { icon: CheckCircle,   color: 'bg-green-500',  label: 'Resolved' },
    rejected:      { icon: XCircle,       color: 'bg-red-500',    label: 'Rejected' },
};

const URGENCY_COLOR: Record<string, string> = {
    high:   'border-l-red-500',
    medium: 'border-l-yellow-500',
    low:    'border-l-gray-300',
};

// ─── Issue Card ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IssueCard = ({ issue, onClick }: { issue: any; onClick: () => void }) => {
    const cfg = STATUS_CONFIG[issue.status || 'submitted'] || STATUS_CONFIG.submitted;
    const Icon = cfg.icon;

    return (
        <div className={`border-l-4 ${URGENCY_COLOR[issue.urgency || 'low'] || 'border-l-gray-300'} rounded-r-xl border border-border/50 p-4 hover:shadow-sm transition-all hover:border-violet-300/50 dark:hover:border-violet-700/50 bg-white dark:bg-slate-900 group`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                        {issue.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{issue.description}</p>
                </div>
                <Badge variant={issue.urgency === 'high' ? 'destructive' : 'secondary'} className="shrink-0 text-[10px] capitalize">
                    {issue.urgency} Priority
                </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50">
                        <Icon className={`w-3 h-3 ${cfg.color.replace('bg-', 'text-')}`} />
                        {cfg.label}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300">
                        <ThumbsUp className="w-3.5 h-3.5" /> {issue.support_count || 0}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClick} className="h-7 text-xs gap-1 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

type InstitutionTab = 'about' | 'issues' | 'updates';

const TABS = [
    { id: 'about' as InstitutionTab, label: 'About', icon: <Info className="w-4 h-4" /> },
    { id: 'issues' as InstitutionTab, label: 'Routed Issues', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'updates' as InstitutionTab, label: 'Updates', icon: <MessageSquare className="w-4 h-4" /> },
];

const SectionEmpty = ({ message, icon }: { message: string; icon?: React.ReactNode }) => (
    <div className="py-16 text-center space-y-3 text-slate-400">
        {icon && <div className="flex justify-center mb-2 opacity-30">{icon}</div>}
        <p className="text-sm font-medium">{message}</p>
    </div>
);

// ─── Dashboard Stat Card — matches user dashboard exactly ────────────────────
const DashStatCard = ({ icon: Icon, label, value, iconBg, iconColor, children }: {
    icon: React.ElementType; label: string; value: number | string;
    iconBg: string; iconColor: string; children?: React.ReactNode;
}) => (
    <div className="bg-card border border-border/60 rounded-2xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
        </div>
        <p className="text-3xl font-black tabular-nums text-foreground">{value}</p>
        {children && <div className="mt-1">{children}</div>}
    </div>
);

export default function InstitutionPage() {
    const { slug = '' } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<InstitutionTab>('about');
    const [claimMessage, setClaimMessage] = useState('');
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [issueFilter, setIssueFilter] = useState<'all' | 'submitted' | 'acknowledged' | 'in_progress' | 'resolved'>('all');

    // ─── Fetch institution ────────────────────────────────────────────────
    const { data: institution, isLoading, error } = useQuery({
        queryKey: ['institution', slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('government_institutions')
                .select('*')
                .eq('slug', slug)
                .single();
            if (error) throw error;
            return data;
        },
        retry: false,
    });

    // ─── Active handlers ──────────────────────────────────────────────────
    const { data: handlers = [] } = useQuery({
        queryKey: ['institution-handlers', institution?.id],
        enabled: !!institution?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('institution_handlers')
                .select('id, role, status, user_id, request_message, profiles!institution_handlers_user_id_fkey(username, full_name, avatar_url, is_verified)')
                .eq('institution_id', institution!.id)
                .eq('status', 'active');
            return data || [];
        },
    });

    // ─── Pending handlers ─────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isHandler = useMemo(() => handlers.some((h: any) => h.user_id === user?.id && h.status === 'active'), [handlers, user?.id]);
    
    const { data: pendingHandlers = [] } = useQuery({
        queryKey: ['institution-pending-handlers', institution?.id],
        enabled: !!institution?.id && isHandler,
        queryFn: async () => {
            const { data } = await supabase
                .from('institution_handlers')
                .select('id, role, status, user_id, request_message, created_at, profiles!institution_handlers_user_id_fkey(username, full_name, avatar_url, is_verified)')
                .eq('institution_id', institution!.id)
                .eq('status', 'pending');
            return data || [];
        },
    });

    // ─── Routed issues ────────────────────────────────────────────────────
    const { data: issues = [] } = useQuery({
        queryKey: ['institution-issues', institution?.id],
        enabled: !!institution?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('civic_actions')
                .select('id, title, description, urgency, status, created_at, location_text, support_count')
                .eq('institution_id', institution!.id)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(25);
            return data || [];
        },
    });

    // ─── Institution Updates ──────────────────────────────────────────────
    const { data: updates = [] } = useQuery({
        queryKey: ['institution-updates', institution?.id],
        enabled: !!institution?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('institution_updates')
                .select('id, title, content, created_at, author_id, profiles!institution_updates_author_id_fkey(full_name, avatar_url, username)')
                .eq('institution_id', institution!.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    // ─── Post Update Mutation ───────────────────────────────────────────
    const [newUpdateTitle, setNewUpdateTitle] = useState('');
    const [newUpdateContent, setNewUpdateContent] = useState('');
    
    const postUpdateMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Not logged in');
            const { error } = await supabase
                .from('institution_updates')
                .insert({
                    institution_id: institution!.id,
                    title: newUpdateTitle.trim(),
                    content: newUpdateContent.trim(),
                    author_id: user.id
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Update posted successfully' });
            setNewUpdateTitle('');
            setNewUpdateContent('');
            queryClient.invalidateQueries({ queryKey: ['institution-updates', institution?.id] });
        },
        onError: (err: Error) => {
            toast({ title: 'Failed to post update', description: err.message, variant: 'destructive' });
        }
    });

    // ─── Handler claim mutation ───────────────────────────────────────────
    const claimMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Login required');
            const { error } = await supabase.from('institution_handlers').insert({
                institution_id: institution!.id,
                user_id: user.id,
                request_message: claimMessage.trim(),
                status: 'pending',
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: '📨 Request submitted',
                description: institution?.jurisdiction_type === 'national'
                    ? 'Your request has been submitted to the platform administrators for review.'
                    : 'Your request has been submitted. The office holder will review your claim.',
            });
            setShowClaimForm(false);
            setClaimMessage('');
            queryClient.invalidateQueries({ queryKey: ['institution-handlers', institution?.id] });
        },
        onError: (err: Error) => {
            if (err.message.includes('unique')) {
                toast({ title: 'Already applied', description: 'You have already submitted a handler claim for this institution.', variant: 'destructive' });
            } else {
                toast({ title: 'Error', description: err.message, variant: 'destructive' });
            }
        },
    });

    // ─── Update Handler Mutation ──────────────────────────────────────────
    const updateHandlerStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'active' | 'rejected' }) => {
            if (!user) throw new Error('Not logged in');
            const { error } = await supabase
                .from('institution_handlers')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            toast({ title: variables.status === 'active' ? 'Request Approved' : 'Request Rejected' });
            queryClient.invalidateQueries({ queryKey: ['institution-handlers', institution?.id] });
            queryClient.invalidateQueries({ queryKey: ['institution-pending-handlers', institution?.id] });
        },
        onError: (err: Error) => {
            toast({ title: 'Error updating handler', description: err.message, variant: 'destructive' });
        }
    });

    // Community banner fallback — uses linked community's banner if institution hasn't set a custom one
    const { data: communityBranding } = useQuery<{ banner_url: string | null; avatar_url: string | null } | null>({
        queryKey: ['institution-community-branding', institution?.jurisdiction_name, institution?.jurisdiction_type],
        enabled: !!institution && !institution.banner_url,
        queryFn: async () => {
            const search = institution!.jurisdiction_name?.replace(' County', '').replace(' Constituency', '').trim() || '';
            if (!search) return null;
            const { data } = await (supabase
                .from('communities')
                .select('banner_url, avatar_url')
                .ilike('name', `%${search}%`) as any)
                .in('community_type', ['location', 'county', 'constituency', 'ward'])
                .limit(1)
                .maybeSingle();
            return data as { banner_url: string | null; avatar_url: string | null } | null;
        },
    });

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    if (error || !institution) return (
        <div className="container max-w-4xl mx-auto py-20 text-center space-y-4">
            <Building2 className="w-16 h-16 mx-auto text-slate-300" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Institution Not Found</h1>
            <p className="text-slate-500">We couldn't find an institution matching <strong>{slug}</strong>.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
        </div>
    );

    const isClaimed = handlers.length > 0;
    const isNational = institution.jurisdiction_type === 'national';

    const institutionTypeLabel = (t: string) => ({
        ministry: 'National Ministry',
        commission: 'Constitutional Commission',
        independent_office: 'Independent Office',
        state_corporation: 'State Corporation',
        agency: 'Government Agency',
    }[t] || t?.replace(/_/g, ' '));

    return (
        <div className="container mx-auto px-2 sm:px-4 pb-6 mt-4">
            <PageTour tourKey={INSTITUTION_TOUR_KEY} steps={INSTITUTION_TOUR_STEPS} userId={user?.id} />
            {/* Back */}
            <div className="mb-4">
                <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" /> Back to Institutions
                </Button>
            </div>

            {/* ========= 3-COLUMN DASHBOARD ========= */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px] gap-4 lg:gap-5">
                
                {/* ─────── LEFT SIDEBAR: Institution Identity ─────── */}
                <aside data-tour="tour-institution-profile" className="lg:sticky lg:top-16 lg:self-start space-y-4 order-2 lg:order-1">
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        {/* Top banner — custom → community fallback → solid gradient */}
                        <div className="h-24 relative overflow-hidden">
                            {institution.banner_url || communityBranding?.banner_url ? (
                                <img
                                    src={institution.banner_url || communityBranding!.banner_url!}
                                    alt="Institution banner"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-700" />
                            )}
                            {/* Edit banner — available to active handlers */}
                            {isHandler && (
                                <label
                                    title="Upload a custom banner for this institution"
                                    className="absolute top-2 right-2 cursor-pointer bg-black/40 hover:bg-black/60 text-white rounded-lg px-2 py-1 text-[10px] flex items-center gap-1 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Edit Banner
                                    <input type="file" accept="image/*" className="sr-only" onChange={() => toast({ title: 'Coming soon', description: 'Banner upload will be available in a future update.' })} />
                                </label>
                            )}
                        </div>

                        <div className="px-5 pb-5 relative mt-[-2.5rem]">
                            {/* Avatar — institution custom_avatar_url → community avatar → icon */}
                            {institution.custom_avatar_url || communityBranding?.avatar_url ? (
                                <img
                                    src={institution.custom_avatar_url || communityBranding!.avatar_url!}
                                    alt={institution.acronym || institution.name}
                                    className="w-20 h-20 rounded-xl object-cover border-4 border-card shadow-sm mx-auto z-10 relative bg-muted"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border-4 border-card shadow-sm mx-auto z-10 relative">
                                    <Building2 className="w-10 h-10 text-violet-500" strokeWidth={1.5} />
                                </div>
                            )}

                            {/* Info */}
                            <div className="text-center mt-3 space-y-1">
                                <h1 className="text-lg font-bold text-foreground leading-tight">
                                    {institution.name}
                                    {institution.acronym && ` (${institution.acronym})`}
                                </h1>
                                {institution.jurisdiction_name && (
                                    <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {institution.jurisdiction_name} {isNational && '• National'}
                                    </p>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap justify-center gap-2 mt-3 mb-4">
                                {isClaimed ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] gap-1 px-2 py-0.5">
                                        <BadgeCheck className="w-3 h-3" /> Managed
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-800 px-2 py-0.5">
                                        Unmanaged
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize text-center">
                                    {institutionTypeLabel(institution.institution_type)}
                                </Badge>
                                {isNational && (
                                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                        <Shield className="w-3 h-3 mr-1" /> National
                                    </Badge>
                                )}
                            </div>

                            {/* Claim CTA if no handlers */}
                            {!isClaimed && (
                                <Button
                                    size="sm"
                                    className="w-full text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white gap-1.5 shadow-sm mb-4"
                                    onClick={() => {
                                        if (!user) { authModal.open('login'); return; }
                                        setShowClaimForm(!showClaimForm);
                                    }}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Request Access
                                </Button>
                            )}

                            {/* Contact Links */}
                            <div className="space-y-3 pt-4 border-t border-border/50 flex flex-col">
                                {institution.website && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</span>
                                        <a href={institution.website.startsWith('http') ? institution.website : `https://${institution.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline max-w-[140px] truncate">
                                            {institution.website.replace(/^https?:\/\//i, '')}
                                        </a>
                                    </div>
                                )}
                                {institution.contact_email && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                                        <a href={`mailto:${institution.contact_email}`} className="text-blue-600 hover:underline max-w-[140px] truncate">
                                            {institution.contact_email}
                                        </a>
                                    </div>
                                )}
                                {institution.contact_phone && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Call</span>
                                        <a href={`tel:${institution.contact_phone}`} className="text-foreground hover:underline font-medium">
                                            {institution.contact_phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ─────── CENTER: Main Content Area ─────── */}
                <main className="min-w-0 order-2 lg:order-2">


                    {/* Handler claim form */}
                    {showClaimForm && (
                        <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 shadow-md shadow-amber-900/5 space-y-3 animate-in fade-in slide-in-from-top-4">
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-amber-500" /> Request Handler Access
                            </p>
                            <p className="text-xs text-slate-500">
                                {isNational
                                    ? 'National institution claims require platform super admin review. Please provide your official credentials and role.'
                                    : 'County/ward institution claims require the relevant office holder to approve. Please describe your role and provide contact details.'}
                            </p>
                            <Textarea
                                rows={3}
                                placeholder="Describe your role, official credentials, and why you should manage this institution..."
                                value={claimMessage}
                                onChange={e => setClaimMessage(e.target.value)}
                                className="resize-none text-sm rounded-xl"
                            />
                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    disabled={!claimMessage.trim() || claimMutation.isPending}
                                    onClick={() => claimMutation.mutate()}
                                    className="gap-2"
                                >
                                    {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Submit Request
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowClaimForm(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    {/* ── Top Quick Actions bar ── */}
                    <div className="flex flex-wrap gap-2 mb-3 p-1 bg-white dark:bg-slate-900/60 rounded-2xl border border-border/50 shadow-sm">
                        <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                            onClick={() => navigate('/report-issue')}
                        >
                            <AlertCircle className="w-3.5 h-3.5" /> Report Issue
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 px-3 text-xs font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-xl"
                            onClick={() => setActiveTab('issues' as InstitutionTab)}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" /> Routed Issues
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            onClick={() => setActiveTab('updates' as InstitutionTab)}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Updates
                        </Button>
                    </div>

                    {/* ── Stat Cards — dashboard style, shown above tabs ── */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <DashStatCard
                            icon={AlertCircle} label="Routed Issues" value={issues.length}
                            iconBg="bg-red-100 dark:bg-red-900/40" iconColor="text-red-600 dark:text-red-400"
                        />
                        <DashStatCard
                            icon={CheckCircle2} label="Resolved"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            value={issues.filter((i: any) => i.status === 'resolved').length}
                            iconBg="bg-emerald-100 dark:bg-emerald-900/40" iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <DashStatCard
                            icon={Users} label="Active Handlers" value={handlers.length}
                            iconBg="bg-violet-100 dark:bg-violet-900/40" iconColor="text-violet-600 dark:text-violet-400"
                        />
                    </div>

                    {/* ─── Tabs ─── */}
                    <Tabs data-tour="tour-institution-tabs" value={activeTab} onValueChange={(v) => setActiveTab(v as InstitutionTab)} className="w-full space-y-4">
                        <div className="overflow-x-auto pb-1 scrollbar-hide">
                            <TabsList className="inline-flex h-auto w-auto min-w-full sm:min-w-0 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                        {TABS.map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="flex items-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                            >
                                {tab.icon} {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="min-h-[300px] relative">
                    <TabsContent value="about" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'about' && (
                            <div className="space-y-4">
                                {institution.description ? (
                                    <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                        <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{institution.description}</p>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                        <p className="text-sm text-slate-500">
                                            {institution.name} {institution.acronym ? `(${institution.acronym})` : ''} is a Kenya government {institutionTypeLabel(institution.institution_type)?.toLowerCase()}
                                            {institution.jurisdiction_name ? ` serving ${institution.jurisdiction_name}` : ' serving the nation'}.
                                        </p>
                                    </div>
                                )}

                                {institution.physical_address && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Physical Address</p>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">{institution.physical_address}</p>
                                        </div>
                                    </div>
                                )}

                                {!isClaimed && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                                        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">No handler assigned</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                {isNational
                                                    ? 'This national institution\'s handler must be approved by a platform administrator.'
                                                    : 'The relevant office holder (Governor/MP/MCA) can grant handler access to designated officials.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="issues" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'issues' && (
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <p className="text-sm text-slate-500">{issues.length} civic issues routed to this institution</p>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                                        {(['all', 'submitted', 'acknowledged', 'in_progress', 'resolved'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setIssueFilter(f)}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize whitespace-nowrap",
                                                    issueFilter === f 
                                                        ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-400 shadow-sm" 
                                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                                )}
                                            >
                                                {f.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {issues.length === 0
                                    ? <SectionEmpty message="No issues have been routed to this institution yet." icon={<AlertCircle className="w-12 h-12" />} />
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    : issues.filter((i: any) => issueFilter === 'all' || i.status === issueFilter).map((issue: any) => (
                                        <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssueId(issue.id)} />
                                    ))
                                }
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {issues.length > 0 && issues.filter((i: any) => issueFilter === 'all' || i.status === issueFilter).length === 0 && (
                                    <SectionEmpty message={`No ${issueFilter.replace('_', ' ')} issues found.`} icon={<Filter className="w-12 h-12" />} />
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="updates" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'updates' && (
                            <div className="space-y-4">
                                {!isClaimed && (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500 flex items-center gap-2">
                                        <Lock className="w-4 h-4 shrink-0" />
                                        Official updates can only be posted by verified institution handlers.
                                    </div>
                                )}

                                {isHandler && (
                                    <div className="p-4 rounded-xl border border-border/50 bg-card mb-4 space-y-3 shadow-sm">
                                        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                            <MessageSquare className="w-4 h-4 text-violet-500" /> Post Official Update
                                        </h3>
                                        <input 
                                            placeholder="Update Title" 
                                            value={newUpdateTitle}
                                            onChange={(e) => setNewUpdateTitle(e.target.value)}
                                            className="w-full bg-transparent border-b border-border/50 pb-2 text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                        <Textarea
                                            placeholder="Write the official update or announcement..."
                                            value={newUpdateContent}
                                            onChange={(e) => setNewUpdateContent(e.target.value)}
                                            className="resize-none border-none bg-muted/40 text-sm p-3 h-24 rounded-lg focus-visible:ring-1 focus-visible:ring-violet-500/50"
                                        />
                                        <div className="flex justify-end pt-1">
                                            <Button 
                                                size="sm" 
                                                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                                                disabled={!newUpdateTitle.trim() || !newUpdateContent.trim() || postUpdateMutation.isPending}
                                                onClick={() => postUpdateMutation.mutate()}
                                            >
                                                {postUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                Post Update
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {updates.length === 0 ? (
                                    <SectionEmpty message="No official updates posted yet." icon={<MessageSquare className="w-12 h-12" />} />
                                ) : (
                                    <div className="space-y-3">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {updates.map((update: any) => (
                                            <div key={update.id} className="p-4 rounded-xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-foreground text-sm leading-tight">{update.title}</h3>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-3">
                                                        {new Date(update.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground/80 leading-relaxed max-w-none mb-3">
                                                    {update.content}
                                                </p>
                                                
                                                <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                                                    <img 
                                                        src={update.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${update.profiles?.username || 'U'}`}
                                                        alt="Author avatar" 
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        Posted by <span className="font-medium text-foreground">{update.profiles?.full_name || update.profiles?.username || 'Unknown'}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </div>
                    </Tabs>
                </main>

                {/* ─────── RIGHT SIDEBAR: Widgets ─────── */}
                <aside className="space-y-4 order-3 hidden xl:block self-start lg:sticky lg:top-16">
                    {/* Current Handlers Widget */}
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-semibold text-sm">Active Handlers</h3>
                        </div>
                        <div className="p-4">
                            {isClaimed ? (
                                <div className="space-y-2">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {handlers.map((h: any) => (
                                        <Link to={buildProfileLink({ username: h.profiles?.username ?? '', is_verified: h.profiles?.is_verified, official_position: h.profiles?.official_position })} key={h.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-200 dark:border-emerald-800">
                                                {h.profiles?.avatar_url ? (
                                                    <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                                                        {((h.profiles?.full_name || h.profiles?.username || '?') as string)[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{h.profiles?.full_name || `@${h.profiles?.username}`}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-2 space-y-2">
                                    <Shield className="w-6 h-6 text-amber-500/70 mx-auto" />
                                    <p className="text-xs text-muted-foreground">This institution is unmanaged.</p>
                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                                        if (!user) { authModal.open('login'); return; }
                                        setShowClaimForm(!showClaimForm);
                                    }}>
                                        Request Access
                                    </Button>
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                                        {isNational ? 'Requires platform admin approval' : 'Requires grant'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Widget */}
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm p-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{issues.length}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Routed Issues</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{handlers.length}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Handlers</p>
                            </div>
                         </div>
                    </div>
                </aside>
            </div>

            <ActionDetailSheet 
                actionId={selectedIssueId} 
                isOpen={!!selectedIssueId} 
                onClose={() => setSelectedIssueId(null)} 
            />

            {/* Pending Handlers Sidebar Modal for Mobile + Inline for Desktop */}
            {isHandler && pendingHandlers.length > 0 && (
                <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
                        <Users className="w-5 h-5 text-amber-500" /> Handler Requests ({pendingHandlers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {pendingHandlers.map((req: any) => (
                            <div key={req.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                        <img src={req.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${req.profiles?.username || 'U'}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold text-sm truncate">{req.profiles?.full_name || `@${req.profiles?.username}`}</p>
                                            {req.profiles?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Requested {new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 shadow-inner">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 uppercase tracking-wider">Message</p>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">"{req.request_message || 'I would like to help manage this institution.'}"</p>
                                </div>
                                <div className="flex items-center gap-2 mt-auto">
                                    <Button 
                                        size="sm" 
                                        variant="default"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9"
                                        disabled={updateHandlerStatus.isPending}
                                        onClick={() => updateHandlerStatus.mutate({ id: req.id, status: 'active' })}
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 h-9"
                                        disabled={updateHandlerStatus.isPending}
                                        onClick={() => updateHandlerStatus.mutate({ id: req.id, status: 'rejected' })}
                                    >
                                        <XCircle className="w-4 h-4" /> Deny
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

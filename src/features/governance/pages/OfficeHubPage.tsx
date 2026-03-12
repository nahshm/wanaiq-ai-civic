import { useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Building2, CheckCircle2, AlertCircle, MapPin, Globe, Mail, Phone,
    Shield, Users, FileText, BarChart3, Lightbulb, ScrollText, History,
    MessageSquare, Target, ChevronRight, ExternalLink, Upload, Loader2,
    ClipboardList, Landmark, ArrowLeft, Plus, Calendar, TrendingUp,
    BadgeCheck, Lock, Star, Clock, XCircle, ThumbsUp, CheckCircle, LucideIcon,
    Activity, AlertTriangle, Zap, Pencil, CheckSquare, X, TrendingDown
} from 'lucide-react';
import { ActionDetailSheet } from '@/components/dashboard/ActionDetailSheet';
import { ActivityTimeline } from '@/components/governance/ActivityTimeline';
import { AddPromiseModal } from '@/components/governance/AddPromiseModal';
import { UpdatePromiseModal } from '@/components/governance/UpdatePromiseModal';
import { AnswerQuestionModal } from '@/components/governance/AnswerQuestionModal';
import { AddProjectModal } from '@/components/governance/AddProjectModal';
import { UpdateProjectModal } from '@/components/governance/UpdateProjectModal';
import { ClaimPositionModal } from '@/components/governance/ClaimPositionModal';
import { PageTour } from '@/components/tour/PageTour';
import { OFFICE_HUB_TOUR_KEY, OFFICE_HUB_TOUR_STEPS } from '@/components/tour/OfficeHubTourSteps';
import { cn } from '@/lib/utils';

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

// ─── Types ───────────────────────────────────────────────────────────────────
type OfficeTab =
    | 'overview' | 'issues' | 'promises' | 'qa'
    | 'projects' | 'manifesto' | 'budget' | 'proposals'
    | 'resolutions' | 'history';

interface GovernmentPosition {
    id: string;
    position_code: string;
    title: string;
    description: string | null;
    governance_level: string;
    jurisdiction_name: string;
    jurisdiction_code: string;
    country_code: string;
    term_years: number | null;
    is_elected: boolean | null;
    responsibilities: string | string[] | null;
    authority_level: number | string | null;
    next_election_date: string | null;
    banner_url: string | null;
    custom_avatar_url: string | null;
}

interface OfficeHolder {
    id: string;
    user_id: string;
    position_id: string;
    verification_status: string;
    claimed_at: string | null;
    term_start: string | null;
    term_end: string | null;
    is_active: boolean | null;
    profiles: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        is_verified: boolean | null;
    } | null;
}

interface OfficeData {
    id: string;
    position_id: string;
    budget_info: Array<{ year: number; amount: number; source: string; notes?: string }>;
    resolutions: Array<{ title: string; date: string; description: string; status: string }>;
}

// Light typed interfaces for tab data
interface CivicAction {
    id: string;
    title: string;
    description: string | null;
    urgency: string | null;
    status: string | null;
    created_at: string;
    location_text: string | null;
    support_count: number | null;
}
interface OfficePromise { id: string; title: string; description: string | null; status: string | null; created_at: string; deadline: string | null; progress: number | null; category?: string | null; }
interface OfficeQuestion { id: string; question: string; answer: string | null; asked_by: string | null; asked_at: string; upvotes: number | null; answered_at: string | null; profiles: { username: string; display_name: string | null; avatar_url: string | null } | null; }
interface GovProject { id: string; title: string; description: string | null; status: string | null; planned_start_date: string | null; planned_completion_date: string | null; budget_allocated: number | null; category: string | null; }
interface OfficeManifesto { id: string; title: string; file_url: string; file_type: string | null; year: number | null; is_pinned: boolean | null; is_verified: boolean | null; created_at: string; uploaded_by?: string | null; profiles?: { username: string; display_name: string | null } | null; }
interface OfficeProposal { id: string; title: string; description: string; status: string | null; holder_response?: string | null; upvotes: number | null; created_at: string; profiles: { username: string; avatar_url: string | null } | null; }
interface OfficePastHolder { id: string; user_id: string; verification_status: string; claimed_at: string | null; term_start: string | null; term_end: string | null; profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null; }
interface LinkedInstitution { id: string; name: string; acronym: string | null; institution_type: string | null; slug: string; website: string | null; contact_email: string | null; contact_phone: string | null; }
/** Institution that this position directly heads (position_id FK match) */
interface GoverningInstitution extends LinkedInstitution { description: string | null; }

// ─── Tab Config ──────────────────────────────────────────────────────────────
const TABS: { id: OfficeTab; label: string; icon: React.ReactNode; requiresClaimed?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: <Landmark className="w-4 h-4" /> },
    { id: 'issues', label: 'Issues', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'promises', label: 'Promises', icon: <Target className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'qa', label: 'Q&A', icon: <MessageSquare className="w-4 h-4" /> },
];

const OVERFLOW_TABS: { id: OfficeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'proposals', label: 'Proposals', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'manifesto', label: 'Manifesto', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'budget', label: 'Budget', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'resolutions', label: 'Resolutions', icon: <FileText className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
// DB position_code format: "KE:nairobi:governor" (country:jurisdiction-slug:role-slug)
// URL format: /office/ke/county/nairobi/governor
function buildPositionCode(country: string, jurisdiction: string, role: string): string {
    return `${country.toUpperCase()}:${jurisdiction.toLowerCase()}:${role.toLowerCase()}`;
}

function levelLabel(level: string): string {
    const map: Record<string, string> = {
        nation: 'National', national: 'National',
        county: 'County', constituency: 'Constituency', ward: 'Ward',
    };
    return map[level.toLowerCase()] || level;
}

function humanizeRole(role: string): string {
    return role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionEmpty = ({ message, icon }: { message: string; icon?: React.ReactNode }) => (
    <div className="py-16 text-center space-y-3 text-slate-400">
        {icon && <div className="flex justify-center mb-2 opacity-30">{icon}</div>}
        <p className="text-sm font-medium">{message}</p>
    </div>
);

// ─── Dashboard Stat Card (matches user dashboard design exactly) ─────────────
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

// ─── Legacy StatCard (kept for backward compat with small inline uses) ────────
const StatCard = ({ icon: Icon, label, value, accent }: {
    icon: React.ElementType; label: string; value: number | string; accent: string;
}) => (
    <div className="relative overflow-hidden rounded-xl border border-border/60 p-3 bg-card hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xl font-bold tabular-nums">{value}</p>
            </div>
            <div className={`p-2 rounded-lg ${accent} bg-opacity-10`}><Icon className="w-4 h-4" /></div>
        </div>
    </div>
);

// ─── Issue Card Component ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IssueCard = ({ issue, onClick }: { issue: any; onClick: () => void }) => {
    const cfg = STATUS_CONFIG[issue.status || 'submitted'] || STATUS_CONFIG.submitted;
    const Icon = cfg.icon;

    return (
        <div className={`border-l-4 ${URGENCY_COLOR[issue.urgency || 'low'] || 'border-l-gray-300'} rounded-r-xl border border-border/50 p-4 hover:shadow-sm transition-all hover:border-primary/30 bg-white dark:bg-slate-900 group`}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {issue.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{issue.description}</p>
                </div>
                <Badge variant={issue.urgency === 'high' ? 'destructive' : 'secondary'} className="shrink-0 text-[10px] capitalize">
                    {issue.urgency} Priority
                </Badge>
            </div>

            {/* Footer row */}
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
                    <Button variant="ghost" size="sm" onClick={onClick} className="h-7 text-xs gap-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OfficeHubPage() {
    const { country = 'ke', level = '', jurisdiction = '', role = '' } = useParams<{
        country: string; level: string; jurisdiction: string; role: string;
    }>();
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<OfficeTab>('overview');
    const [proposalTitle, setProposalTitle] = useState('');
    const [proposalDesc, setProposalDesc] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [issueStatusFilter, setIssueStatusFilter] = useState<string>('all');
    // Modal states
    const [showAddPromise, setShowAddPromise] = useState(false);
    const [showUpdatePromise, setShowUpdatePromise] = useState<OfficePromise | null>(null);
    const [showAnswerQuestion, setShowAnswerQuestion] = useState<OfficeQuestion | null>(null);
    const [showAddProject, setShowAddProject] = useState(false);
    const [showUpdateProject, setShowUpdateProject] = useState<GovProject | null>(null);
    const [showClaimModal, setShowClaimModal] = useState(false);
    // Proposal holder-response state
    const [respondingToProposal, setRespondingToProposal] = useState<string | null>(null);
    const [proposalResponse, setProposalResponse] = useState('');
    // Manifesto upload
    const manifestoFileRef = useRef<HTMLInputElement>(null);
    const [uploadingManifesto, setUploadingManifesto] = useState(false);
    // Budget / Resolution add
    const [showAddBudget, setShowAddBudget] = useState(false);
    const [budgetYear, setBudgetYear] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [budgetSource, setBudgetSource] = useState('');
    const [budgetNotes, setBudgetNotes] = useState('');
    const [showAddResolution, setShowAddResolution] = useState(false);
    const [resolutionTitle, setResolutionTitle] = useState('');
    const [resolutionDesc, setResolutionDesc] = useState('');
    const [resolutionDate, setResolutionDate] = useState(new Date().toISOString().slice(0, 10));

    // position_code = "KE:nairobi:governor" — matches DB format exactly
    const positionCode = buildPositionCode(country, jurisdiction, role);

    // ─── Data Fetching ────────────────────────────────────────────────────
    const { data: position, isLoading: posLoading, error: posError } = useQuery({
        queryKey: ['position', positionCode],
        queryFn: async () => {
            // Primary: exact position_code match (fast, indexed)
            const { data: exact } = await supabase
                .from('government_positions')
                .select('*')
                .ilike('position_code', positionCode)
                .maybeSingle();
            if (exact) return exact as GovernmentPosition;

            // Fallback: match by individual columns (handles any slug variation)
            const jurisdictionName = jurisdiction.replace(/-/g, ' ');
            const { data: rows } = await supabase
                .from('government_positions')
                .select('*')
                .eq('country_code', country.toUpperCase())
                .ilike('governance_level', level)
                .ilike('jurisdiction_name', `%${jurisdictionName}%`)
                .limit(10);

            if (!rows || rows.length === 0) throw new Error('Position not found');

            // Pick best title match by role slug
            const roleNorm = role.toLowerCase();
            const best = rows.find(r =>
                r.position_code?.split(':')[2] === roleNorm ||
                r.title?.toLowerCase().includes(role.replace(/-/g, ' '))
            ) || rows[0];

            return best as GovernmentPosition;
        },
        retry: false,
    });

    const { data: activeHolder } = useQuery({
        queryKey: ['office-holder', position?.id],
        enabled: !!position?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('office_holders')
                .select('id, user_id, position_id, verification_status, claimed_at, term_start, term_end, is_active, profiles!office_holders_user_id_fkey(id, username, display_name, avatar_url, bio, is_verified)')
                .eq('position_id', position!.id)
                .in('verification_status', ['verified', 'pending'])
                .eq('is_active', true)
                .order('claimed_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            return data as OfficeHolder | null;
        },
    });

    const { data: officeData } = useQuery({
        queryKey: ['office-data', position?.id],
        enabled: !!position?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('offices')
                .select('id, position_id, budget_info, resolutions')
                .eq('position_id', position!.id)
                .maybeSingle();
            return data as OfficeData | null;
        },
    });

    const { data: issues = [] } = useQuery<CivicAction[]>({
        queryKey: ['office-issues', jurisdiction, level],
        enabled: !!position,
        queryFn: async () => {
            const col = level === 'ward' ? 'ward_id' : level === 'constituency' ? 'constituency_id' : 'county_id';
            // Get the admin division id by name and level
            const { data: div } = await supabase
                .from('administrative_divisions')
                .select('id')
                .ilike('name', `%${jurisdiction.replace(/-/g, ' ')}%`)
                .ilike('governance_level', level)
                .maybeSingle();
            if (!div) return [];
            const { data } = await supabase
                .from('civic_actions')
                .select('id, title, description, urgency, status, created_at, location_text, support_count')
                .eq(col, div.id)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(20);
            return data || [];
        },
    });

    const { data: promises = [] } = useQuery<OfficePromise[]>({
        queryKey: ['office-promises', activeHolder?.id],
        enabled: !!activeHolder?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('office_promises')
                .select('id, title, description, status, created_at, deadline, progress, category')
                .eq('office_holder_id', activeHolder!.id)
                .order('created_at', { ascending: false })
                .limit(20);
            return data || [];
        },
    });

    const { data: questions = [], refetch: refetchQuestions } = useQuery<OfficeQuestion[]>({
        queryKey: ['office-questions', position?.id],
        enabled: !!position?.id,
        queryFn: async () => {
            // Fetch all questions for this position regardless of whether it's claimed
            // We fetch via office_holder_id — so we need ALL holders for this position
            const { data: allHolders } = await supabase
                .from('office_holders')
                .select('id')
                .eq('position_id', position!.id);
            const holderIds = (allHolders || []).map(h => h.id);
            if (holderIds.length === 0) {
                // No holders yet — still allow questions to be stored by using position.id as reference
                // Return empty for now; questions will be visible once a holder claims
                return [];
            }
            const { data } = await supabase
                .from('office_questions')
                .select('id, question, answer, asked_by, asked_at, upvotes, answered_at, profiles!office_questions_asked_by_fkey(username, display_name, avatar_url)')
                .in('office_holder_id', holderIds)
                .order('asked_at', { ascending: false })
                .limit(30);
            return (data || []) as OfficeQuestion[];
        },
    });

    const { data: projects = [] } = useQuery<GovProject[]>({
        queryKey: ['office-projects', jurisdiction, level],
        enabled: !!position,
        queryFn: async () => {
            // Filter by county/constituency/ward column rather than location text
            const jurisdictionName = position!.jurisdiction_name.replace(' County', '').replace(' Constituency', '').trim();
            let query = supabase
                .from('government_projects')
                .select('id, title, description, status, planned_start_date, planned_completion_date, budget_allocated, category');
            if (level === 'ward') {
                query = query.ilike('ward', `%${jurisdictionName}%`);
            } else if (level === 'constituency') {
                query = query.ilike('constituency', `%${jurisdictionName}%`);
            } else {
                query = query.ilike('county', `%${jurisdictionName}%`);
            }
            const { data } = await query.order('planned_start_date', { ascending: false }).limit(20);
            return data || [];
        },
    });

    const { data: manifestos = [] } = useQuery<OfficeManifesto[]>({
        queryKey: ['office-manifestos', officeData?.id],
        enabled: !!officeData?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('office_manifestos')
                .select('id, title, file_url, file_type, year, is_pinned, is_verified, created_at, uploaded_by, profiles!office_manifestos_uploaded_by_fkey(username, display_name)')
                .eq('office_id', officeData!.id)
                .order('is_pinned', { ascending: false })
                .limit(10);
            return (data || []) as OfficeManifesto[];
        },
    });

    const { data: proposals = [], refetch: refetchProposals } = useQuery<OfficeProposal[]>({
        queryKey: ['office-proposals', officeData?.id],
        enabled: !!officeData?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('office_proposals')
                .select('id, title, description, status, upvotes, created_at, profiles(username, avatar_url)')
                .eq('office_id', officeData!.id)
                .order('upvotes', { ascending: false })
                .limit(20);
            return data || [];
        },
    });

    const { data: pastHolders = [] } = useQuery<OfficePastHolder[]>({
        queryKey: ['office-history', position?.id],
        enabled: !!position?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('office_holders')
                .select('id, user_id, verification_status, claimed_at, term_start, term_end, profiles!office_holders_user_id_fkey(username, display_name, avatar_url)')
                .eq('position_id', position!.id)
                .order('claimed_at', { ascending: false })
                .limit(20);
            return data || [];
        },
    });

    const { data: activities = [] } = useQuery<any[]>({
        queryKey: ['office-activity', activeHolder?.id],
        enabled: !!activeHolder?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('office_activity_log' as any)
                .select('*')
                .eq('office_holder_id', activeHolder!.id)
                .order('created_at', { ascending: false })
                .limit(10);
            return data || [];
        },
    });

    // Institution that this position directly leads (e.g. Governor → County Government)
    const { data: governingInstitution } = useQuery<GoverningInstitution | null>({
        queryKey: ['governing-institution', position?.id],
        enabled: !!position?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('government_institutions')
                .select('id, name, acronym, institution_type, slug, website, contact_email, contact_phone, description')
                .eq('position_id', position!.id)
                .eq('is_active', true)
                .maybeSingle();
            return data as GoverningInstitution | null;
        },
    });

    const { data: linkedInstitutions = [] } = useQuery<LinkedInstitution[]>({
        queryKey: ['office-institutions', jurisdiction, level, country, governingInstitution?.id],
        enabled: !!position,
        queryFn: async () => {
            let query = supabase
                .from('government_institutions')
                .select('id, name, acronym, institution_type, slug, website, contact_email, contact_phone')
                .eq('is_active', true)
                .eq('country_code', country.toUpperCase());

            if (level === 'national') {
                // National office: show only national-jurisdiction institutions
                query = query.eq('jurisdiction_type', 'national');
            } else {
                // County/constituency/ward: show institutions in that specific jurisdiction
                // Match by jurisdiction_name (county name from position) — don't mix in nationals
                const j = position!.jurisdiction_name;
                query = query
                    .eq('jurisdiction_type', level === 'constituency' || level === 'ward' ? 'county' : level)
                    .ilike('jurisdiction_name', `%${j.replace(' County', '').replace(' Constituency', '').trim()}%`);
            }

            // Exclude the governing institution — it's shown separately as "This office leads"
            if (governingInstitution?.id) {
                query = query.neq('id', governingInstitution.id);
            }

            const { data } = await query.order('institution_type').limit(8);
            return data || [];
        },
    });

    // Community banner fallback: find the community linked to this jurisdiction
    // Used when the office has no custom banner/avatar configured
    const { data: communityBranding } = useQuery<{ banner_url: string | null; avatar_url: string | null } | null>({
        queryKey: ['office-community-branding', jurisdiction, level],
        enabled: !!position && !position.banner_url,
        queryFn: async () => {
            const jurisdictionName = position!.jurisdiction_name;
            const jurisdictionSearch = jurisdictionName.replace(' County', '').replace(' Constituency', '').trim();
            const { data } = await supabase
                .from('communities')
                .select('banner_url, avatar_url')
                .ilike('name', `%${jurisdictionSearch}%`);
            // Filter client-side to avoid deep type instantiation
            const match = (data || []).find((c: any) => ['location', 'county', 'constituency', 'ward'].includes(c.community_type));
            return match ? { banner_url: match.banner_url, avatar_url: match.avatar_url } : null;
        },
    });

    // ─── Mutations ────────────────────────────────────────────────────────
    const submitProposal = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Login required');
            if (!officeData?.id) throw new Error('Office not found');
            const { error } = await supabase.from('office_proposals').insert({
                office_id: officeData.id,
                user_id: user.id,
                title: proposalTitle.trim(),
                description: proposalDesc.trim(),
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: '✅ Proposal submitted!', description: 'Your proposal has been recorded.' });
            setProposalTitle('');
            setProposalDesc('');
            refetchProposals();
        },
        onError: (err: Error) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const submitQuestion = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Login required');
            if (!activeHolder?.id) throw new Error('This office has no active holder yet to send questions to.');
            const { error } = await supabase.from('office_questions').insert({
                office_holder_id: activeHolder.id,
                asked_by: user.id,
                question: questionText.trim(),
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: '❓ Question submitted!', description: 'Your question has been recorded.' });
            setQuestionText('');
            queryClient.invalidateQueries({ queryKey: ['office-questions', position?.id] });
        },
        onError: (err: Error) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const upvoteProposal = useMutation({
        mutationFn: async (proposalId: string) => {
            if (!user) throw new Error('Login required');
            const { error } = await supabase.from('office_proposals')
                .update({ upvotes: (supabase.rpc as any)('increment', { x: 1 }) as unknown as number })
                .eq('id', proposalId);
            if (error) throw error;
        },
        onSuccess: () => { refetchProposals(); },
        onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });

    const respondToProposal = useMutation({
        mutationFn: async ({ proposalId, status }: { proposalId: string; status: 'accepted' | 'rejected' }) => {
            if (!user || !isHolder) throw new Error('Only the verified holder can respond.');
            const { error } = await supabase.from('office_proposals').update({
                status,
                holder_response: proposalResponse.trim() || null,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
            }).eq('id', proposalId);
            if (error) throw error;
            // Log activity
            if (activeHolder?.id) {
                supabase.from('office_activity_log').insert({
                    office_holder_id: activeHolder.id,
                    activity_type: `proposal_${status}`,
                    title: `Proposal ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
                    description: proposalResponse.trim() || `Holder ${status} the proposal.`,
                    reference_type: 'proposal',
                    created_by: user.id,
                }).then(() => {});
            }
        },
        onSuccess: () => {
            toast({ title: '✅ Response saved!' });
            setRespondingToProposal(null);
            setProposalResponse('');
            refetchProposals();
        },
        onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });

    const addBudgetEntry = useMutation({
        mutationFn: async () => {
            if (!officeData?.id) throw new Error('Office record not found');
            const newEntry = { year: parseInt(budgetYear), amount: parseFloat(budgetAmount), source: budgetSource.trim(), notes: budgetNotes.trim() || undefined };
            const existing = officeData.budget_info || [];
            const { error } = await supabase.from('offices').update({ budget_info: [...existing, newEntry] }).eq('id', officeData.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: '✅ Budget entry added!' });
            setBudgetYear(''); setBudgetAmount(''); setBudgetSource(''); setBudgetNotes('');
            setShowAddBudget(false);
            queryClient.invalidateQueries({ queryKey: ['office-data', position?.id] });
        },
        onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });

    const addResolution = useMutation({
        mutationFn: async () => {
            if (!officeData?.id) throw new Error('Office record not found');
            const newRes = { title: resolutionTitle.trim(), description: resolutionDesc.trim(), date: resolutionDate, status: 'passed' };
            const existing = officeData.resolutions || [];
            const { error } = await supabase.from('offices').update({ resolutions: [...existing, newRes] }).eq('id', officeData.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: '✅ Resolution logged!' });
            setResolutionTitle(''); setResolutionDesc(''); setResolutionDate(new Date().toISOString().slice(0, 10));
            setShowAddResolution(false);
            queryClient.invalidateQueries({ queryKey: ['office-data', position?.id] });
        },
        onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });

    const uploadManifesto = async (file: File) => {
        if (!user || !officeData?.id) return;
        setUploadingManifesto(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${officeData.id}/${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('manifestos').upload(path, file);
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from('manifestos').getPublicUrl(path);
            const year = new Date().getFullYear();
            const { error: insErr } = await supabase.from('office_manifestos').insert({
                office_id: officeData.id,
                uploaded_by: user.id,
                office_holder_id: activeHolder?.id || null,
                title: `${position.title} Manifesto ${year}`,
                file_url: publicUrl,
                file_type: ext || 'pdf',
                year,
            });
            if (insErr) throw insErr;
            toast({ title: '✅ Manifesto uploaded!' });
            queryClient.invalidateQueries({ queryKey: ['office-manifestos', officeData?.id] });
        } catch (err: unknown) {
            const e = err as Error;
            toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
        } finally {
            setUploadingManifesto(false);
        }
    };

    // ─── UI States ────────────────────────────────────────────────────────
    if (posLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    if (posError || !position) return (
        <div className="container max-w-4xl mx-auto py-20 text-center space-y-4">
            <Landmark className="w-16 h-16 mx-auto text-slate-300" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Office Not Found</h1>
            <p className="text-slate-500">The office you're looking for doesn't exist or the URL is incorrect.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
        </div>
    );

    const isClaimed = !!activeHolder && activeHolder.verification_status === 'verified';
    const isPending = !!activeHolder && activeHolder.verification_status === 'pending';
    const isHolder = user?.id === activeHolder?.user_id;
    const holderProfile = activeHolder?.profiles;

    // Supabase text[] columns can arrive as a JSON string, a real array, or null
    const responsibilities: string[] = (() => {
        const raw = position.responsibilities;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as string[];
        if (typeof raw === 'string') {
            try { return JSON.parse(raw) as string[]; } catch { /* fall through */ }
            // PostgreSQL native array format: {"item1","item2"}
            return raw.replace(/^\{|\}$/g, '').split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
        }
        return [];
    })();

    // ─── Tab Content ─────────────────────────────────────────────────────
    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return (
                <div className="space-y-5">
                    {/* Row 1: Primary stats — 3 across, matching dashboard */}
                    <div className="grid grid-cols-3 gap-3">
                        <DashStatCard
                            icon={AlertCircle} label="Issues Reported" value={issues.length}
                            iconBg="bg-blue-100 dark:bg-blue-900/40" iconColor="text-blue-600 dark:text-blue-400"
                        />
                        <DashStatCard
                            icon={CheckCircle2} label="Promises Made" value={promises.length}
                            iconBg="bg-emerald-100 dark:bg-emerald-900/40" iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <DashStatCard
                            icon={ClipboardList} label="Active Projects" value={projects.length}
                            iconBg="bg-orange-100 dark:bg-orange-900/40" iconColor="text-orange-600 dark:text-orange-400"
                        />
                    </div>
                    {/* Row 2: Secondary stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <DashStatCard
                            icon={Lightbulb} label="Proposals" value={proposals.length}
                            iconBg="bg-purple-100 dark:bg-purple-900/40" iconColor="text-purple-600 dark:text-purple-400"
                        />
                        <DashStatCard
                            icon={MessageSquare} label="Q&A Answers" value={questions.filter((q: OfficeQuestion) => q.answer).length}
                            iconBg="bg-pink-100 dark:bg-pink-900/40" iconColor="text-pink-600 dark:text-pink-400"
                        />
                        <DashStatCard
                            icon={Users} label="Supporters" value={issues.reduce((s, i) => s + (i.support_count || 0), 0)}
                            iconBg="bg-teal-100 dark:bg-teal-900/40" iconColor="text-teal-600 dark:text-teal-400"
                        />
                    </div>

                    {/* Constitutional mandate */}
                    {responsibilities.length > 0 && (
                        <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-6">
                            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Constitutional Mandate &amp; Responsibilities
                            </h3>
                            <ul className="space-y-2">
                                {responsibilities.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
                                        <span className="text-blue-400 mt-1">•</span> {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ── This office leads ⟶ the governing institution ── */}
                    {governingInstitution && (
                        <Link
                            to={`/institution/${governingInstitution.slug}`}
                            className="group block rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
                        >
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                This Office Leads
                            </p>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate">
                                        {governingInstitution.name}
                                        {governingInstitution.acronym && (
                                            <span className="ml-2 text-sm font-normal text-slate-400">({governingInstitution.acronym})</span>
                                        )}
                                    </h3>
                                    {governingInstitution.description && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{governingInstitution.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                                        {governingInstitution.website && (
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                {governingInstitution.website.replace(/^https?:\/\//i, '')}
                                            </span>
                                        )}
                                        {governingInstitution.contact_email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {governingInstitution.contact_email}
                                            </span>
                                        )}
                                        {governingInstitution.contact_phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {governingInstitution.contact_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                            </div>
                        </Link>
                    )}

                    {/* Recent Activity Feed */}
                    {activities.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border/60">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                Recent Activity
                            </h3>
                            <ActivityTimeline entries={activities} />
                        </div>
                    )}

                    {/* Linked institutions */}
                    {linkedInstitutions.length > 0 && (
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Linked Government Institutions
                            </h3>
                            <div className="space-y-2">
                                {linkedInstitutions.slice(0, 5).map((inst) => (
                                    <Link
                                        key={inst.id}
                                        to={`/institution/${inst.slug}`}
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group bg-white dark:bg-slate-900"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                                                {inst.name}
                                                {inst.acronym && <span className="ml-2 text-xs text-slate-400">({inst.acronym})</span>}
                                            </p>
                                            <p className="text-xs text-slate-400 capitalize">{inst.institution_type?.replace(/_/g, ' ')}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );

            case 'issues': return (
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">{issues.length} civic issues in {jurisdiction.replace(/-/g, ' ')}</p>
                        <Button size="sm" onClick={() => navigate('/report-issue')} className="gap-2 text-xs">
                            <Plus className="w-3.5 h-3.5" /> Report Issue
                        </Button>
                    </div>
                    {/* Status filter pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {['all', 'submitted', 'in_progress', 'resolved'].map(s => (
                            <button
                                key={s}
                                onClick={() => setIssueStatusFilter(s)}
                                className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', issueStatusFilter === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                )}
                            >
                                {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    {(() => {
                        const filtered = issueStatusFilter === 'all' ? issues : issues.filter(i => i.status === issueStatusFilter);
                        return filtered.length === 0
                            ? <SectionEmpty message="No issues match this filter." icon={<AlertCircle className="w-12 h-12" />} />
                            : filtered.map((issue) => <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssueId(issue.id)} />);
                    })()}
                </div>
            );

            case 'promises': return (
                <div className="space-y-3">
                    {!isClaimed && (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <Lock className="w-4 h-4 shrink-0" />
                            Promises are set by the verified office holder. This office is currently unclaimed.
                        </div>
                    )}
                    {isHolder && (
                        <Button size="sm" onClick={() => setShowAddPromise(true)} className="gap-2 w-full sm:w-auto">
                            <Plus className="w-4 h-4" /> Make a New Promise
                        </Button>
                    )}
                    {promises.length === 0
                        ? <SectionEmpty message="No promises recorded yet." icon={<Target className="w-12 h-12" />} />
                        : promises.map((promise) => (
                            <div key={promise.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                                <div className="flex justify-between items-start gap-3">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{promise.title}</p>
                                    <Badge
                                        variant={promise.status === 'completed' ? 'default' : promise.status === 'failed' ? 'destructive' : 'secondary'}
                                        className="shrink-0 text-xs capitalize"
                                    >
                                        {promise.status === 'pending' ? 'Not Started' : promise.status === 'in_progress' ? 'In Progress' : promise.status || 'pending'}
                                    </Badge>
                                </div>
                                {promise.description && <p className="text-sm text-slate-500 line-clamp-2">{promise.description}</p>}
                                {/* Progress bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Progress</span>
                                        <span>{promise.progress ?? 0}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all', promise.status === 'completed' ? 'bg-emerald-500' : promise.status === 'failed' ? 'bg-red-400' : 'bg-blue-500')}
                                            style={{ width: `${promise.progress ?? 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    {promise.deadline && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Due {new Date(promise.deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                    {isHolder && (
                                        <Button size="sm" variant="outline" onClick={() => setShowUpdatePromise(promise)} className="h-7 text-xs gap-1">
                                            <Pencil className="w-3.5 h-3.5" /> Update Progress
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>
            );

            case 'qa': return (
                <div className="space-y-4">
                    {/* Ask question form */}
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Ask the Office Holder</p>
                        <p className="text-xs text-slate-400">
                            {isClaimed ? 'Your question will be sent to the verified holder.' : 'Questions are saved and will be visible to the next verified holder.'}
                        </p>
                        <Textarea
                            rows={3}
                            placeholder="Type your question for the office holder..."
                            value={questionText}
                            onChange={e => setQuestionText(e.target.value)}
                            className="resize-none text-sm rounded-xl"
                        />
                        <Button
                            size="sm"
                            disabled={!questionText.trim() || submitQuestion.isPending}
                            onClick={() => {
                                if (!user) { authModal.open('login'); return; }
                                if (!activeHolder?.id) { toast({ title: 'No holder yet', description: 'No verified holder for this office yet.', variant: 'destructive' }); return; }
                                submitQuestion.mutate();
                            }}
                            className="gap-2"
                        >
                            {submitQuestion.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            Submit Question
                        </Button>
                    </div>
                    <Separator />
                    {questions.length === 0
                        ? <SectionEmpty message="No questions yet. Be the first to ask!" icon={<MessageSquare className="w-12 h-12" />} />
                        : questions.map((q) => (
                            <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1">
                                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{q.question}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {q.profiles?.display_name || q.profiles?.username || 'Anonymous'} · {new Date(q.asked_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Holder answer button */}
                                    {isHolder && !q.answer && (
                                        <Button size="sm" variant="outline" onClick={() => setShowAnswerQuestion(q)} className="h-7 text-xs gap-1 shrink-0">
                                            <CheckSquare className="w-3.5 h-3.5" /> Answer
                                        </Button>
                                    )}
                                </div>
                                {q.answer && (
                                    <div className="ml-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                            <BadgeCheck className="w-3.5 h-3.5" /> Official Response
                                            {q.answered_at && <span className="font-normal text-emerald-500 ml-1">· {new Date(q.answered_at).toLocaleDateString()}</span>}
                                        </p>
                                        <p className="text-sm text-emerald-800 dark:text-emerald-300">{q.answer}</p>
                                    </div>
                                )}
                                {q.upvotes != null && q.upvotes > 0 && (
                                    <div className="ml-6 flex items-center gap-1 text-xs text-slate-400">
                                        <ThumbsUp className="w-3 h-3" /> {q.upvotes} people asked this
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
            );

            case 'projects': return (
                <div className="space-y-3">
                    {isHolder && (
                        <Button size="sm" onClick={() => setShowAddProject(true)} className="gap-2 w-full sm:w-auto">
                            <Plus className="w-4 h-4" /> Add / Link Project
                        </Button>
                    )}
                    {projects.length === 0
                        ? <SectionEmpty message="No government projects logged for this jurisdiction." icon={<ClipboardList className="w-12 h-12" />} />
                        : projects.map((proj) => (
                            <div key={proj.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group">
                                <div className="flex justify-between items-start gap-3">
                                    <Link to={`/projects/${proj.id}`} className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 flex-1">{proj.title}</Link>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className="text-xs capitalize">{proj.status}</Badge>
                                        {isHolder && (
                                            <Button size="sm" variant="ghost" onClick={() => setShowUpdateProject(proj)} className="h-7 w-7 p-0">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {proj.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{proj.description}</p>}
                                {proj.budget_allocated && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                                        Budget: KES {Number(proj.budget_allocated).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ))
                    }
                </div>
            );

            case 'manifesto': return (
                <div className="space-y-4">
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={manifestoFileRef}
                        accept=".pdf,.docx,.doc"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadManifesto(f); e.target.value = ''; }}
                    />
                    {isHolder && (
                        <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-center space-y-2 bg-blue-50/50 dark:bg-blue-950/10">
                            <Upload className="w-8 h-8 mx-auto text-blue-400" />
                            <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Upload Your Manifesto</p>
                            <p className="text-xs text-slate-400">PDF or DOCX format. Will be publicly visible and contribute to your accountability record.</p>
                            <Button
                                size="sm"
                                onClick={() => manifestoFileRef.current?.click()}
                                disabled={uploadingManifesto || !officeData?.id}
                                className="gap-2 text-xs"
                            >
                                {uploadingManifesto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                {uploadingManifesto ? 'Uploading...' : 'Upload PDF/DOCX'}
                            </Button>
                        </div>
                    )}
                    {manifestos.length === 0
                        ? <SectionEmpty message="No manifestos uploaded yet." icon={<ScrollText className="w-12 h-12" />} />
                        : manifestos.map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{m.title}</p>
                                            {m.is_pinned && <Badge className="text-[10px] px-1.5">Pinned</Badge>}
                                            {m.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                                        </div>
                                        <p className="text-xs text-slate-400">{m.year} · {m.profiles?.display_name || m.profiles?.username}</p>
                                    </div>
                                </div>
                                <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs"><ExternalLink className="w-3.5 h-3.5" /> View</Button>
                                </a>
                            </div>
                        ))
                    }
                </div>
            );

            case 'budget': return (
                <div className="space-y-4">
                    {!isClaimed && (
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                            Budget allocations are published by the verified office holder or institution handlers.
                        </div>
                    )}
                    {isHolder && (
                        <div>
                            {showAddBudget ? (
                                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 space-y-3">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Add Budget Entry</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input placeholder="Fiscal Year (e.g. 2024)" value={budgetYear} onChange={e => setBudgetYear(e.target.value)} className="text-sm" type="number" />
                                        <Input placeholder="Amount (KES)" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} className="text-sm" type="number" />
                                    </div>
                                    <Input placeholder="Source (e.g. CDF, National Treasury)" value={budgetSource} onChange={e => setBudgetSource(e.target.value)} className="text-sm" />
                                    <Textarea rows={2} placeholder="Notes (optional)" value={budgetNotes} onChange={e => setBudgetNotes(e.target.value)} className="resize-none text-sm" />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => addBudgetEntry.mutate()} disabled={addBudgetEntry.isPending || !budgetYear || !budgetAmount || !budgetSource} className="gap-1.5 text-xs">
                                            {addBudgetEntry.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Save Entry
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowAddBudget(false)} className="text-xs">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button size="sm" onClick={() => setShowAddBudget(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Budget Year</Button>
                            )}
                        </div>
                    )}
                    {(!officeData?.budget_info || officeData.budget_info.length === 0)
                        ? <SectionEmpty message="No budget allocations recorded yet." icon={<BarChart3 className="w-12 h-12" />} />
                        : (
                            <div className="space-y-3">
                                {officeData.budget_info.map((b, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-900 dark:text-slate-100">FY {b.year}</span>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">KES {Number(b.amount).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{b.source}</p>
                                        {b.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{b.notes}</p>}
                                        {/* Simple bar */}
                                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '60%' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            );

            case 'proposals': return (
                <div className="space-y-4">
                    {/* Submit proposal form (citizens) */}
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Submit a Proposal</p>
                        <Input
                            placeholder="Proposal title..."
                            value={proposalTitle}
                            onChange={e => setProposalTitle(e.target.value)}
                            className="rounded-xl text-sm"
                        />
                        <Textarea
                            rows={3}
                            placeholder="Describe your proposal in detail..."
                            value={proposalDesc}
                            onChange={e => setProposalDesc(e.target.value)}
                            className="resize-none text-sm rounded-xl"
                        />
                        <Button
                            size="sm"
                            disabled={!proposalTitle.trim() || !proposalDesc.trim() || submitProposal.isPending || !officeData?.id}
                            onClick={() => {
                                if (!user) { authModal.open('login'); return; }
                                submitProposal.mutate();
                            }}
                            className="gap-2"
                        >
                            {submitProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                            Submit Proposal
                        </Button>
                    </div>
                    <Separator />
                    {proposals.length === 0
                        ? <SectionEmpty message="No proposals submitted yet. Share your ideas!" icon={<Lightbulb className="w-12 h-12" />} />
                        : proposals.map((p) => (
                            <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                                <div className="flex justify-between items-start gap-3">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</p>
                                    <Badge
                                        variant={p.status === 'accepted' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}
                                        className="text-xs capitalize shrink-0"
                                    >
                                        {p.status || 'pending'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-3">{p.description}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span>{p.profiles?.username}</span>
                                    <span>·</span>
                                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                </div>
                                {/* Holder respond section */}
                                {p.status === 'pending' && isHolder && respondingToProposal !== p.id && (
                                    <div className="flex gap-2 pt-1">
                                        <Button size="sm" variant="outline" onClick={() => setRespondingToProposal(p.id)} className="h-7 text-xs gap-1">
                                            <CheckSquare className="w-3.5 h-3.5" /> Respond
                                        </Button>
                                    </div>
                                )}
                                {respondingToProposal === p.id && (
                                    <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Your official response</p>
                                        <Textarea
                                            rows={2}
                                            placeholder="Write your response to this proposal..."
                                            value={proposalResponse}
                                            onChange={e => setProposalResponse(e.target.value)}
                                            className="resize-none text-sm rounded-lg"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => respondToProposal.mutate({ proposalId: p.id, status: 'accepted' })}
                                                disabled={respondToProposal.isPending}
                                                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" /> Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => respondToProposal.mutate({ proposalId: p.id, status: 'rejected' })}
                                                disabled={respondToProposal.isPending}
                                                className="gap-1.5 text-xs"
                                            >
                                                <X className="w-3.5 h-3.5" /> Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => { setRespondingToProposal(null); setProposalResponse(''); }}
                                                className="text-xs"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {/* Show existing holder response */}
                                {p.status !== 'pending' && p.holder_response && (
                                    <div className={cn('p-3 rounded-lg border text-sm', p.status === 'accepted' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-red-50 dark:bg-red-950/20 border-red-200')}>
                                        <p className={cn('text-xs font-bold mb-1', p.status === 'accepted' ? 'text-emerald-700' : 'text-red-700')}>
                                            {p.status === 'accepted' ? '✅ Holder Accepted' : '❌ Holder Rejected'}
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-300">{p.holder_response}</p>
                                    </div>
                                )}
                                {/* Upvote */}
                                {!isHolder && (
                                    <button
                                        onClick={() => { if (!user) { authModal.open('login'); return; } upvoteProposal.mutate(p.id); }}
                                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" /> Support ({p.upvotes || 0})
                                    </button>
                                )}
                            </div>
                        ))
                    }
                </div>
            );

            case 'resolutions': return (
                <div className="space-y-3">
                    {!isClaimed && (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                            Resolutions are logged by the verified office holder.
                        </div>
                    )}
                    {isHolder && (
                        <div>
                            {showAddResolution ? (
                                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 space-y-3">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Log a Resolution</p>
                                    <Input placeholder="Resolution title" value={resolutionTitle} onChange={e => setResolutionTitle(e.target.value)} className="text-sm" />
                                    <Textarea rows={2} placeholder="Description / what was decided" value={resolutionDesc} onChange={e => setResolutionDesc(e.target.value)} className="resize-none text-sm" />
                                    <Input type="date" value={resolutionDate} onChange={e => setResolutionDate(e.target.value)} className="text-sm" />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => addResolution.mutate()} disabled={addResolution.isPending || !resolutionTitle} className="gap-1.5 text-xs">
                                            {addResolution.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Log Resolution
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowAddResolution(false)} className="text-xs">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button size="sm" onClick={() => setShowAddResolution(true)} className="gap-2"><Plus className="w-4 h-4" /> Log Resolution</Button>
                            )}
                        </div>
                    )}
                    {(!officeData?.resolutions || officeData.resolutions.length === 0)
                        ? <SectionEmpty message="No resolutions recorded yet." icon={<FileText className="w-12 h-12" />} />
                        : officeData.resolutions.map((r, i) => (
                            <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="flex justify-between items-start gap-3">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{r.title}</p>
                                    <Badge variant="outline" className="text-xs capitalize shrink-0">{r.status}</Badge>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{r.description}</p>
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{r.date}</p>
                            </div>
                        ))
                    }
                </div>
            );

            case 'history': return (
                <div className="space-y-3">
                    {pastHolders.length === 0
                        ? <SectionEmpty message="No verified holders on record yet." icon={<History className="w-12 h-12" />} />
                        : pastHolders.map((holder) => {
                            const prof = holder.profiles;
                            return (
                                <div key={holder.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    {prof?.avatar_url
                                        ? <img src={prof.avatar_url} alt={prof.display_name || ''} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
                                        : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">{(prof?.display_name || prof?.username || '?')[0]}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{prof?.display_name || prof?.username || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400">
                                        {holder.term_start ? new Date(holder.term_start).getFullYear() : holder.claimed_at ? new Date(holder.claimed_at).getFullYear() : '?'}
                                        {' — '}
                                        {holder.term_end ? new Date(holder.term_end).getFullYear() : 'Present'}
                                    </p>
                                    </div>
                                    <Badge variant={holder.verification_status === 'verified' ? 'default' : 'secondary'} className="text-xs shrink-0">
                                        {holder.verification_status}
                                    </Badge>
                                </div>
                            );
                        })
                    }
                </div>
            );

            default: return null;
        }
    };

    // ─── Main Render ──────────────────────────────────────────────────────
    return (
        <>
        <div className="container mx-auto px-2 sm:px-4 pb-6 mt-4">
            <PageTour tourKey={OFFICE_HUB_TOUR_KEY} steps={OFFICE_HUB_TOUR_STEPS} userId={user?.id} />
            {/* Back */}
            <div className="mb-4">
                <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" /> Back to Officials
                </Button>
            </div>

            {/* ========= 3-COLUMN DASHBOARD ========= */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px] gap-4 lg:gap-5">
                
                {/* ─────── LEFT SIDEBAR: Office Identity ─────── */}
                <aside data-tour="tour-office-profile" className="lg:sticky lg:top-16 lg:self-start space-y-4 order-2 lg:order-1">
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        {/* Top banner — custom → community fallback → solid gradient */}
                        <div className="h-24 relative overflow-hidden">
                            {position.banner_url || communityBranding?.banner_url ? (
                                <img
                                    src={position.banner_url || communityBranding!.banner_url!}
                                    alt="Office banner"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                            )}
                            {/* Edit banner — only for the verified holder */}
                            {isHolder && isClaimed && (
                                <label
                                    title="Upload a custom banner"
                                    className="absolute top-2 right-2 cursor-pointer bg-black/40 hover:bg-black/60 text-white rounded-lg px-2 py-1 text-[10px] flex items-center gap-1 transition-colors"
                                >
                                    <Upload className="w-3 h-3" /> Edit Banner
                                    <input type="file" accept="image/*" className="sr-only" onChange={() => toast({ title: 'Coming soon', description: 'Banner upload will be available soon.' })} />
                                </label>
                            )}
                        </div>

                        <div className="px-4 pb-5 relative mt-[-2rem]">
                            {/* ── Circular avatar overlapping banner boundary (matches user dashboard) ── */}
                            {(() => {
                                const src = position.custom_avatar_url ||
                                    (isClaimed && holderProfile?.avatar_url) ||
                                    communityBranding?.avatar_url || null;
                                return src ? (
                                    <img
                                        src={src}
                                        alt="Office avatar"
                                        className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-md mx-auto bg-white dark:bg-slate-800 z-10 relative"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 border-4 border-card shadow-md mx-auto z-10 relative flex items-center justify-center">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <Landmark className="w-7 h-7 text-white" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Info */}
                            <div className="text-center mt-3 space-y-1">
                                <h1 className="text-lg font-bold text-foreground leading-tight">
                                    {position.title}
                                </h1>
                                <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {position.jurisdiction_name}
                                </p>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap justify-center gap-2 mt-3 mb-4">
                                {isClaimed ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] gap-1 px-2 py-0.5">
                                        <BadgeCheck className="w-3 h-3" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-800 px-2 py-0.5">
                                        Unclaimed
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
                                    {levelLabel(level)} Office
                                </Badge>
                            </div>

                            {/* Claim CTA if unclaimed */}
                            {!activeHolder && (
                                <Button
                                    size="sm"
                                    className="w-full text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white gap-1.5 shadow-sm mb-4"
                                    onClick={() => navigate('/claim-position')}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Claim Office
                                </Button>
                            )}

                            {/* Linear Stats Section */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                {/* Responsiveness: based on Q&A answer rate */}
                                {(() => {
                                    const answered = questions.filter((q: OfficeQuestion) => q.answer).length;
                                    const responsePct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 45;
                                    const resolvePct = issues.length > 0 ? Math.round((issues.filter((i: CivicAction) => i.status === 'resolved').length / issues.length) * 100) : 15;
                                    const communityScore = issues.length + proposals.length;
                                    return (
                                        <>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Responsiveness</span>
                                                    <span className="font-semibold">{responsePct}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${responsePct}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Resolution Rate</span>
                                                    <span className="font-semibold">{resolvePct}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${resolvePct}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Community</span>
                                                    <span className="font-semibold">{communityScore}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(100, communityScore * 5)}%` }} />
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* ── Bottom CTA — mirrors "View My Civic Resume" button ── */}
                            <Button
                                variant="outline"
                                className="w-full mt-4 gap-2 font-semibold border-2 hover:border-primary hover:text-primary transition-colors rounded-xl"
                                onClick={() => setActiveTab('overview' as OfficeTab)}
                            >
                                View Full Mandate <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* ─────── CENTER: Main Content Area ─────── */}
                <main className="min-w-0 order-2 lg:order-2">
                    {/* ── Top Quick Actions bar — mirrors user dashboard top-row pills ── */}
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
                            className="h-8 gap-1.5 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl"
                            onClick={() => setActiveTab('qa' as OfficeTab)}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Discussion
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 px-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl"
                            onClick={() => setActiveTab('projects' as OfficeTab)}
                        >
                            <ClipboardList className="w-3.5 h-3.5" /> Track Projects
                        </Button>
                        {OVERFLOW_TABS.map((tab) => (
                            <Button
                                key={tab.id}
                                variant="ghost" size="sm"
                                className={cn(
                                    "h-8 gap-1.5 px-3 text-xs font-medium rounded-xl",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                                onClick={() => setActiveTab(tab.id as OfficeTab)}
                            >
                                {tab.icon}
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    <Tabs data-tour="tour-office-tabs" value={activeTab} onValueChange={(v) => setActiveTab(v as OfficeTab)} className="w-full space-y-4">
                        <div className="overflow-x-auto pb-1 scrollbar-hide">
                            <TabsList className="inline-flex h-auto w-auto min-w-full sm:min-w-0 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                {TABS.map(tab => (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="flex items-center gap-2 rounded-xl py-2 px-3 text-sm font-medium text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="min-h-[400px] relative mt-2">
                            {[...TABS, ...OVERFLOW_TABS].map(tab => (
                                <TabsContent key={tab.id} value={tab.id} className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {activeTab === tab.id && renderTab()}
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </main>

                {/* ─────── RIGHT SIDEBAR: Widgets ─────── */}
                <aside className="space-y-4 order-3 hidden xl:block self-start lg:sticky lg:top-16">
                    {/* Current Holder / Handler Widget */}
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-semibold text-sm">Active Manager</h3>
                        </div>
                        <div className="p-4">
                            {isClaimed && holderProfile ? (
                                <Link to={buildProfileLink({ username: holderProfile.username, is_verified: holderProfile.is_verified })} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                                        {holderProfile.avatar_url ? (
                                            <img src={holderProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{holderProfile.display_name || `@${holderProfile.username}`}</p>
                                        <p className="text-xs text-muted-foreground truncate">View Profile</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                            ) : (
                                <div className="text-center py-2 space-y-2">
                                    <Shield className="w-6 h-6 text-amber-500/70 mx-auto" />
                                    <p className="text-xs text-muted-foreground">This office is unmanaged.</p>
                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowClaimModal(true)}>
                                        Claim as Holder
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Office Information Widget */}
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Quick Info</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Elected Position</p>
                                <p className="text-sm font-medium">{position.is_elected ? 'Yes' : 'No / Appointed'}</p>
                            </div>
                            {position.term_years && (
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Term Details</p>
                                    <p className="text-sm font-medium">{position.term_years} Years</p>
                                    {position.next_election_date && (
                                        <p className="text-xs text-muted-foreground mt-0.5">Next Election: {new Date(position.next_election_date).getFullYear()}</p>
                                    )}
                                </div>
                            )}
                            {position.description && (
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">About Position</p>
                                    <p className="text-xs text-muted-foreground line-clamp-4">{position.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>

        {/* ─── Governance Modals ─────────────────────────────────────────────── */}
        {activeHolder?.id && user && (
            <AddPromiseModal
                isOpen={showAddPromise}
                onClose={() => setShowAddPromise(false)}
                officeHolderId={activeHolder.id}
                userId={user.id}
                onPromiseAdded={() => queryClient.invalidateQueries({ queryKey: ['office-promises', activeHolder.id] })}
            />
        )}
        {showUpdatePromise && activeHolder?.id && user && (
            <UpdatePromiseModal
                isOpen={!!showUpdatePromise}
                onClose={() => setShowUpdatePromise(null)}
                promise={showUpdatePromise}
                officeHolderId={activeHolder.id}
                userId={user.id}
                onPromiseUpdated={() => {
                    queryClient.invalidateQueries({ queryKey: ['office-promises', activeHolder.id] });
                    setShowUpdatePromise(null);
                }}
            />
        )}
        {showAnswerQuestion && activeHolder?.id && user && (
            <AnswerQuestionModal
                isOpen={!!showAnswerQuestion}
                onClose={() => setShowAnswerQuestion(null)}
                question={{
                    id: showAnswerQuestion.id,
                    question: showAnswerQuestion.question,
                    asked_by: showAnswerQuestion.profiles?.display_name || showAnswerQuestion.profiles?.username || 'Citizen',
                    asked_at: showAnswerQuestion.asked_at,
                }}
                userId={user.id}
                officeHolderId={activeHolder.id}
                onAnswered={() => {
                    queryClient.invalidateQueries({ queryKey: ['office-questions', position?.id] });
                    setShowAnswerQuestion(null);
                }}
            />
        )}
        {showAddProject && activeHolder?.id && user && (
            <AddProjectModal
                isOpen={showAddProject}
                onClose={() => setShowAddProject(false)}
                officeHolderId={activeHolder.id}
                userId={user.id}
                position={position}
                officeHolderLocation={{
                    county: position?.governance_level === 'county' ? position.jurisdiction_name : undefined,
                    constituency: position?.governance_level === 'constituency' ? position.jurisdiction_name : undefined,
                    ward: position?.governance_level === 'ward' ? position.jurisdiction_name : undefined,
                }}
                onProjectAdded={() => queryClient.invalidateQueries({ queryKey: ['office-projects', jurisdiction, level] })}
            />
        )}
        {showUpdateProject && activeHolder?.id && user && (
            <UpdateProjectModal
                isOpen={!!showUpdateProject}
                onClose={() => setShowUpdateProject(null)}
                project={{ ...showUpdateProject, progress_percentage: null } as any}
                officeHolderId={activeHolder.id}
                userId={user.id}
                onProjectUpdated={() => {
                    queryClient.invalidateQueries({ queryKey: ['office-projects', jurisdiction, level] });
                    setShowUpdateProject(null);
                }}
            />
        )}
        {position && (
            <ClaimPositionModal
                isOpen={showClaimModal}
                onClose={() => { setShowClaimModal(false); queryClient.invalidateQueries({ queryKey: ['office-holder', position.id] }); }}
                position={{ id: position.id, title: position.title, governanceLevel: position.governance_level, jurisdictionName: position.jurisdiction_name, countryCode: position.country_code }}
            />
        )}

        {/* ActionDetailSheet for issue details */}
        <ActionDetailSheet
            actionId={selectedIssueId}
            isOpen={!!selectedIssueId}
            onClose={() => setSelectedIssueId(null)}
        />
        </>
    );
}

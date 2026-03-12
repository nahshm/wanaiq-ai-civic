import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
    MapPin, ThumbsUp, Clock, CheckCircle, XCircle,
    AlertCircle, ArrowRight, Loader2, Users, TrendingUp, Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { ActionDetailSheet } from './ActionDetailSheet';

interface CivicIssue {
    id: string;
    case_number: string;
    title: string;
    description: string;
    category: string;
    action_level: string;
    status: string;
    urgency: string;
    location_text: string | null;
    support_count: number;
    created_at: string;
    user_id: string;
    profiles: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
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

const CATEGORY_EMOJI: Record<string, string> = {
    water: '💧', roads: '🛣️', garbage: '🗑️',
    street_lights: '💡', security: '🛡️', housing: '🏠', health: '🏥',
};

const SORT_OPTIONS = [
    { value: 'newest',       label: 'Newest' },
    { value: 'most_support', label: 'Most Supported' },
    { value: 'urgent',       label: 'Most Urgent' },
];

export const CommunityIssuesFeed = () => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();

    const [issues, setIssues]                   = useState<CivicIssue[]>([]);
    const [loading, setLoading]                 = useState(true);
    const [supportedIds, setSupportedIds]       = useState<Set<string>>(new Set());
    const [supportingId, setSupportingId]       = useState<string | null>(null);
    const [sortBy, setSortBy]                   = useState('newest');
    const [categoryFilter, setCategoryFilter]   = useState('all');
    const [countyName, setCountyName]           = useState<string>('Your Area');
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

    useEffect(() => {
        fetchIssues();
        if (user) fetchUserSupports();
    }, [user]);

    const fetchIssues = async () => {
        try {
            // Get user's county_id from profile
            let countyId: number | null = null;
            if (user) {
                const { data: profile } = await (supabase as any)
                    .from('profiles')
                    .select('county_id, county')
                    .eq('id', user.id)
                    .single();
                countyId = profile?.county_id ?? null;
                if (profile?.county) setCountyName(profile.county);
            }

            let query = (supabase as any)
                .from('civic_actions')
                .select(`
                    id, case_number, title, description, category,
                    action_level, status, urgency, location_text,
                    support_count, created_at, user_id,
                    profiles:user_id(username, display_name, avatar_url)
                `)
                .eq('is_public', true)
                .in('status', ['submitted', 'acknowledged', 'in_progress', 'resolved'])
                .limit(20);

            // Filter by county if we have one
            if (countyId) query = query.eq('county_id', countyId);

            const { data, error } = await query;
            if (error) throw error;
            setIssues(data || []);
        } catch (err) {
            console.error('Failed to fetch community issues:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserSupports = async () => {
        if (!user) return;
        const { data } = await (supabase as any)
            .from('civic_action_supporters')
            .select('action_id')
            .eq('user_id', user.id);
        if (data) setSupportedIds(new Set(data.map((r: any) => r.action_id)));
    };

    const handleToggleSupport = async (issue: CivicIssue) => {
        if (!user) { authModal.open('login'); return; }

        setSupportingId(issue.id);
        const alreadySupported = supportedIds.has(issue.id);

        try {
            if (alreadySupported) {
                await (supabase as any)
                    .from('civic_action_supporters')
                    .delete()
                    .eq('action_id', issue.id)
                    .eq('user_id', user.id);
                setSupportedIds(prev => { const s = new Set(prev); s.delete(issue.id); return s; });
                setIssues(prev => prev.map(i =>
                    i.id === issue.id ? { ...i, support_count: Math.max(0, i.support_count - 1) } : i
                ));
            } else {
                await (supabase as any)
                    .from('civic_action_supporters')
                    .insert({ action_id: issue.id, user_id: user.id });
                setSupportedIds(prev => new Set([...prev, issue.id]));
                setIssues(prev => prev.map(i =>
                    i.id === issue.id ? { ...i, support_count: i.support_count + 1 } : i
                ));

                // Check threshold: 3+ supporters = alert user
                if (issue.support_count + 1 >= 3) {
                    toast({
                        title: '🚨 Community Alert Triggered',
                        description: `${issue.support_count + 1} people have reported "${issue.title}". This issue has been escalated!`,
                    });
                } else {
                    toast({
                        title: '✅ Support Recorded',
                        description: `You've confirmed this issue. ${2 - issue.support_count} more supporters needed to escalate.`,
                    });
                }
            }
        } catch (err) {
            console.error('Support toggle failed:', err);
            toast({ title: 'Error', description: 'Could not update support', variant: 'destructive' });
        } finally {
            setSupportingId(null);
        }
    };

    // Sort & filter
    const sorted = [...issues]
        .filter(i => categoryFilter === 'all' || i.category === categoryFilter)
        .sort((a, b) => {
            if (sortBy === 'most_support') return b.support_count - a.support_count;
            if (sortBy === 'urgent') {
                const order = { high: 3, medium: 2, low: 1 };
                return (order[b.urgency as keyof typeof order] || 0) - (order[a.urgency as keyof typeof order] || 0);
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const uniqueCategories = [...new Set(issues.map(i => i.category))];

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Community Issues
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Community Issues
                        <Badge variant="secondary" className="ml-1 text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {countyName}
                        </Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/dashboard/report">
                            + Report Issue
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-1 flex-wrap">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        {SORT_OPTIONS.map(o => (
                            <button
                                key={o.value}
                                onClick={() => setSortBy(o.value)}
                                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                    sortBy === o.value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                {o.value === 'most_support' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                                {o.label}
                            </button>
                        ))}
                    </div>

                    {uniqueCategories.length > 1 && (
                        <div className="flex gap-1 flex-wrap">
                            <button
                                onClick={() => setCategoryFilter('all')}
                                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                    categoryFilter === 'all' ? 'bg-secondary border-secondary-foreground/20' : 'border-border'
                                }`}
                            >
                                All
                            </button>
                            {uniqueCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                        categoryFilter === cat ? 'bg-secondary border-secondary-foreground/20' : 'border-border'
                                    }`}
                                >
                                    {CATEGORY_EMOJI[cat] || '📋'} {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {sorted.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                            <MapPin className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="font-semibold">No issues reported in {countyName} yet</p>
                        <p className="text-sm text-muted-foreground">
                            Be the first to report a civic issue in your area.
                        </p>
                        <Button asChild size="sm">
                            <Link to="/dashboard/report">Report an Issue</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sorted.map(issue => {
                            const cfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.submitted;
                            const Icon = cfg.icon;
                            const isSupported = supportedIds.has(issue.id);
                            const isLoading = supportingId === issue.id;

                            return (
                                <div
                                    key={issue.id}
                                    className={`border-l-4 ${URGENCY_COLOR[issue.urgency] || 'border-l-gray-300'} rounded-r-lg border border-border/50 p-4 hover:shadow-sm transition-shadow`}
                                >
                                    {/* Header row */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <span className="text-sm">{CATEGORY_EMOJI[issue.category] || '📋'}</span>
                                                <Badge variant="outline" className="font-mono text-xs py-0">
                                                    {issue.case_number}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs py-0 capitalize">
                                                    {issue.category}
                                                </Badge>
                                                {issue.urgency === 'high' && (
                                                    <Badge className="text-xs py-0 bg-red-100 text-red-700 border-red-200">
                                                        High Priority
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-semibold text-sm leading-snug truncate">{issue.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {issue.description}
                                            </p>
                                        </div>
                                        <Badge className={`${cfg.color} text-white flex items-center gap-1 shrink-0 text-xs`}>
                                            <Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </Badge>
                                    </div>

                                    {/* Meta row */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                        {issue.location_text && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {issue.location_text}
                                            </span>
                                        )}
                                        <span>by @{issue.profiles?.username || 'anonymous'}</span>
                                        <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                                    </div>

                                    {/* Support bar (visible when >0) */}
                                    {issue.support_count > 0 && (
                                        <div className="mb-3 bg-muted/50 rounded px-3 py-1.5 flex items-center gap-2 text-xs">
                                            <Users className="w-3.5 h-3.5 text-primary" />
                                            <span className="font-semibold text-primary">{issue.support_count}</span>
                                            <span className="text-muted-foreground">
                                                {issue.support_count === 1 ? 'person has' : 'people have'} this issue too
                                            </span>
                                            {issue.support_count >= 3 && (
                                                <Badge className="ml-auto text-xs bg-orange-100 text-orange-700 border-orange-200 py-0">
                                                    🚨 Escalated
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={isSupported ? 'default' : 'outline'}
                                            className="h-7 text-xs gap-1.5"
                                            onClick={() => handleToggleSupport(issue)}
                                            disabled={isLoading}
                                        >
                                            {isLoading
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <ThumbsUp className={`w-3 h-3 ${isSupported ? 'fill-current' : ''}`} />
                                            }
                                            {isSupported ? 'Supported' : 'I Have This Issue Too'}
                                        </Button>

                                        <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelectedIssueId(issue.id)}>
                                            View Details <ArrowRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            <ActionDetailSheet 
                actionId={selectedIssueId} 
                isOpen={!!selectedIssueId} 
                onClose={() => setSelectedIssueId(null)} 
            />
        </Card>
    );
};

export default CommunityIssuesFeed;

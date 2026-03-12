import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft, MapPin, Calendar, AlertCircle, Clock, CheckCircle,
    XCircle, Share2, Users, Loader2, ImageIcon
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { IssueCommentThread } from '../components/IssueCommentThread';
import { GlassLightbox } from '@/components/ui/GlassLightbox';

interface ActionDetail {
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
    comment_count: number;
    media_urls: string[] | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
    user_id: string;
    profiles: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

interface ActionUpdate {
    id: string;
    previous_status: string | null;
    new_status: string;
    comment: string | null;
    created_at: string;
}

// Step-based progress representation
const STATUS_STEPS = ['submitted', 'acknowledged', 'in_progress', 'resolved'];
const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; step: number }> = {
    submitted: { icon: Clock, color: 'text-gray-500 border-gray-300', label: 'Submitted', step: 0 },
    acknowledged: { icon: AlertCircle, color: 'text-blue-500 border-blue-300', label: 'Acknowledged', step: 1 },
    in_progress: { icon: Clock, color: 'text-yellow-500 border-yellow-300', label: 'In Progress', step: 2 },
    resolved: { icon: CheckCircle, color: 'text-green-500 border-green-300', label: 'Resolved', step: 3 },
    rejected: { icon: XCircle, color: 'text-red-500 border-red-300', label: 'Rejected', step: -1 },
};

const URGENCY_COLORS: Record<string, string> = {
    low: 'bg-green-500/10 text-green-700 border-green-200',
    medium: 'bg-amber-500/10 text-amber-700 border-amber-200',
    high: 'bg-red-500/10 text-red-700 border-red-200',
    critical: 'bg-red-700/10 text-red-900 border-red-300',
};

const StatusStepper = ({ status }: { status: string }) => {
    const currentStep = STATUS_CONFIG[status]?.step ?? 0;
    const isRejected = status === 'rejected';

    if (isRejected) {
        return (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">This issue was rejected</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-1">
            {STATUS_STEPS.map((s, i) => {
                const cfg = STATUS_CONFIG[s];
                const isDone = i <= currentStep;
                const isCurrent = i === currentStep;
                const Icon = cfg.icon;
                return (
                    <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
                        <div className={`flex flex-col items-center gap-1 ${isDone ? '' : 'opacity-40'}`}>
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isCurrent
                                    ? `bg-primary border-primary text-primary-foreground`
                                    : isDone
                                    ? 'bg-green-500/10 border-green-400 text-green-600'
                                    : 'bg-muted border-border text-muted-foreground'
                            }`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[10px] font-medium text-center hidden sm:block ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                {cfg.label}
                            </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors ${
                                i < currentStep ? 'bg-green-400' : 'bg-border'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const MediaGrid = ({ urls }: { urls: string[] }) => {
    const [lightbox, setLightbox] = useState<string | null>(null);
    if (urls.length === 0) return null;

    return (
        <>
            <div className={`grid gap-2 ${urls.length === 1 ? 'grid-cols-1' : urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {urls.map((url, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setLightbox(url)}
                        className={`rounded-lg overflow-hidden border border-border/60 group ${urls.length === 1 ? 'h-64' : 'h-36'}`}
                    >
                        <img
                            src={url}
                            alt={`Evidence photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                    </button>
                ))}
            </div>
            <GlassLightbox
                src={lightbox}
                alt="Evidence photo"
                onClose={() => setLightbox(null)}
            />
        </>
    );
};

const ActionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const authModal = useAuthModal();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [hasSupported, setHasSupported] = useState(false);
    const [supporting, setSupporting] = useState(false);

    // Fetch action details with React Query
    const {
        data: action,
        isLoading,
        isError,
        error,
    } = useQuery<ActionDetail>({
        queryKey: ['action-detail', id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('civic_actions')
                .select(`*, profiles:user_id(username, display_name, avatar_url)`)
                .eq('id', id)
                .single();
            if (error) throw error;
            return data as ActionDetail;
        },
        enabled: !!id,
        staleTime: 30 * 1000,
    });

    // Fetch status updates
    const { data: updates = [] } = useQuery<ActionUpdate[]>({
        queryKey: ['action-updates', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('civic_action_updates')
                .select('*')
                .eq('action_id', id!)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
        staleTime: 30 * 1000,
    });

    // Check initial support status
    useEffect(() => {
        if (!user || !id) return;
        const check = async () => {
            const { data } = await supabase
                .from('civic_action_supporters')
                .select('id')
                .eq('action_id', id)
                .eq('user_id', user.id)
                .maybeSingle();
            setHasSupported(!!data);
        };
        check();
    }, [user, id]);

    const handleSupportToggle = useCallback(() => {
        setHasSupported(true);
        // Refresh action to get updated support_count
        queryClient.invalidateQueries({ queryKey: ['action-detail', id] });
    }, [id, queryClient]);

    const shareToFeed = () => {
        if (!action) return;
        const postContent = `🚨 Civic Issue Alert\n\nCase: ${action.case_number}\n${action.title}\n\n${action.description}\n\nStatus: ${STATUS_CONFIG[action.status]?.label}\nLocation: ${action.location_text || 'Not specified'}\n\n#CivicAction #${action.category}`;
        navigate('/create', { state: { prefill: { content: postContent, title: `Civic Issue: ${action.title}` } } });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl flex justify-center items-center min-h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError || !action) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold text-lg mb-2">Issue Not Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {error instanceof Error ? error.message : "This issue doesn't exist or you don't have permission to view it."}
                        </p>
                        <Button asChild>
                            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const config = STATUS_CONFIG[action.status] ?? STATUS_CONFIG['submitted'];
    const isOwnIssue = user?.id === action.user_id;
    const mediaUrls = action.media_urls || [];

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">Issue Report</h1>
                    <p className="text-sm text-muted-foreground font-mono">#{action.case_number}</p>
                </div>
            </div>

            {/* Main Details Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start gap-2 justify-between">
                        <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="font-mono text-xs">{action.case_number}</Badge>
                                <Badge variant="secondary" className="capitalize text-xs">{action.category?.replace(/_/g, ' ')}</Badge>
                                <Badge variant="outline" className="capitalize text-xs">{action.action_level} level</Badge>
                                {action.urgency && (
                                    <Badge variant="outline" className={`capitalize text-xs ${URGENCY_COLORS[action.urgency] || ''}`}>
                                        {action.urgency}
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl leading-tight">{action.title}</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Progress stepper */}
                    <StatusStepper status={action.status} />

                    {/* Reporter media */}
                    {mediaUrls.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                Evidence Photos ({mediaUrls.length})
                            </h3>
                            <MediaGrid urls={mediaUrls} />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-semibold text-sm mb-1.5">Description</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{action.description}</p>
                    </div>

                    <Separator />

                    {/* Location + Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">Location</p>
                                <p className="text-sm text-muted-foreground">{action.location_text || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">Reported</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(action.created_at), 'PPP')}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Map embed if coords available */}
                    {action.latitude && action.longitude && (
                        <div className="rounded-lg overflow-hidden border border-border/50 h-48">
                            <iframe
                                title="Issue Location"
                                width="100%"
                                height="100%"
                                loading="lazy"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${action.longitude - 0.005},${action.latitude - 0.005},${action.longitude + 0.005},${action.latitude + 0.005}&layer=mapnik&marker=${action.latitude},${action.longitude}`}
                                className="border-0"
                            />
                        </div>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={shareToFeed} size="sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share to Feed
                        </Button>
                        <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>
                                <strong>{action.support_count}</strong> {action.support_count === 1 ? 'supporter' : 'supporters'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Community Evidence Thread */}
            <Card>
                <CardContent className="pt-5">
                    <IssueCommentThread
                        actionId={action.id}
                        supportCount={action.support_count}
                        hasSupported={hasSupported}
                        isOwnIssue={isOwnIssue}
                        onSupportToggle={handleSupportToggle}
                    />
                </CardContent>
            </Card>

            {/* Status History */}
            {updates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {updates.map((update, index) => (
                                <div key={update.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                                        {index < updates.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="capitalize text-xs">{update.new_status?.replace(/_/g, ' ')}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {update.comment && <p className="text-sm text-muted-foreground">{update.comment}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reported By */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Reported By</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {action.profiles?.avatar_url ? (
                                <img src={action.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-semibold">
                                    {(action.profiles?.display_name || action.profiles?.username || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">
                                {action.profiles?.display_name || action.profiles?.username}
                            </p>
                            <p className="text-xs text-muted-foreground">@{action.profiles?.username}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ActionDetail;

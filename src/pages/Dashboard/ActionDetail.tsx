import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    ThumbsUp,
    Share2,
    Users,
    Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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
    created_at: string;
    updated_at: string;
    user_id: string;
    profiles: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    wards: {
        name: string;
    } | null;
    constituencies: {
        name: string;
    } | null;
    counties: {
        name: string;
    } | null;
}

interface ActionUpdate {
    id: string;
    previous_status: string | null;
    new_status: string;
    comment: string | null;
    created_at: string;
}

const STATUS_CONFIG = {
    submitted: { icon: Clock, color: 'bg-gray-500', label: 'Submitted', progress: 20 },
    acknowledged: { icon: AlertCircle, color: 'bg-blue-500', label: 'Acknowledged', progress: 40 },
    in_progress: { icon: Clock, color: 'bg-yellow-500', label: 'In Progress', progress: 60 },
    resolved: { icon: CheckCircle, color: 'bg-green-500', label: 'Resolved', progress: 100 },
    rejected: { icon: XCircle, color: 'bg-red-500', label: 'Rejected', progress: 0 },
};

const CATEGORY_LABELS: Record<string, string> = {
    water: 'Water',
    roads: 'Roads',
    garbage: 'Garbage',
    street_lights: 'Street Lights',
    security: 'Security',
    housing: 'Housing',
    health: 'Health',
};

const ActionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const authModal = useAuthModal();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [action, setAction] = useState<ActionDetail | null>(null);
    const [updates, setUpdates] = useState<ActionUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasSupported, setHasSupported] = useState(false);
    const [supporting, setSupporting] = useState(false);

    useEffect(() => {
        fetchActionDetails();
        if (user) {
            checkIfSupported();
        }
    }, [id, user]);

    const fetchActionDetails = async () => {
        try {
            const { data: actionData, error: actionError } = await supabase
                .from('civic_actions')
                .select(`
          *,
          profiles!civic_actions_user_id_fkey(username, display_name, avatar_url)
        `)
                .eq('id', id)
                .single();

            if (actionError) throw actionError;
            
            // Add placeholder data for related entities
            const enrichedData = {
                ...actionData,
                wards: null,
                constituencies: null,
                counties: null
            };
            setAction(enrichedData as ActionDetail);

            // Fetch status updates
            const { data: updatesData } = await supabase
                .from('civic_action_updates')
                .select('*')
                .eq('action_id', id)
                .order('created_at', { ascending: false });

            setUpdates(updatesData || []);
        } catch (error) {
            console.error('Error fetching action:', error);
            toast({
                title: 'Error',
                description: 'Failed to load action details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const checkIfSupported = async () => {
        if (!user || !id) return;

        const { data } = await supabase
            .from('civic_action_supporters')
            .select('id')
            .eq('action_id', id)
            .eq('user_id', user.id)
            .single();

        setHasSupported(!!data);
    };

    const toggleSupport = async () => {
        if (!user) {
            authModal.open('login');
            return;
        }

        setSupporting(true);

        try {
            if (hasSupported) {
                // Unsupport
                await supabase
                    .from('civic_action_supporters')
                    .delete()
                    .eq('action_id', id)
                    .eq('user_id', user.id);

                setHasSupported(false);
                setAction(prev => prev ? { ...prev, support_count: prev.support_count - 1 } : null);
            } else {
                // Support
                await supabase
                    .from('civic_action_supporters')
                    .insert({
                        action_id: id,
                        user_id: user.id,
                    });

                setHasSupported(true);
                setAction(prev => prev ? { ...prev, support_count: prev.support_count + 1 } : null);
            }
        } catch (error) {
            console.error('Error toggling support:', error);
            toast({
                title: 'Error',
                description: 'Failed to update support',
                variant: 'destructive',
            });
        } finally {
            setSupporting(false);
        }
    };

    const shareToFeed = async () => {
        if (!action) return;

        // Navigate to create post with pre-filled content
        const postContent = `🚨 Civic Issue Alert\n\nCase: ${action.case_number}\n${action.title}\n\n${action.description}\n\nStatus: ${STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG]?.label}\nLocation: ${action.location_text || 'Not specified'}\n\n#CivicAction #${action.category}`;

        navigate('/create', {
            state: {
                prefill: {
                    content: postContent,
                    title: `Civic Issue: ${action.title}`,
                },
            },
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!action) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold text-lg mb-2">Action Not Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            This civic action doesn't exist or you don't have permission to view it.
                        </p>
                        <Button asChild>
                            <Link to="/dashboard">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const config = STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG];
    const Icon = config.icon;
    const categoryLabel = CATEGORY_LABELS[action.category] || action.category;

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Action Details</h1>
                    <p className="text-sm text-muted-foreground">Case {action.case_number}</p>
                </div>
            </div>

            {/* Main Details Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-mono">
                                    {action.case_number}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                    {categoryLabel}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                    {action.action_level} level
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                    {action.urgency} urgency
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl">{action.title}</CardTitle>
                        </div>
                        <Badge className={`${config.color} text-white flex items-center gap-1`}>
                            <Icon className="w-4 h-4" />
                            {config.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    {(action.status === 'in_progress' || action.status === 'acknowledged') && (
                        <div>
                            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                <span>Progress</span>
                                <span>{config.progress}%</span>
                            </div>
                            <Progress value={config.progress} className="h-3" />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {action.description}
                        </p>
                    </div>

                    <Separator />

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">Location</p>
                                <p className="text-sm text-muted-foreground">
                                    {action.location_text || 'Not specified'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {action.wards?.name || 'Unknown Ward'}
                                    {action.constituencies && `, ${action.constituencies.name}`}
                                    {action.counties && `, ${action.counties.name}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">Reported</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(action.created_at), 'PPP')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant={hasSupported ? 'default' : 'outline'}
                            onClick={toggleSupport}
                            disabled={supporting}
                            className="flex-1 md:flex-initial"
                        >
                            {supporting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ThumbsUp className={`w-4 h-4 mr-2 ${hasSupported ? 'fill-current' : ''}`} />
                            )}
                            {hasSupported ? 'Supported' : 'I Have This Issue Too'}
                            {action.support_count > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {action.support_count}
                                </Badge>
                            )}
                        </Button>

                        <Button variant="outline" onClick={shareToFeed}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share to Feed
                        </Button>
                    </div>

                    {/* Community Support */}
                    {action.support_count > 0 && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{action.support_count}</span>
                                <span className="text-muted-foreground">
                                    {action.support_count === 1 ? 'person has' : 'people have'} this issue too
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status History */}
            {updates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Status History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {updates.map((update, index) => (
                                <div key={update.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        {index < updates.length - 1 && (
                                            <div className="w-0.5 h-full bg-border"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="capitalize">
                                                {update.new_status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {update.comment && (
                                            <p className="text-sm text-muted-foreground">{update.comment}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reported By */}
            <Card>
                <CardHeader>
                    <CardTitle>Reported By</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {action.profiles.avatar_url ? (
                                <img
                                    src={action.profiles.avatar_url}
                                    alt={action.profiles.display_name || action.profiles.username}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-lg font-semibold">
                                    {(action.profiles.display_name || action.profiles.username).charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold">
                                {action.profiles.display_name || action.profiles.username}
                            </p>
                            <p className="text-sm text-muted-foreground">@{action.profiles.username}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ActionDetail;

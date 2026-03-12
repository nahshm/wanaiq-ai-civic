import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
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

interface ActionDetailSheetProps {
    actionId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ActionDetailSheet = ({ actionId, isOpen, onClose }: ActionDetailSheetProps) => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [action, setAction] = useState<ActionDetail | null>(null);
    const [updates, setUpdates] = useState<ActionUpdate[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSupported, setHasSupported] = useState(false);
    const [supporting, setSupporting] = useState(false);

    useEffect(() => {
        if (!isOpen || !actionId) return;
        fetchActionDetails();
        if (user) {
            checkIfSupported();
        }
    }, [actionId, isOpen, user]);

    const fetchActionDetails = async () => {
        setLoading(true);
        try {
            const { data: actionData, error: actionError } = await supabase
                .from('civic_actions')
                .select(`
          *,
          profiles!civic_actions_user_id_fkey(username, display_name, avatar_url)
        `)
                .eq('id', actionId)
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
                .eq('action_id', actionId)
                .order('created_at', { ascending: false });

            setUpdates(updatesData || []);
        } catch (error) {
            console.error('Error fetching action:', error);
            toast({
                title: 'Error',
                description: 'Failed to load action details',
                variant: 'destructive',
            });
            onClose(); // Close if failed to load
        } finally {
            setLoading(false);
        }
    };

    const checkIfSupported = async () => {
        if (!user || !actionId) return;

        const { data } = await supabase
            .from('civic_action_supporters')
            .select('id')
            .eq('action_id', actionId)
            .eq('user_id', user.id)
            .single();

        setHasSupported(!!data);
    };

    const toggleSupport = async () => {
        if (!user) {
            authModal.open('login');
            return;
        }

        if (!actionId) return;
        setSupporting(true);

        try {
            if (hasSupported) {
                // Unsupport
                await supabase
                    .from('civic_action_supporters')
                    .delete()
                    .eq('action_id', actionId)
                    .eq('user_id', user.id);

                setHasSupported(false);
                setAction(prev => prev ? { ...prev, support_count: prev.support_count - 1 } : null);
            } else {
                // Support
                await supabase
                    .from('civic_action_supporters')
                    .insert({
                        action_id: actionId,
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

        onClose(); // Close the sheet before navigating

        navigate('/create', {
            state: {
                prefill: {
                    content: postContent,
                    title: `Civic Issue: ${action.title}`,
                },
            },
        });
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto px-4 sm:px-6">
                <SheetHeader className="mb-6 mt-4">
                    <SheetTitle>Action Details</SheetTitle>
                    {action && <p className="text-sm text-muted-foreground">Case {action.case_number}</p>}
                </SheetHeader>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !action ? (
                    <div className="text-center py-20">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold text-lg mb-2">Action Not Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            This civic action doesn't exist or you don't have permission to view it.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 pb-12">
                        {/* Main Details Card */}
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="font-mono text-xs border-primary/20 text-primary bg-primary/5">
                                                {action.case_number}
                                            </Badge>
                                            <Badge variant="secondary" className="capitalize text-xs">
                                                {CATEGORY_LABELS[action.category] || action.category}
                                            </Badge>
                                            <Badge variant="outline" className="capitalize text-xs">
                                                {action.action_level} level
                                            </Badge>
                                            <Badge variant={action.urgency === 'high' ? 'destructive' : 'outline'} className="capitalize text-xs">
                                                {action.urgency} urgency
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl sm:text-2xl leading-tight text-foreground/90">
                                            {action.title}
                                        </CardTitle>
                                    </div>
                                    <div className="shrink-0 mt-1">
                                        {(() => {
                                            const config = STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.submitted;
                                            const Icon = config.icon;
                                            return (
                                                <Badge className={`${config.color} text-white flex items-center gap-1.5 shadow-sm px-2.5 py-1 text-xs sm:text-sm`}>
                                                    <Icon className="w-4 h-4" />
                                                    {config.label}
                                                </Badge>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-5">
                                {/* Progress Bar */}
                                {(action.status === 'in_progress' || action.status === 'acknowledged') && (
                                    <div>
                                        {(() => {
                                            const config = STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG];
                                            return (
                                                <>
                                                    <div className="flex justify-between text-sm text-muted-foreground mb-2 font-medium">
                                                        <span>Resolution Progress</span>
                                                        <span className="text-primary">{config.progress}%</span>
                                                    </div>
                                                    <Progress value={config.progress} className="h-2.5" />
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <h3 className="font-semibold mb-2.5 flex items-center gap-2 text-foreground/90">
                                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                                        Description
                                    </h3>
                                    <div className="bg-muted/30 p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed border border-border/50">
                                        {action.description}
                                    </div>
                                </div>

                                <Separator className="bg-border/50" />

                                {/* Location & Date */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm mb-1 text-foreground/90">Location</p>
                                            <p className="text-sm text-muted-foreground leading-snug">
                                                {action.location_text || 'Not specified'}
                                            </p>
                                            <p className="text-xs text-muted-foreground/80 mt-1.5">
                                                {action.wards?.name || 'Unknown Ward'}
                                                {action.constituencies && `, ${action.constituencies.name}`}
                                                {action.counties && `, ${action.counties.name}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Calendar className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm mb-1 text-foreground/90">Reported Date</p>
                                            <p className="text-sm text-muted-foreground leading-snug">
                                                {format(new Date(action.created_at), 'PPP')}
                                            </p>
                                            <p className="text-xs text-muted-foreground/80 mt-1.5 capitalize">
                                                {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-border/50" />

                                {/* Interactive Actions */}
                                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                    <Button
                                        variant={hasSupported ? 'default' : 'outline'}
                                        onClick={toggleSupport}
                                        disabled={supporting}
                                        className={`flex-1 sm:flex-initial h-11 shadow-sm ${hasSupported ? 'bg-primary/90 hover:bg-primary' : ''}`}
                                    >
                                        {supporting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <ThumbsUp className={`w-4 h-4 mr-2 ${hasSupported ? 'fill-current' : ''}`} />
                                        )}
                                        {hasSupported ? 'Supported' : 'I Have This Issue Too'}
                                    </Button>

                                    <Button variant="outline" onClick={shareToFeed} className="flex-1 sm:flex-initial h-11 bg-background hover:bg-muted/50 border-border/80">
                                        <Share2 className="w-4 h-4 mr-2 text-muted-foreground" />
                                        Share Alert
                                    </Button>
                                </div>

                                {/* Community Support Box */}
                                {action.support_count > 0 && (
                                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-primary/90 flex items-center gap-2">
                                                Community Backed
                                                {action.support_count >= 3 && (
                                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none text-[10px] py-0 px-1.5 uppercase transition-none">
                                                        Escalated
                                                    </Badge>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground/80 mt-0.5">
                                                <span className="font-bold text-foreground/70">{action.support_count}</span> {action.support_count === 1 ? 'person has verified' : 'people have verified'} this issue.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status History */}
                        {updates.length > 0 && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader className="pb-3 border-b border-border/20">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        Status Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <div className="space-y-6">
                                        {updates.map((update, index) => (
                                            <div key={update.id} className="flex gap-4 group">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border-[3px] border-primary group-hover:scale-110 transition-transform shadow-sm"></div>
                                                    {index < updates.length - 1 && (
                                                        <div className="w-[2px] h-full bg-border/40 my-1 group-hover:bg-primary/30 transition-colors"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <Badge variant="secondary" className="capitalize text-[11px] px-2 py-0 border border-border/50 bg-background shadow-sm">
                                                            {update.new_status}
                                                        </Badge>
                                                        <span className="text-[11px] text-muted-foreground/80 font-medium tracking-wide">
                                                            {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    {update.comment && (
                                                        <div className="bg-muted/30 border border-border/50 p-3 rounded-lg text-sm text-foreground/80 mt-2 shadow-sm">
                                                            {update.comment}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reporter Info */}
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20">
                            <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border">
                                {action.profiles.avatar_url ? (
                                    <img
                                        src={action.profiles.avatar_url}
                                        alt={action.profiles.display_name || action.profiles.username}
                                        className="w-full h-full rounded-full object-cover shadow-inner"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-muted-foreground">
                                        {(action.profiles.display_name || action.profiles.username).charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-sm leading-none mb-1 text-foreground/90">
                                    {action.profiles.display_name || action.profiles.username}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">@{action.profiles.username}</p>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

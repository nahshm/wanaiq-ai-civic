import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowRight,
    Loader2,
    Filter,
    ThumbsUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ActionDetailSheet } from './ActionDetailSheet';

interface CivicAction {
    id: string;
    case_number: string;
    title: string;
    category: string;
    status: string;
    urgency: string;
    created_at: string;
    action_level: string;
    support_count: number;
}

const STATUS_CONFIG = {
    submitted: {
        icon: Clock,
        color: 'bg-gray-500',
        label: 'Submitted',
        progress: 20
    },
    acknowledged: {
        icon: AlertCircle,
        color: 'bg-blue-500',
        label: 'Acknowledged',
        progress: 40
    },
    in_progress: {
        icon: Clock,
        color: 'bg-yellow-500',
        label: 'In Progress',
        progress: 60
    },
    resolved: {
        icon: CheckCircle,
        color: 'bg-green-500',
        label: 'Resolved',
        progress: 100
    },
    rejected: {
        icon: XCircle,
        color: 'bg-red-500',
        label: 'Rejected',
        progress: 0
    },
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

export const MyActions = () => {
    const { user } = useAuth();
    const [actions, setActions] = useState<CivicAction[]>([]);
    const [filteredActions, setFilteredActions] = useState<CivicAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [stats, setStats] = useState({
        total: 0,
        in_progress: 0,
        resolved: 0,
    });
    const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchActions();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [actions, statusFilter, categoryFilter, sortBy]);

    const fetchActions = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('civic_actions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setActions(data || []);

            // Calculate stats
            const total = data?.length || 0;
            const inProgress = data?.filter(a => a.status === 'in_progress' || a.status === 'acknowledged').length || 0;
            const resolved = data?.filter(a => a.status === 'resolved').length || 0;

            setStats({ total, in_progress: inProgress, resolved });
        } catch (error) {
            console.error('Error fetching actions:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...actions];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(action => action.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(action => action.category === categoryFilter);
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'most_supported':
                filtered.sort((a, b) => (b.support_count || 0) - (a.support_count || 0));
                break;
        }

        setFilteredActions(filtered.slice(0, 10)); // Limit to 10 for performance
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Recent Actions</CardTitle>
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
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <span>My Recent Actions</span>
                    {stats.total > 0 && (
                        <div className="flex gap-4 text-sm font-normal">
                            <span className="text-muted-foreground">
                                Total: <strong>{stats.total}</strong>
                            </span>
                            <span className="text-yellow-600">
                                Active: <strong>{stats.in_progress}</strong>
                            </span>
                            <span className="text-green-600">
                                Resolved: <strong>{stats.resolved}</strong>
                            </span>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {actions.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="bg-muted/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg mb-1">No civic actions yet</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Report your first issue to start making a difference in your community
                            </p>
                            <Button asChild>
                                <Link to="/dashboard/report">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Report Your First Issue
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <Filter className="w-4 h-4 text-muted-foreground" />

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="most_supported">Most Supported</SelectItem>
                                </SelectContent>
                            </Select>

                            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setCategoryFilter('all');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>

                        {/* Actions List */}
                        <div className="space-y-3">
                            {filteredActions.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">
                                        No actions match your filters
                                    </p>
                                </div>
                            ) : (
                                filteredActions.map((action) => {
                                    const config = STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.submitted;
                                    const Icon = config.icon;
                                    const categoryLabel = CATEGORY_LABELS[action.category] || action.category;

                                    return (
                                        <div
                                            key={action.id}
                                            className="p-4 border rounded-lg hover:border-primary/50 transition-colors hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {action.case_number}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs capitalize">
                                                            {categoryLabel}
                                                        </Badge>
                                                        {action.support_count > 0 && (
                                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                                <ThumbsUp className="w-3 h-3" />
                                                                {action.support_count}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-sm mb-1">{action.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                                                        {' • '}
                                                        <span className="capitalize">{action.action_level}</span> level
                                                    </p>
                                                </div>
                                                <Badge className={`${config.color} text-white flex items-center gap-1`}>
                                                    <Icon className="w-3 h-3" />
                                                    {config.label}
                                                </Badge>
                                            </div>

                                            {/* Progress bar for active issues */}
                                            {(action.status === 'in_progress' || action.status === 'acknowledged') && (
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                        <span>Progress</span>
                                                        <span>{config.progress}%</span>
                                                    </div>
                                                    <Progress value={config.progress} className="h-2" />
                                                </div>
                                            )}

                                            {/* View details link */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-between mt-2"
                                                onClick={() => setSelectedActionId(action.id)}
                                            >
                                                <span>View Details</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Show count */}
                        {filteredActions.length > 0 && (
                            <p className="text-xs text-center text-muted-foreground">
                                Showing {filteredActions.length} of {actions.length} actions
                            </p>
                        )}
                    </div>
                )}
            </CardContent>

            <ActionDetailSheet 
                actionId={selectedActionId} 
                isOpen={!!selectedActionId} 
                onClose={() => setSelectedActionId(null)} 
            />
        </Card>
    );
};

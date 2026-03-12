import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Zap, AlertTriangle, CheckCircle, Clock, RefreshCw, Plus,
    Camera, Search, BarChart3, FileText, MapPin, MessageSquare,
    ChevronRight, TrendingUp, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Link } from 'react-router-dom';

interface ActionCenterProps {
    className?: string;
}

interface CivicAction {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
    location?: string;
    createdAt: string;
    updatedAt: string;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    submitted: { label: 'Submitted', color: 'bg-gray-500', icon: <Clock className="w-3 h-3" /> },
    acknowledged: { label: 'Acknowledged', color: 'bg-blue-500', icon: <MessageSquare className="w-3 h-3" /> },
    in_progress: { label: 'In Progress', color: 'bg-yellow-500', icon: <Activity className="w-3 h-3" /> },
    resolved: { label: 'Resolved', color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
    closed: { label: 'Closed', color: 'bg-gray-400', icon: <CheckCircle className="w-3 h-3" /> },
};

// Quick action buttons
const QUICK_ACTIONS = [
    { id: 'report', label: 'Report Issue', icon: <Camera className="w-4 h-4" />, href: '/submit' },
    { id: 'track', label: 'Track Projects', icon: <Search className="w-4 h-4" />, href: '/projects' },
    { id: 'submit', label: 'Dashboard', icon: <FileText className="w-4 h-4" />, href: '/dashboard' },
];

// Skeleton loader
const ActionCenterSkeleton: React.FC = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-32" />
        </CardContent>
    </Card>
);

// Stat card component
const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}> = ({ label, value, icon, color }) => (
    <div className={cn(
        'flex flex-col items-center justify-center p-4 rounded-lg',
        color
    )}>
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <span className="text-2xl font-bold">{value}</span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
);

// Action item component
const ActionItem: React.FC<{ action: CivicAction }> = ({ action }) => {
    const statusConfig = STATUS_CONFIG[action.status] || STATUS_CONFIG.submitted;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            {/* Status indicator */}
            <div className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                statusConfig.color
            )} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{action.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {action.location && (
                        <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {action.location}
                        </span>
                    )}
                    <span>•</span>
                    <span>{new Date(action.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Status badge */}
            <Badge variant="secondary" className="flex-shrink-0 gap-1 text-xs">
                {statusConfig.icon}
                {statusConfig.label}
            </Badge>

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
    );
};

/**
 * ActionCenter - Command center for civic actions (replaces CivicDashboard)
 */
const ActionCenterContent: React.FC<ActionCenterProps> = ({ className }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('active');

    // Fetch civic actions
    const {
        data: actions,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['my-civic-actions', user?.id],
        queryFn: async (): Promise<CivicAction[]> => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('civic_actions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            return (data || []).map(a => ({
                id: a.id,
                title: a.title,
                description: a.description,
                type: a.action_type || a.category || 'general',
                status: a.status as CivicAction['status'],
                location: a.county_id || undefined,
                createdAt: a.created_at,
                updatedAt: a.updated_at,
            }));
        },
        enabled: !!user?.id,
        staleTime: 2 * 60 * 1000,
    });

    // Calculate stats
    const stats = {
        active: actions?.filter(a => ['submitted', 'acknowledged', 'in_progress'].includes(a.status)).length || 0,
        resolved: actions?.filter(a => a.status === 'resolved').length || 0,
        total: actions?.length || 0,
    };

    // Filter actions by tab
    const filteredActions = actions?.filter(a => {
        if (activeTab === 'active') return ['submitted', 'acknowledged', 'in_progress'].includes(a.status);
        if (activeTab === 'resolved') return a.status === 'resolved';
        return true;
    }) || [];

    if (isLoading) {
        return <ActionCenterSkeleton />;
    }

    if (isError) {
        return (
            <Card className={cn('border-destructive/50', className)}>
                <CardContent className="py-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                        Failed to load your actions
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-500" />
                            Action Center
                        </CardTitle>
                        <CardDescription>
                            Your civic engagement hub
                        </CardDescription>
                    </div>
                    <Button size="sm" asChild>
                        <Link to="/submit">
                            <Plus className="w-4 h-4 mr-1" />
                            New Action
                        </Link>
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        label="Active"
                        value={stats.active}
                        icon={<Activity className="w-4 h-4 text-yellow-500" />}
                        color="bg-yellow-500/10"
                    />
                    <StatCard
                        label="Resolved"
                        value={stats.resolved}
                        icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                        color="bg-green-500/10"
                    />
                    <StatCard
                        label="Impact"
                        value={stats.resolved * 10}
                        icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                        color="bg-blue-500/10"
                    />
                </div>

                {/* Quick Actions */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map(action => (
                            <Button
                                key={action.id}
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <Link to={action.href}>
                                    {action.icon}
                                    <span className="ml-1">{action.label}</span>
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Actions List */}
                <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-3">
                            <TabsTrigger value="active" className="text-xs">
                                Active ({stats.active})
                            </TabsTrigger>
                            <TabsTrigger value="resolved" className="text-xs">
                                Resolved ({stats.resolved})
                            </TabsTrigger>
                            <TabsTrigger value="all" className="text-xs">
                                All ({stats.total})
                            </TabsTrigger>
                        </TabsList>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {filteredActions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No actions yet</p>
                                    <p className="text-xs">Start by reporting an issue!</p>
                                </div>
                            ) : (
                                filteredActions.map(action => (
                                    <ActionItem key={action.id} action={action} />
                                ))
                            )}
                        </div>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const ActionCenter: React.FC<ActionCenterProps> = (props) => (
    <ErrorBoundary componentName="ActionCenter">
        <ActionCenterContent {...props} />
    </ErrorBoundary>
);

export default ActionCenter;

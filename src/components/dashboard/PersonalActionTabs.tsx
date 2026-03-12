import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertTriangle, ChevronRight, Plus, FolderOpen } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// MY ISSUES TAB — personal civic actions reported by auth user
// ─────────────────────────────────────────────────────────────────────────────

interface CivicAction {
    id: string;
    title: string;
    status: string;
    category: string | null;
    created_at: string;
    institution_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Open', color: 'border-blue-500/30 text-blue-600 bg-blue-500/5', icon: <Clock className="w-3 h-3" /> },
    in_progress: { label: 'In Progress', color: 'border-yellow-500/30 text-yellow-600 bg-yellow-500/5', icon: <AlertTriangle className="w-3 h-3" /> },
    resolved: { label: 'Resolved', color: 'border-green-500/30 text-green-600 bg-green-500/5', icon: <CheckCircle className="w-3 h-3" /> },
    closed: { label: 'Closed', color: 'border-muted-foreground/30 text-muted-foreground bg-muted/30', icon: <CheckCircle className="w-3 h-3" /> },
};

export const MyIssuesTab: React.FC = () => {
    const { user } = useAuth();

    const { data: issues, isLoading, isError } = useQuery<CivicAction[]>({
        queryKey: ['my-civic-actions', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('civic_actions')
                .select('id, title, status, category, created_at, institution_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
        );
    }

    if (isError) {
        return (
            <Card className="border-destructive/30">
                <CardContent className="py-8 text-center text-destructive">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Failed to load your issues. Please try again.</p>
                </CardContent>
            </Card>
        );
    }

    if (!issues?.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-4">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                    <div>
                        <p className="font-medium">No issues reported yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Report a civic issue in your community to see it here.
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link to="/dashboard/report">
                            <Plus className="w-4 h-4 mr-2" />
                            Report an Issue
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">{issues.length} issue{issues.length !== 1 ? 's' : ''} reported</p>
                <Button asChild size="sm" variant="outline">
                    <Link to="/dashboard/report">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Report New
                    </Link>
                </Button>
            </div>

            {issues.map((issue) => {
                const status = statusConfig[issue.status] ?? statusConfig.open;
                return (
                    <Card key={issue.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <Badge variant="outline" className={`text-[10px] gap-1 ${status.color}`}>
                                            {status.icon}
                                            {status.label}
                                        </Badge>
                                        {issue.category && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {issue.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="font-medium text-sm truncate">{issue.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(issue.created_at).toLocaleDateString('en-US', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    asChild
                                >
                                    <Link to={`/dashboard/actions/${issue.id}`}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MY PROJECTS TAB — government projects created by auth user
// ─────────────────────────────────────────────────────────────────────────────

interface GovProject {
    id: string;
    title: string;
    status: string;
    category: string | null;
    created_at: string;
    progress_percentage: number | null;
}

const projectStatusConfig: Record<string, { label: string; color: string }> = {
    planning: { label: 'Planning', color: 'border-purple-500/30 text-purple-600 bg-purple-500/5' },
    active: { label: 'Active', color: 'border-blue-500/30 text-blue-600 bg-blue-500/5' },
    completed: { label: 'Completed', color: 'border-green-500/30 text-green-600 bg-green-500/5' },
    stalled: { label: 'Stalled', color: 'border-red-500/30 text-red-600 bg-red-500/5' },
    cancelled: { label: 'Cancelled', color: 'border-muted-foreground/30 text-muted-foreground bg-muted/30' },
};

export const MyProjectsTab: React.FC = () => {
    const { user } = useAuth();

    const { data: projects, isLoading, isError } = useQuery<GovProject[]>({
        queryKey: ['my-gov-projects', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('government_projects')
                .select('id, title, status, category, created_at, progress_percentage')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
        );
    }

    if (isError) {
        return (
            <Card className="border-destructive/30">
                <CardContent className="py-8 text-center text-destructive">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Failed to load projects.</p>
                </CardContent>
            </Card>
        );
    }

    if (!projects?.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-4">
                    <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                    <div>
                        <p className="font-medium">No projects yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Submit a government project to track its progress.
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link to="/projects/submit">
                            <Plus className="w-4 h-4 mr-2" />
                            Submit Project
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                <Button asChild size="sm" variant="outline">
                    <Link to="/projects/submit">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Project
                    </Link>
                </Button>
            </div>

            {projects.map((project) => {
                const status = projectStatusConfig[project.status] ?? projectStatusConfig.planning;
                return (
                    <Card key={project.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                                            {status.label}
                                        </Badge>
                                        {project.category && (
                                            <Badge variant="secondary" className="text-[10px]">{project.category}</Badge>
                                        )}
                                    </div>
                                    <p className="font-medium text-sm truncate">{project.title}</p>
                                    {project.progress_percentage !== null && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${project.progress_percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                                {project.progress_percentage}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <Link to={`/projects/${project.id}`}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOD TOOLS TAB — moderation tools for community admins/moderators
// ─────────────────────────────────────────────────────────────────────────────

interface ModRole {
    community_id: string;
    role: string;
    communities: { name: string } | null;
}

interface ContentFlag {
    id: string;
    reason: string;
    status: string;
    created_at: string;
    content_type: string;
    community_id: string | null;
}

export const ModToolsTab: React.FC = () => {
    const { user } = useAuth();

    // Fetch communities where user is mod/admin
    const { data: modRoles, isLoading: rolesLoading } = useQuery<ModRole[]>({
        queryKey: ['mod-roles', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('community_moderators')
                .select('community_id, role, communities(name)')
                .eq('user_id', user.id)
                .in('role', ['admin', 'moderator']);
            if (error) throw error;
            return (data ?? []) as ModRole[];
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
    });

    const communityIds = modRoles?.map(r => r.community_id) ?? [];

    // Fetch pending flags in communities where user is mod
    const { data: pendingFlags, isLoading: flagsLoading } = useQuery<ContentFlag[]>({
        queryKey: ['mod-pending-flags', communityIds],
        queryFn: async () => {
            // Disabled: content_flags table does not exist yet in schema
            return [];
        },
        enabled: communityIds.length > 0,
        staleTime: 60 * 1000,
    });

    const isLoading = rolesLoading || flagsLoading;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        );
    }

    // Not a mod anywhere
    if (!modRoles?.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-2">
                    <div className="text-4xl">🛡️</div>
                    <p className="font-medium">No moderator roles</p>
                    <p className="text-sm text-muted-foreground">
                        You're not an admin or moderator of any community yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Communities where user is mod */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        🛡️ Your Communities
                        <Badge variant="secondary" className="text-[10px]">{modRoles.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                    {modRoles.map((role) => (
                        <div key={role.community_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium">{role.communities?.name ?? 'Unknown Community'}</p>
                                <Badge variant="outline" className={`text-[10px] ${role.role === 'admin' ? 'border-orange-500/30 text-orange-600' : 'border-blue-500/30 text-blue-600'}`}>
                                    {role.role}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <Link to={`/c/${role.communities?.name ?? role.community_id}`}>
                                    Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Pending flags */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        🚩 Pending Reports
                        {(pendingFlags?.length ?? 0) > 0 && (
                            <Badge className="text-[10px] bg-red-500 text-white border-0">
                                {pendingFlags?.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {!pendingFlags?.length ? (
                        <div className="text-center py-6">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No pending reports. Queue is clear! ✅</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingFlags.map((flag) => (
                                <div key={flag.id} className="flex items-start gap-3 p-2 border rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-600">
                                                {flag.content_type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{flag.reason}</p>
                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                            {new Date(flag.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full text-xs mt-2" asChild>
                                <Link to="/admin/dashboard">View Full Moderation Queue</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

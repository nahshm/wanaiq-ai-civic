import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { copyToClipboard } from '@/lib/clipboard-utils';
import {
    ArrowLeft, MapPin, DollarSign, Calendar, Share2, Bookmark, Plus, AlertCircle, CheckSquare,
    Building2, FileText, Download, TrendingUp, CheckCircle,
    Clock, XCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { useProjectDetails, trackProjectView } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { MediaCarousel } from '@/components/projects/MediaCarousel';
import { MediaGallery } from '@/components/projects/MediaGallery';
import { EntityList } from '@/components/projects/EntityBadge';
import { EngagementBar } from '@/components/projects/EngagementBar';
import { ProjectTimeline } from '@/components/projects/ProjectTimeline';
import { PROJECT_CATEGORIES_2026 } from '@/constants/projectConstants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const statusConfig = {
    planned: { icon: Clock, color: 'bg-gray-500', label: 'Planned' },
    ongoing: { icon: TrendingUp, color: 'bg-blue-500', label: 'Ongoing' },
    completed: { icon: CheckCircle, color: 'bg-green-500', label: 'Completed' },
    cancelled: { icon: XCircle, color: 'bg-red-500', label: 'Cancelled' },
    stalled: { icon: AlertTriangle, color: 'bg-yellow-500', label: 'Stalled' }
};

const ProjectDetail = () => {
    const params = useParams<{ projectId?: string }>();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    // Handle both /projects/:id and /p/:id (via PrefixRouter)
    let projectId = params.projectId;
    if (!projectId && pathname.startsWith('/p/')) {
        projectId = pathname.split('/')[2];
    }
    const { user } = useAuth();
    const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
    const [postUpdateOpen, setPostUpdateOpen] = useState(false);
    const [reportIssueOpen, setReportIssueOpen] = useState(false);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [updateForm, setUpdateForm] = useState({
        title: '',
        description: '',
        update_type: 'progress',
        media_urls: [] as string[]
    });

    const [issueForm, setIssueForm] = useState({
        title: '',
        description: '',
        severity: 'medium'
    });

    const [verifyForm, setVerifyForm] = useState({
        description: '',
        media_urls: [] as string[]
    });

    // Fetch project data with React Query
    const { data: project, isLoading, error, refetch } = useProjectDetails(projectId);

    // Track view when project loads
    useEffect(() => {
        if (project && user) {
            trackProjectView(project.id, user.id);
        }
    }, [project, user]);

    const handlePostUpdate = async () => {
        if (!projectId || !user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('project_updates')
                .insert({
                    project_id: projectId,
                    title: updateForm.title,
                    description: updateForm.description,
                    update_type: updateForm.update_type,
                    media_urls: updateForm.media_urls.length > 0 ? updateForm.media_urls : null,
                    created_by: user.id,
                    community_verified: false
                });

            if (error) throw error;

            // Reset form and close modal
            setUpdateForm({ title: '', description: '', update_type: 'progress', media_urls: [] });
            setPostUpdateOpen(false);
            refetch();
        } catch (error) {
            console.error('Error posting update:', error);
            alert('Failed to post update. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportIssue = async () => {
        if (!projectId || !user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('project_updates')
                .insert({
                    project_id: projectId,
                    title: issueForm.title,
                    description: issueForm.description,
                    update_type: 'issue',
                    created_by: user.id,
                    community_verified: false
                });

            if (error) throw error;

            setIssueForm({ title: '', description: '', severity: 'medium' });
            setReportIssueOpen(false);
            refetch();
        } catch (error) {
            console.error('Error reporting issue:', error);
            alert('Failed to report issue. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (!projectId || !user) return;

        setSubmitting(true);
        try {
            // Add verification entry
            const { error: verificationError } = await (supabase.from as any)('project_verifications')
                .insert({
                    project_id: projectId,
                    user_id: user.id,
                    verification_notes: verifyForm.description,
                    media_urls: verifyForm.media_urls.length > 0 ? verifyForm.media_urls : null,
                    is_verified: true
                });

            if (verificationError) throw verificationError;

            // Also add as timeline update
            const { error: updateError } = await supabase
                .from('project_updates')
                .insert({
                    project_id: projectId,
                    title: 'Project Verified',
                    description: verifyForm.description || 'Community member verified this project.',
                    update_type: 'milestone',
                    media_urls: verifyForm.media_urls.length > 0 ? verifyForm.media_urls : null,
                    created_by: user.id,
                    community_verified: true
                });

            if (updateError) throw updateError;

            setVerifyForm({ description: '', media_urls: [] });
            setVerifyOpen(false);
            refetch();
        } catch (error) {
            console.error('Error verifying project:', error);
            alert('Failed to verify project. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <Skeleton className="h-8 w-32 mb-6" />
                <Skeleton className="h-[400px] w-full mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-96" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !project) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects
                </Button>
                <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                        Failed to load project details.{' '}
                        <Button variant="link" className="p-0 h-auto" onClick={() => refetch()}>
                            Try again
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const category = PROJECT_CATEGORIES_2026.find(c => c.value === project.category);
    const StatusIcon = statusConfig[project.status as keyof typeof statusConfig]?.icon || Clock;

    const formatCurrency = (amount: number | null) => {
        if (!amount) return 'Not disclosed';
        if (amount >= 1e9) return `KES ${(amount / 1e9).toFixed(2)}B`;
        if (amount >= 1e6) return `KES ${(amount / 1e6).toFixed(1)}M`;
        return `KES ${amount.toLocaleString()}`;
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'TBD';
        return new Date(date).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getLocationDisplay = () => {
        if (project.project_level === 'national') return '🇰🇪 National Project';
        const parts = [];
        if (project.ward) parts.push(`${project.ward} Ward`);
        if (project.constituency) parts.push(`${project.constituency} Constituency`);
        if (project.county) parts.push(`${project.county} County`);
        return parts.join(' · ') || 'Location TBD';
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: project.title,
                text: project.description,
                url: window.location.href
            }).catch(() => { });
        } else {
            copyToClipboard(window.location.href, 'Link copied to clipboard');
        }
    };

    const primaryEntity = project.primary_responsible_type === 'official'
        ? project.primary_official
        : project.primary_institution;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-b from-muted to-background">
                <div className="container mx-auto px-4 py-6 max-w-6xl">
                    <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Projects
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Media Hero */}
                        <div>
                            <MediaCarousel
                                media={project.media_urls || []}
                                alt={project.title}
                                height="h-80"
                                aspectRatio="16/9"
                                onImageClick={() => setMediaGalleryOpen(true)}
                            />
                        </div>

                        {/* Project Info Overlay */}
                        <div className="space-y-4">
                            {/* Category & Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {category && (
                                    <Badge variant="outline" className="gap-1 text-base px-3 py-1">
                                        {category.icon} {category.label}
                                    </Badge>
                                )}
                                <Badge className={cn(statusConfig[project.status as keyof typeof statusConfig]?.color, "text-white gap-1")}>
                                    <StatusIcon className="w-4 h-4" />
                                    {statusConfig[project.status as keyof typeof statusConfig]?.label}
                                </Badge>
                                {project.is_verified && (
                                    <Badge variant="default" className="bg-green-600 gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        Community Verified
                                    </Badge>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold">{project.title}</h1>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-5 h-5" />
                                <span className="text-lg">{getLocationDisplay()}</span>
                            </div>

                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Progress</span>
                                    <span className="font-bold text-lg">{project.progress_percentage}%</span>
                                </div>
                                <Progress value={project.progress_percentage} className="h-3" />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <Bookmark className="w-4 h-4" />
                                    Save
                                </Button>
                            </div>

                            {/* Engagement Bar */}
                            <EngagementBar
                                viewsCount={project.views_count}
                                commentsCount={project.comments_count}
                                verificationsCount={project.verifications_count}
                                isVerified={project.is_verified}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {project.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <CardTitle>Project Timeline & Updates</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" className="gap-1.5" onClick={() => setPostUpdateOpen(true)}>
                                            <Plus className="w-4 h-4" />
                                            Post Update
                                        </Button>
                                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setReportIssueOpen(true)}>
                                            <AlertCircle className="w-4 h-4" />
                                            Report Issue
                                        </Button>
                                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setVerifyOpen(true)}>
                                            <CheckSquare className="w-4 h-4" />
                                            Verify
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ProjectTimeline
                                    updates={project.recent_updates || []}
                                    projectCreatedAt={project.created_at}
                                    projectTitle={project.title}
                                    projectDescription={project.description}
                                    projectLocation={[project.ward, project.constituency, project.county].filter(Boolean).join(', ')}
                                    projectBudget={project.budget_allocated}
                                    projectCategory={project.category}
                                    projectProgress={project.progress_percentage || 0}
                                    onMediaClick={(urls) => setMediaGalleryOpen(true)}
                                />
                            </CardContent>
                        </Card>


                        {project.documents_urls && project.documents_urls.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Project Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {project.documents_urls.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                                    <span className="font-medium">Document {idx + 1}</span>
                                                </div>
                                                <Download className="w-4 h-4 text-muted-foreground" />
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Accountability Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Accountability
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <EntityList
                                    primaryType={project.primary_responsible_type}
                                    primaryEntity={primaryEntity}
                                    collaboratingOfficials={project.collaborating_officials}
                                    collaboratingInstitutions={project.collaborating_institutions}
                                    maxCollaborators={10}
                                    showLabel={true}
                                />

                                <Separator />
                            </CardContent>
                        </Card>

                        {/* Project Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-sm font-medium">Budget</span>
                                    </div>
                                    <p className="text-lg font-bold">{formatCurrency(project.budget_allocated)}</p>
                                    {project.funding_source && (
                                        <p className="text-sm text-muted-foreground">
                                            Source: {project.funding_source}
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                <div>
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Timeline</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Start:</span> {formatDate(project.planned_start_date)}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Completion:</span> {formatDate(project.planned_completion_date)}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium mb-2">Engagement</p>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>{project.views_count.toLocaleString()} views</p>
                                        <p>{project.comments_count} comments</p>
                                        <p>{project.verifications_count} verifications</p>
                                        <p>{project.updates_count} updates</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                    </div>
                </div>
            </div>

            {/* Post Update Modal */}
            <Dialog open={postUpdateOpen} onOpenChange={setPostUpdateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Post Project Update</DialogTitle>
                        <DialogDescription>
                            Share progress updates, milestones, or completion status with the community.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Update Type</label>
                            <select
                                className="w-full mt-1 p-2 border rounded-md"
                                value={updateForm.update_type}
                                onChange={(e) => setUpdateForm({ ...updateForm, update_type: e.target.value })}
                            >
                                <option value="progress">Progress Update</option>
                                <option value="milestone">Milestone Achieved</option>
                                <option value="delay">Delay Reported</option>
                                <option value="completion">Project Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <input
                                type="text"
                                className="w-full mt-1 p-2 border rounded-md"
                                placeholder="e.g., Road construction 50% complete"
                                value={updateForm.title}
                                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description *</label>
                            <textarea
                                className="w-full mt-1 p-2 border rounded-md h-32"
                                placeholder="Provide details about this update..."
                                value={updateForm.description}
                                onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setPostUpdateOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePostUpdate}
                                disabled={submitting || !updateForm.title || !updateForm.description}
                            >
                                {submitting ? 'Posting...' : 'Post Update'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Report Issue Modal */}
            <Dialog open={reportIssueOpen} onOpenChange={setReportIssueOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Report an Issue</DialogTitle>
                        <DialogDescription>
                            Report delays, quality concerns, or safety hazards for community visibility.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Alert>
                            <AlertDescription>
                                Report issues such as delays, quality concerns, or safety hazards. Your report will be visible to the community.
                            </AlertDescription>
                        </Alert>
                        <div>
                            <label className="text-sm font-medium">Issue Title *</label>
                            <input
                                type="text"
                                className="w-full mt-1 p-2 border rounded-md"
                                placeholder="e.g., Construction halted due to heavy rains"
                                value={issueForm.title}
                                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description *</label>
                            <textarea
                                className="w-full mt-1 p-2 border rounded-md h-32"
                                placeholder="Describe the issue in detail..."
                                value={issueForm.description}
                                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setReportIssueOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReportIssue}
                                disabled={submitting || !issueForm.title || !issueForm.description}
                                variant="destructive"
                            >
                                {submitting ? 'Reporting...' : 'Report Issue'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Verify Project Modal */}
            <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Verify Project</DialogTitle>
                        <DialogDescription>
                            Confirm project progress to build community trust and accountability.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Help build trust by verifying project progress. Your verification will be recorded on the timeline.
                            </AlertDescription>
                        </Alert>
                        <div>
                            <label className="text-sm font-medium">Verification Notes (Optional)</label>
                            <textarea
                                className="w-full mt-1 p-2 border rounded-md h-24"
                                placeholder="Add any additional observations or comments about your verification..."
                                value={verifyForm.description}
                                onChange={(e) => setVerifyForm({ ...verifyForm, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setVerifyOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleVerify}
                                disabled={submitting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? 'Verifying...' : 'Verify Project'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ProjectDetail;

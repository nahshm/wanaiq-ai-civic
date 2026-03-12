import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    Shield,
    CheckCircle,
    Clock,
    MapPin,
    Calendar,
    MessageSquare,
    FileText,
    Users,
    TrendingUp,
    ExternalLink,
    Mail,
    Phone,
    Building,
    Building2,
    Award,
    Target,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Send,
    Loader2,
    ArrowUp,
    Pencil,
    Trash2,
    Sparkles,
    BarChart3,
    Plus,
    History,
    Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { AddPromiseModal } from '@/components/governance/AddPromiseModal';
import { UpdatePromiseModal } from '@/components/governance/UpdatePromiseModal';
import { AnswerQuestionModal } from '@/components/governance/AnswerQuestionModal';
import { AddProjectModal } from '@/components/governance/AddProjectModal';
import { UpdateProjectModal } from '@/components/governance/UpdateProjectModal';
import { ActivityTimeline } from '@/components/governance/ActivityTimeline';
import { OfficeHistoryTimeline } from '@/components/governance/OfficeHistoryTimeline';
import {
    getCategoryInfo,
    getStatusColor,
    formatRelativeDate,
    getProjectCategoryInfo,
    getProjectStatusColor,
    formatBudget,
} from '@/components/governance/officeConstants';

// UUID validation regex for security
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface OfficeHolderData {
    id: string;
    user_id: string;
    position_id: string;
    term_start: string;
    term_end: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    created_at: string;
    profile?: {
        id: string;
        username: string;
        display_name: string;
        avatar_url?: string;
        bio?: string;
    };
    position?: {
        id: string;
        title: string;
        governance_level: string;
        country_code: string;
        jurisdiction_name?: string;
    };
}

interface Promise {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    deadline: string;
    created_at: string;
}

interface Question {
    id: string;
    question: string;
    answer?: string;
    asked_by: string;
    asked_at: string;
    answered_at?: string;
    upvotes?: number;
}

export default function OfficePage() {
    const location = useLocation();
    const { user } = useAuth();

    // Securely extract and validate ID from pathname
    const id = useMemo(() => {
        const rawId = location.pathname.split('/')[2];
        // Validate UUID format to prevent injection attempts
        return rawId && UUID_REGEX.test(rawId) ? rawId : null;
    }, [location.pathname]);

    const [officeHolder, setOfficeHolder] = useState<OfficeHolderData | null>(null);
    const [promises, setPromises] = useState<Promise[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Projects state
    const [projects, setProjects] = useState<any[]>([]);

    // Constituent check state
    const [isConstituent, setIsConstituent] = useState<boolean | null>(null);

    // Activity state
    const [activities, setActivities] = useState<any[]>([]);

    // History state
    const [positionHolders, setPositionHolders] = useState<any[]>([]);

    // Modal states
    const [showAddPromise, setShowAddPromise] = useState(false);
    const [updatePromise, setUpdatePromise] = useState<Promise | null>(null);
    const [answerQuestion, setAnswerQuestion] = useState<Question | null>(null);
    const [showAddProject, setShowAddProject] = useState(false);
    const [updateProject, setUpdateProject] = useState<any | null>(null);
    const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
    const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

    const isOwner = user?.id === officeHolder?.user_id;

    const fetchOfficeData = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        try {
            const { data: holderData, error: holderError } = await supabase
                .from('office_holders')
                .select(`
                    *,
                    profiles!office_holders_user_id_fkey(id, username, display_name, avatar_url, bio),
                    government_positions(id, title, governance_level, country_code, jurisdiction_name)
                `)
                .eq('id', id)
                .single();

            if (holderError) {
                if (holderError.code === 'PGRST116') {
                    setOfficeHolder(null);
                } else {
                    throw holderError;
                }
                return;
            }

            const transformed = holderData ? {
                ...holderData,
                created_at: holderData.claimed_at,
                profile: holderData.profiles,
                position: holderData.government_positions
            } : null;

            setOfficeHolder(transformed as any);

            // Fetch promises
            try {
                const { data: promisesData } = await supabase
                    .from('office_promises')
                    .select('*')
                    .eq('office_holder_id', id)
                    .order('created_at', { ascending: false });
                setPromises((promisesData || []) as Promise[]);
            } catch (error) {
                console.log('Promises table not available yet:', error);
                setPromises([]);
            }

            // Fetch questions
            try {
                const { data: questionsData } = await supabase
                    .from('office_questions')
                    .select(`
                        *,
                        profiles!office_questions_asked_by_fkey(username, display_name, avatar_url)
                    `)
                    .eq('office_holder_id', id)
                    .order('upvotes', { ascending: false })
                    .order('asked_at', { ascending: false });

                const transformedQ = questionsData?.map(q => ({
                    id: q.id,
                    question: q.question,
                    answer: q.answer,
                    asked_by: q.profiles?.username || 'Anonymous',
                    asked_at: q.asked_at,
                    answered_at: q.answered_at
                })) || [];
                setQuestions(transformedQ);
            } catch (error) {
                console.log('Questions table not available yet:', error);
                setQuestions([]);
            }

            // Fetch linked projects (by the office holder's user account)
            try {
                const { data: projectsData } = await supabase
                    .from('government_projects')
                    .select('*')
                    .eq('created_by', holderData.user_id)
                    .order('created_at', { ascending: false });
                setProjects(projectsData || []);
            } catch (error) {
                console.log('Projects fetch error:', error);
                setProjects([]);
            }

            // Fetch activity log
            try {
                const { data: activityData } = await supabase
                    .from('office_activity_log' as any)
                    .select('*')
                    .eq('office_holder_id', id)
                    .order('created_at', { ascending: false })
                    .limit(50);
                setActivities(activityData || []);
            } catch (error) {
                console.log('Activity log not available yet:', error);
                setActivities([]);
            }

            // Fetch all holders for this position (for history tab)
            if (holderData?.position_id) {
                try {
                    const { data: holdersData } = await supabase
                        .from('office_holders')
                        .select(`
                            id, is_active, is_historical, term_start, term_end,
                            profiles!office_holders_user_id_fkey(username, display_name, avatar_url)
                        `)
                        .eq('position_id', holderData.position_id)
                        .order('term_start', { ascending: false });
                    setPositionHolders(holdersData || []);
                } catch (error) {
                    console.log('History fetch not available:', error);
                    setPositionHolders([]);
                }
            }
        } catch (error) {
            console.error('Error fetching office data:', error);
            toast.error('Failed to load office page. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOfficeData();
    }, [fetchOfficeData]);

    // Check if current user is a constituent
    useEffect(() => {
        const checkConstituent = async () => {
            if (!user || !officeHolder?.position) {
                setIsConstituent(null);
                return;
            }

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('county, constituency, ward')
                    .eq('id', user.id)
                    .single();

                if (!profile) {
                    setIsConstituent(false);
                    return;
                }

                const jurisdictionName = officeHolder.position.jurisdiction_name || '';
                const govLevel = officeHolder.position.governance_level || '';

                // Match based on governance level
                let match = false;
                if (govLevel === 'county' && profile.county) {
                    match = profile.county.toLowerCase() === jurisdictionName.toLowerCase();
                } else if (govLevel === 'constituency' && profile.constituency) {
                    match = profile.constituency.toLowerCase() === jurisdictionName.toLowerCase();
                } else if (govLevel === 'ward' && profile.ward) {
                    match = profile.ward.toLowerCase() === jurisdictionName.toLowerCase();
                } else if (govLevel === 'national') {
                    match = true; // All citizens are constituents of national officials
                }

                setIsConstituent(match);
            } catch (error) {
                console.log('Could not check constituent status:', error);
                setIsConstituent(null);
            }
        };

        checkConstituent();
    }, [user, officeHolder]);

    // Submit a new question
    const handleSubmitQuestion = async () => {
        if (!user || !id || !newQuestion.trim()) return;

        setIsSubmittingQuestion(true);
        try {
            const { error } = await supabase
                .from('office_questions')
                .insert({
                    office_holder_id: id,
                    question: newQuestion.trim(),
                    asked_by: user.id,
                });

            if (error) throw error;

            toast.success('Question submitted! The official will be notified.');
            setNewQuestion('');
            fetchOfficeData(); // Refresh
        } catch (error: any) {
            console.error('Error submitting question:', error);
            toast.error(error.message || 'Failed to submit question');
        } finally {
            setIsSubmittingQuestion(false);
        }
    };

    // Upvote a question
    const handleUpvoteQuestion = async (questionId: string) => {
        if (!user) {
            toast.error('Please sign in to upvote');
            return;
        }

        setUpvotingIds(prev => new Set(prev).add(questionId));
        try {
            // Increment upvotes (simple counter for now)
            const { error } = await (supabase.rpc as any)('increment_question_upvotes', {
                question_id: questionId,
            });

            // Fallback: direct update if RPC doesn't exist
            if (error) {
                await supabase
                    .from('office_questions')
                    .update({ upvotes: questions.find(q => q.id === questionId)?.upvotes ? (questions.find(q => q.id === questionId)?.upvotes || 0) + 1 : 1 })
                    .eq('id', questionId);
            }

            fetchOfficeData();
        } catch (error) {
            console.error('Error upvoting:', error);
        } finally {
            setUpvotingIds(prev => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
            });
        }
    };

    // Delete a question (for the asker)
    const handleDeleteQuestion = async (questionId: string) => {
        try {
            const { error } = await supabase
                .from('office_questions')
                .delete()
                .eq('id', questionId);

            if (error) throw error;
            toast.success('Question deleted');
            fetchOfficeData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete question');
        }
    };

    const calculateDaysRemaining = () => {
        if (!officeHolder?.term_end) return null;
        const end = new Date(officeHolder.term_end);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysRemaining = calculateDaysRemaining();


    if (loading) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-48 bg-muted rounded-lg" />
                    <div className="h-12 bg-muted rounded w-1/3" />
                    <div className="h-64 bg-muted rounded-lg" />
                </div>
            </div>
        );
    }

    // Show error for invalid UUID format
    if (!id) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Invalid Office ID</h2>
                        <p className="text-muted-foreground mb-4">The office page URL is not valid.</p>
                        <Button asChild>
                            <Link to="/officials">Browse Officials</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!officeHolder) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Office Not Found</h2>
                        <p className="text-muted-foreground mb-4">This office page doesn't exist or has been removed.</p>
                        <Button asChild>
                            <Link to="/officials">Browse Officials</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const completedPromises = promises.filter(p => p.status === 'completed').length;
    const promiseCompletionRate = promises.length > 0
        ? Math.round((completedPromises / promises.length) * 100)
        : 0;

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            {/* Header Section */}
            <Card className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-civic-green/20 to-civic-blue/20 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarImage src={officeHolder.profile?.avatar_url} />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {officeHolder.profile?.display_name?.[0] || 'O'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold">
                                    {officeHolder.profile?.display_name || 'Unknown Official'}
                                </h1>
                                {officeHolder.verification_status === 'verified' && (
                                    <Badge className="bg-civic-green">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                )}
                            </div>

                            <p className="text-lg text-muted-foreground mb-2">
                                {officeHolder.position?.title || 'Government Official'}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {officeHolder.position?.jurisdiction_name && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {officeHolder.position.jurisdiction_name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Term: {new Date(officeHolder.term_start).toLocaleDateString()} - {new Date(officeHolder.term_end).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Term Countdown */}
                        {daysRemaining !== null && daysRemaining > 0 && (
                            <Card className="bg-background/80 backdrop-blur">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-primary">{daysRemaining}</div>
                                    <div className="text-xs text-muted-foreground">days remaining</div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x border-t">
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">{promiseCompletionRate}%</div>
                        <div className="text-xs text-muted-foreground">Promises Kept</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">{questions.filter(q => q.answer).length}/{questions.length}</div>
                        <div className="text-xs text-muted-foreground">Questions Answered</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">{projects.length}</div>
                        <div className="text-xs text-muted-foreground">Projects</div>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold">-</div>
                        <div className="text-xs text-muted-foreground">Citizen Rating</div>
                    </div>
                </div>
            </Card>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="gap-2">
                        <Building className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="promises" className="gap-2">
                        <Target className="h-4 w-4" />
                        Promises ({promises.length})
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Q&A ({questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Projects ({projects.length})
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Activity
                    </TabsTrigger>
                    {positionHolders.length > 1 && (
                        <TabsTrigger value="history" className="gap-2">
                            <Crown className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Bio Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {officeHolder.profile?.bio || 'No biography provided yet.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Contact Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Official email not provided</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Office phone not provided</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">No official website</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Report Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Performance Report Card
                            </CardTitle>
                            <CardDescription>
                                Transparency metrics based on public activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Promise Completion</span>
                                    <span className="font-medium">{promiseCompletionRate}%</span>
                                </div>
                                <Progress value={promiseCompletionRate} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Citizen Response Rate</span>
                                    <span className="font-medium">
                                        {questions.length > 0
                                            ? Math.round((questions.filter(q => q.answer).length / questions.length) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <Progress
                                    value={questions.length > 0
                                        ? (questions.filter(q => q.answer).length / questions.length) * 100
                                        : 0}
                                    className="h-2"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Project Transparency</span>
                                    <span className="font-medium">-</span>
                                </div>
                                <Progress value={0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Promises Tab */}
                <TabsContent value="promises" className="space-y-6">
                    {isOwner && (
                        <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20 overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                                        <Target className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base">Make a Public Promise</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Commit to something and let citizens track your progress
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={() => setShowAddPromise(true)} className="gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Add Promise
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Filter Summary */}
                    {promises.length > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="gap-1">
                                    <BarChart3 className="h-3 w-3" />
                                    {completedPromises}/{promises.length} completed
                                </Badge>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                                        style={{ width: `${promiseCompletionRate}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {promises.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-16 text-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mx-auto mb-4">
                                    <Target className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No Promises Yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {isOwner
                                        ? 'Make your first public commitment and let citizens track your accountability.'
                                        : 'This official hasn\'t made any public commitments yet.'
                                    }
                                </p>
                                {isOwner && (
                                    <Button
                                        onClick={() => setShowAddPromise(true)}
                                        className="mt-6 gap-2"
                                    >
                                        <Target className="h-4 w-4" />
                                        Make Your First Promise
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {promises.map((promise) => {
                                const catInfo = getCategoryInfo(promise.category);
                                const statusColor = getStatusColor(promise.status);

                                return (
                                    <Card key={promise.id} className="group hover:shadow-md transition-shadow duration-200">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <h4 className="font-semibold text-base">{promise.title}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className={`text-xs ${catInfo.color}`}>
                                                            {catInfo.label}
                                                        </Badge>
                                                        <Badge className={`text-xs border ${statusColor}`}>
                                                            {promise.status === 'in_progress' ? 'In Progress' :
                                                                promise.status.charAt(0).toUpperCase() + promise.status.slice(1)}
                                                        </Badge>
                                                        {promise.deadline && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Due {new Date(promise.deadline).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                        onClick={() => setUpdatePromise(promise)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        Update
                                                    </Button>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                {promise.description}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-semibold tabular-nums">{promise.progress}%</span>
                                                </div>
                                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                            promise.status === 'completed' ? 'bg-emerald-500' :
                                                            promise.status === 'failed' ? 'bg-red-400' :
                                                            promise.progress >= 50 ? 'bg-blue-500' :
                                                            'bg-amber-400'
                                                        }`}
                                                        style={{ width: `${promise.progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                                                <span>Created {formatRelativeDate(promise.created_at)}</span>
                                                {promise.status === 'completed' && (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Fulfilled
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Q&A Tab */}
                <TabsContent value="questions" className="space-y-6">
                    {/* Constituent badge */}
                    {user && !isOwner && isConstituent === true && (
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Constituent ✓
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                You can ask questions as a constituent of this office.
                            </span>
                        </div>
                    )}

                    {/* Ask Question Form - Constituent only */}
                    {user && !isOwner && isConstituent === true && (
                        <Card className="border-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Ask a Question
                                </CardTitle>
                                <CardDescription>
                                    Your question will be public. The official can respond publicly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <Textarea
                                        placeholder="What would you like to ask this official?"
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        className="min-h-[80px] pr-12 resize-none"
                                        maxLength={500}
                                    />
                                    <Button
                                        size="sm"
                                        className="absolute bottom-3 right-3 h-8 w-8 p-0"
                                        disabled={!newQuestion.trim() || isSubmittingQuestion}
                                        onClick={handleSubmitQuestion}
                                    >
                                        {isSubmittingQuestion ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground text-right mt-1">
                                    {newQuestion.length}/500
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Non-constituent message */}
                    {user && !isOwner && isConstituent === false && (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="py-6 text-center">
                                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Only constituents can ask questions to this official.
                                    <br />
                                    <span className="text-xs">Update your location in your profile to match this official's jurisdiction.</span>
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {!user && (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="py-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>{' '}
                                    to ask this official a question
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {questions.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-16 text-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mx-auto mb-4">
                                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No Questions Yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    Be the first to ask this official a question!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q) => (
                                <Card key={q.id} className="group">
                                    <CardContent className="p-5">
                                        <div className="flex gap-4">
                                            {/* Upvote Column */}
                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => handleUpvoteQuestion(q.id)}
                                                    disabled={upvotingIds.has(q.id)}
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <span className="text-sm font-semibold tabular-nums">
                                                    {(q as any).upvotes || 0}
                                                </span>
                                            </div>

                                            {/* Question Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm leading-relaxed">{q.question}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        by <span className="font-medium">{q.asked_by}</span>
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatRelativeDate(q.asked_at)}
                                                    </span>
                                                    {!q.answer && (
                                                        <Badge variant="outline" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            Awaiting answer
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Answer */}
                                                {q.answer && (
                                                    <div className="mt-4 pl-4 border-l-2 border-emerald-400 bg-emerald-500/5 rounded-r-lg p-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Official Response
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm leading-relaxed">{q.answer}</p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Answered {formatRelativeDate(q.answered_at!)}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 mt-3">
                                                    {isOwner && !q.answer && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs gap-1"
                                                            onClick={() => setAnswerQuestion(q)}
                                                        >
                                                            <MessageSquare className="h-3 w-3" />
                                                            Answer
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6">
                    {isOwner && (
                        <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20 overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base">Manage Projects</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Link existing projects or create new ones for your office
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={() => setShowAddProject(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Project
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {projects.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-16 text-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mx-auto mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No Projects Yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {isOwner
                                        ? 'Add your first government project to showcase your work.'
                                        : 'No government projects have been linked to this office yet.'}
                                </p>
                                {isOwner && (
                                    <Button
                                        onClick={() => setShowAddProject(true)}
                                        className="mt-6 gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add First Project
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {projects.map((project) => {
                                const catInfo = getProjectCategoryInfo(project.category || '');
                                const statusColor = getProjectStatusColor(project.status || '');
                                return (
                                    <Card key={project.id} className="group hover:shadow-md transition-shadow duration-200">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-base mb-1.5">{project.title}</h4>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {project.category && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {catInfo.label}
                                                            </Badge>
                                                        )}
                                                        {project.status && (
                                                            <Badge className={`text-xs border ${statusColor}`}>
                                                                {project.status.replace('_', ' ')}
                                                            </Badge>
                                                        )}
                                                        {project.priority && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {project.priority}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                        onClick={() => setUpdateProject(project)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        Update
                                                    </Button>
                                                )}
                                            </div>

                                            {project.description && (
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}

                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-semibold tabular-nums">{project.progress_percentage || 0}%</span>
                                                </div>
                                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                            project.status === 'completed' ? 'bg-emerald-500' :
                                                            (project.progress_percentage || 0) >= 50 ? 'bg-blue-500' :
                                                            'bg-amber-400'
                                                        }`}
                                                        style={{ width: `${project.progress_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                                                <div className="flex items-center gap-3">
                                                    {project.budget_allocated && (
                                                        <span>Budget: {formatBudget(project.budget_allocated)}</span>
                                                    )}
                                                    {project.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {project.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {project.status === 'completed' && (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-6">
                    <ActivityTimeline
                        entries={activities}
                        isLoading={false}
                    />
                </TabsContent>

                {/* History Tab */}
                {positionHolders.length > 1 && (
                    <TabsContent value="history" className="space-y-6">
                        <OfficeHistoryTimeline
                            holders={positionHolders}
                            currentHolderId={id!}
                            positionTitle={officeHolder?.position?.title}
                        />
                    </TabsContent>
                )}
            </Tabs>

            {/* Modals */}
            {id && (
                <>
                    <AddPromiseModal
                        isOpen={showAddPromise}
                        onClose={() => setShowAddPromise(false)}
                        officeHolderId={id}
                        userId={user?.id || ''}
                        onPromiseAdded={fetchOfficeData}
                    />

                    {updatePromise && (
                        <UpdatePromiseModal
                            isOpen={!!updatePromise}
                            onClose={() => setUpdatePromise(null)}
                            promise={updatePromise}
                            officeHolderId={id}
                            userId={user?.id || ''}
                            onPromiseUpdated={fetchOfficeData}
                        />
                    )}

                    {answerQuestion && user && (
                        <AnswerQuestionModal
                            isOpen={!!answerQuestion}
                            onClose={() => setAnswerQuestion(null)}
                            question={answerQuestion}
                            userId={user.id}
                            officeHolderId={id}
                            onAnswered={fetchOfficeData}
                        />
                    )}

                    {user && (
                        <AddProjectModal
                            isOpen={showAddProject}
                            onClose={() => setShowAddProject(false)}
                            officeHolderId={id}
                            userId={user.id}
                            position={officeHolder?.position || null}
                            officeHolderLocation={{
                                county: officeHolder?.position?.governance_level === 'county' ? officeHolder?.position?.jurisdiction_name : undefined,
                                constituency: officeHolder?.position?.governance_level === 'constituency' ? officeHolder?.position?.jurisdiction_name : undefined,
                                ward: officeHolder?.position?.governance_level === 'ward' ? officeHolder?.position?.jurisdiction_name : undefined,
                            }}
                            onProjectAdded={fetchOfficeData}
                        />
                    )}

                    {updateProject && user && (
                        <UpdateProjectModal
                            isOpen={!!updateProject}
                            onClose={() => setUpdateProject(null)}
                            project={updateProject}
                            officeHolderId={id}
                            userId={user.id}
                            onProjectUpdated={fetchOfficeData}
                        />
                    )}
                </>
            )}
        </div>
    );
}

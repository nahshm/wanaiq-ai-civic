import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import {
    ArrowLeft, MapPin, Users, Target, TrendingUp, Calendar,
    DollarSign, Phone, Mail, Globe, Share2, AlertTriangle,
    CheckCircle, Clock, XCircle, ExternalLink
} from 'lucide-react';
import { Official, DevelopmentPromise, OfficialWithPromises } from '@/types';

const OfficialDetail = () => {
    const { officialId } = useParams<{ officialId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [official, setOfficial] = useState<OfficialWithPromises | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (officialId) {
            fetchOfficialData();
        }
    }, [officialId]);

    const fetchOfficialData = async () => {
        try {
            setLoading(true);

            // Fetch official data
            const { data: officialData, error: officialError } = await supabase
                .from('officials')
                .select('*')
                .eq('id', officialId)
                .single();

            if (officialError) throw officialError;

            // Fetch promises for this official
            const { data: promisesData, error: promisesError } = await supabase
                .from('development_promises')
                .select('*')
                .eq('official_id', officialId)
                .order('created_at', { ascending: false });

            if (promisesError) throw promisesError;

            const promises = promisesData || [];
            const completedPromises = promises.filter(p => p.status === 'completed').length;

            setOfficial({
                ...officialData,
                promises,
                completedPromises,
                totalPromises: promises.length
            });
        } catch (error) {
            console.error('Error fetching official data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load official data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getCompletionPercentage = (completed: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    };

    const getPerformanceRating = (percentage: number) => {
        if (percentage >= 75) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (percentage >= 50) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        if (percentage >= 25) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'ongoing': return <Clock className="w-4 h-4 text-blue-600" />;
            case 'not_started': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            completed: { label: 'Completed', className: 'bg-green-500 text-white' },
            ongoing: { label: 'Ongoing', className: 'bg-blue-500 text-white' },
            not_started: { label: 'Not Started', className: 'bg-yellow-500 text-white' },
            cancelled: { label: 'Cancelled', className: 'bg-red-500 text-white' }
        };
        const variant = variants[status] || variants.not_started;
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatLocation = (official: Official) => {
        if (official.level === 'executive') return 'Kenya';
        if (official.constituency) return `${official.constituency}, ${official.county}`;
        if (official.county) return official.county;
        return 'Kenya';
    };

    const handleShare = () => {
        const url = `${window.location.origin}/g/${officialId}`;
        copyToClipboard(url, 'Official profile link copied to clipboard');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading official data...</div>
                </div>
            </div>
        );
    }

    if (!official) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Official Not Found</h3>
                        <p className="text-muted-foreground mb-4">
                            The official you're looking for doesn't exist or has been removed.
                        </p>
                        <Button onClick={() => navigate('/officials')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Officials
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const completionPercentage = getCompletionPercentage(official.completedPromises, official.totalPromises);
    const performanceRating = getPerformanceRating(completionPercentage);
    const promisesByStatus = {
        completed: official.promises.filter(p => p.status === 'completed'),
        ongoing: official.promises.filter(p => p.status === 'ongoing'),
        not_started: official.promises.filter(p => p.status === 'not_started'),
        cancelled: official.promises.filter(p => p.status === 'cancelled')
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/officials')}
                className="mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Officials
            </Button>

            {/* Official Header Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <Avatar className="w-32 h-32">
                            <AvatarImage src={official.photo_url} />
                            <AvatarFallback className="text-3xl">
                                {getInitials(official.name)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Official Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{official.name}</h1>
                                    <p className="text-xl text-muted-foreground mb-3">{official.position}</p>

                                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {formatLocation(official)}
                                        </span>
                                        {official.party && (
                                            <Badge variant="secondary">{official.party}</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Share Button */}
                                <Button variant="outline" onClick={handleShare}>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Profile
                                </Button>
                            </div>

                            <Separator className="my-4" />

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Promises Completed</div>
                                    <div className="text-2xl font-bold">
                                        {official.completedPromises} / {official.totalPromises}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                                    <div className="text-2xl font-bold">{completionPercentage}%</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Performance Rating</div>
                                    <Badge className={`${performanceRating.bgColor} ${performanceRating.color} text-sm px-3 py-1`}>
                                        {performanceRating.label}
                                    </Badge>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Overall Promise Fulfillment</span>
                                    <span className="font-semibold">{completionPercentage}%</span>
                                </div>
                                <Progress value={completionPercentage} className="h-3" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="promises">
                        Promises ({official.totalPromises})
                    </TabsTrigger>
                    <TabsTrigger value="contact">Contact & Info</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Promise Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Promise Statistics</CardTitle>
                            <CardDescription>Breakdown of development promises by status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-900">Completed</span>
                                    </div>
                                    <div className="text-3xl font-bold text-green-600">
                                        {promisesByStatus.completed.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Ongoing</span>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {promisesByStatus.ongoing.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        <span className="text-sm font-medium text-yellow-900">Not Started</span>
                                    </div>
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {promisesByStatus.not_started.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-sm font-medium text-red-900">Cancelled</span>
                                    </div>
                                    <div className="text-3xl font-bold text-red-600">
                                        {promisesByStatus.cancelled.length}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Promises */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Promises</CardTitle>
                            <CardDescription>Latest development commitments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {official.promises.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No promises recorded for this official yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {official.promises.slice(0, 5).map((promise) => (
                                        <div key={promise.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-lg">{promise.title}</h4>
                                                {getStatusBadge(promise.status)}
                                            </div>
                                            {promise.description && (
                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                    {promise.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                {promise.location && (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <MapPin className="w-4 h-4" />
                                                        {promise.location}
                                                    </span>
                                                )}
                                                {promise.budget_allocated && (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <DollarSign className="w-4 h-4" />
                                                        {formatCurrency(promise.budget_allocated)}
                                                    </span>
                                                )}
                                                {promise.category && (
                                                    <Badge variant="outline">{promise.category}</Badge>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>Progress</span>
                                                    <span>{promise.progress_percentage}%</span>
                                                </div>
                                                <Progress value={promise.progress_percentage} className="h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Promises Tab */}
                <TabsContent value="promises" className="space-y-6">
                    {Object.entries(promisesByStatus).map(([status, promises]) => (
                        promises.length > 0 && (
                            <Card key={status}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} Promises ({promises.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {promises.map((promise) => (
                                            <div key={promise.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-lg">{promise.title}</h4>
                                                    {getStatusBadge(promise.status)}
                                                </div>
                                                {promise.description && (
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        {promise.description}
                                                    </p>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    {promise.location && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                                            <span>{promise.location}</span>
                                                        </div>
                                                    )}
                                                    {promise.beneficiaries_count && (
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                            <span>{promise.beneficiaries_count.toLocaleString()} beneficiaries</span>
                                                        </div>
                                                    )}
                                                    {promise.budget_allocated && (
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                            <span>Budget: {formatCurrency(promise.budget_allocated)}</span>
                                                        </div>
                                                    )}
                                                    {promise.category && (
                                                        <div>
                                                            <Badge variant="outline">{promise.category}</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span>Progress</span>
                                                        <span className="font-semibold">{promise.progress_percentage}%</span>
                                                    </div>
                                                    <Progress value={promise.progress_percentage} className="h-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    ))}
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>How to reach this official</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {official.contact_info?.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Phone</div>
                                            <div className="font-medium">{official.contact_info.phone}</div>
                                        </div>
                                    </div>
                                )}
                                {official.contact_info?.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Email</div>
                                            <div className="font-medium">{official.contact_info.email}</div>
                                        </div>
                                    </div>
                                )}
                                {official.contact_info?.website && (
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Website</div>
                                            <a
                                                href={official.contact_info.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-primary hover:underline flex items-center gap-1"
                                            >
                                                {official.contact_info.website}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {!official.contact_info && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No contact information available for this official.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OfficialDetail;

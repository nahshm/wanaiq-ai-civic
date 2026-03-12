import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingDown, AlertTriangle, Trophy, Clock,
    MapPin, Target, FolderKanban, Users, TrendingUp,
    XCircle, DollarSign
} from 'lucide-react';

interface OfficialWithStats {
    id: string;
    name: string;
    position: string;
    county?: string;
    constituency?: string;
    party?: string;
    photo_url?: string;
    totalPromises: number;
    completedPromises: number;
    completionRate: number;
}

interface BrokenPromise {
    id: string;
    title: string;
    description?: string;
    status: string;
    official: {
        id: string;
        name: string;
        position: string;
    };
    created_at: string;
}

interface DelayedProject {
    id: string;
    title: string;
    description?: string;
    status: string;
    county?: string;
    progress_percentage: number;
    planned_completion_date?: string;
    budget_allocated?: number;
}

const DiscoveryDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [myOfficials, setMyOfficials] = useState<OfficialWithStats[]>([]);
    const [brokenPromises, setBrokenPromises] = useState<BrokenPromise[]>([]);
    const [delayedProjects, setDelayedProjects] = useState<DelayedProject[]>([]);
    const [topPerformers, setTopPerformers] = useState<OfficialWithStats[]>([]);
    const [bottomPerformers, setBottomPerformers] = useState<OfficialWithStats[]>([]);

    useEffect(() => {
        fetchDiscoveryData();
    }, []);

    const fetchDiscoveryData = async () => {
        try {
            setLoading(true);

            // Fetch broken promises (cancelled or long-delayed)
            const { data: promisesData } = await supabase
                .from('development_promises')
                .select(`
          id, title, description, status, created_at,
          official:officials(id, name, position)
        `)
                .in('status', ['cancelled', 'not_started'])
                .order('created_at', { ascending: false })
                .limit(10);

            setBrokenPromises(promisesData || []);

            // Fetch delayed projects
            const { data: projectsData } = await supabase
                .from('government_projects')
                .select('id, title, description, status, county, progress_percentage, planned_completion_date, budget_allocated')
                .eq('status', 'delayed')
                .order('planned_completion_date', { ascending: true })
                .limit(10);

            setDelayedProjects(projectsData || []);

            // Fetch all officials with promise stats
            const { data: officialsData } = await supabase
                .from('officials')
                .select(`
          id, name, position, county, constituency, party, photo_url
        `);

            const { data: allPromises } = await supabase
                .from('development_promises')
                .select('id, status, official_id');

            // Calculate stats for each official
            const officialsWithStats: OfficialWithStats[] = (officialsData || []).map(official => {
                const promises = (allPromises || []).filter(p => p.official_id === official.id);
                const completed = promises.filter(p => p.status === 'completed').length;
                const total = promises.length;
                const rate = total > 0 ? (completed / total) * 100 : 0;

                return {
                    ...official,
                    totalPromises: total,
                    completedPromises: completed,
                    completionRate: rate
                };
            });

            // Filter officials with promises
            const officialsWithPromises = officialsWithStats.filter(o => o.totalPromises > 0);

            // Top performers (high completion rate, minimum 3 promises)
            const top = officialsWithPromises
                .filter(o => o.totalPromises >= 3)
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 5);
            setTopPerformers(top);

            // Bottom performers (low completion rate, minimum 3 promises)
            const bottom = officialsWithPromises
                .filter(o => o.totalPromises >= 3)
                .sort((a, b) => a.completionRate - b.completionRate)
                .slice(0, 5);
            setBottomPerformers(bottom);

            // My Officials (for now, show all - will be location-based later)
            setMyOfficials(officialsWithPromises.slice(0, 6));

        } catch (error) {
            console.error('Error fetching discovery data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading discovery feed...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Discover Civic Accountability</h1>
                <p className="text-muted-foreground">
                    Find broken promises, delayed projects, and hold leaders accountable
                </p>
            </div>

            <Tabs defaultValue="broken-promises" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <TabsTrigger value="broken-promises">
                        <XCircle className="w-4 h-4 mr-2" />
                        Broken Promises
                    </TabsTrigger>
                    <TabsTrigger value="delayed-projects">
                        <Clock className="w-4 h-4 mr-2" />
                        Delayed Projects
                    </TabsTrigger>
                    <TabsTrigger value="top-performers">
                        <Trophy className="w-4 h-4 mr-2" />
                        Top Performers
                    </TabsTrigger>
                    <TabsTrigger value="bottom-performers">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Poor Performance
                    </TabsTrigger>
                    <TabsTrigger value="my-officials">
                        <Users className="w-4 h-4 mr-2" />
                        My Officials
                    </TabsTrigger>
                </TabsList>


                {/* Broken Promises Tab */}
                <TabsContent value="broken-promises" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                Broken Promises
                            </CardTitle>
                            <CardDescription>
                                Promises that have been cancelled or remain unfulfilled
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {brokenPromises.length > 0 ? (
                                <div className="space-y-4">
                                    {brokenPromises.map((promise) => (
                                        <Card key={promise.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/pr/${promise.id}`)}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold mb-2">{promise.title}</h3>
                                                        {promise.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                                {promise.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-muted-foreground">
                                                                by {promise.official.name} - {promise.official.position}
                                                            </span>
                                                            <Badge variant="destructive">
                                                                {promise.status === 'cancelled' ? 'Cancelled' : 'Not Started'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <XCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>No broken promises found. Great news!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Delayed Projects Tab */}
                <TabsContent value="delayed-projects" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                Delayed Projects
                            </CardTitle>
                            <CardDescription>
                                Government projects behind schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {delayedProjects.length > 0 ? (
                                <div className="space-y-4">
                                    {delayedProjects.map((project) => (
                                        <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/p/${project.id}`)}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold mb-2">{project.title}</h3>
                                                        {project.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                                {project.description}
                                                            </p>
                                                        )}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                            {project.county && (
                                                                <div className="text-sm">
                                                                    <span className="text-muted-foreground">Location:</span>
                                                                    <div className="font-medium">{project.county}</div>
                                                                </div>
                                                            )}
                                                            <div className="text-sm">
                                                                <span className="text-muted-foreground">Progress:</span>
                                                                <div className="font-medium">{project.progress_percentage}%</div>
                                                            </div>
                                                            {project.planned_completion_date && (
                                                                <div className="text-sm">
                                                                    <span className="text-muted-foreground">Due:</span>
                                                                    <div className="font-medium">{formatDate(project.planned_completion_date)}</div>
                                                                </div>
                                                            )}
                                                            {project.budget_allocated && (
                                                                <div className="text-sm">
                                                                    <span className="text-muted-foreground">Budget:</span>
                                                                    <div className="font-medium">{formatCurrency(project.budget_allocated)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Progress value={project.progress_percentage} className="h-2" />
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        View Project
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>No delayed projects found. All on track!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Performers Tab */}
                <TabsContent value="top-performers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-600" />
                                Top Performing Officials
                            </CardTitle>
                            <CardDescription>
                                Officials with the highest promise completion rates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topPerformers.length > 0 ? (
                                <div className="space-y-4">
                                    {topPerformers.map((official, index) => (
                                        <Card key={official.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/g/${official.id}`)}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-3xl font-bold text-muted-foreground">
                                                        #{index + 1}
                                                    </div>
                                                    <Avatar className="w-16 h-16">
                                                        <AvatarImage src={official.photo_url} />
                                                        <AvatarFallback>{getInitials(official.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{official.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{official.position}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {official.constituency || official.county}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-3xl font-bold text-green-600">
                                                            {Math.round(official.completionRate)}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {official.completedPromises}/{official.totalPromises} completed
                                                        </div>
                                                        <Badge className="mt-2 bg-green-500">
                                                            <TrendingUp className="w-3 h-3 mr-1" />
                                                            Excellent
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Not enough data to rank officials yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bottom Performers Tab */}
                <TabsContent value="bottom-performers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                Poor Performing Officials
                            </CardTitle>
                            <CardDescription>
                                Officials with the lowest promise completion rates - hold them accountable!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bottomPerformers.length > 0 ? (
                                <div className="space-y-4">
                                    {bottomPerformers.map((official, index) => (
                                        <Card key={official.id} className="hover:shadow-md transition-shadow cursor-pointer border-red-200"
                                            onClick={() => navigate(`/g/${official.id}`)}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-3xl font-bold text-red-600">
                                                        #{index + 1}
                                                    </div>
                                                    <Avatar className="w-16 h-16">
                                                        <AvatarImage src={official.photo_url} />
                                                        <AvatarFallback>{getInitials(official.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{official.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{official.position}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {official.constituency || official.county}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-3xl font-bold text-red-600">
                                                            {Math.round(official.completionRate)}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {official.completedPromises}/{official.totalPromises} completed
                                                        </div>
                                                        <Badge variant="destructive" className="mt-2">
                                                            <TrendingDown className="w-3 h-3 mr-1" />
                                                            Poor
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <TrendingDown className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Not enough data to identify poor performers yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* My Officials Tab */}
                <TabsContent value="my-officials" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                My Officials
                            </CardTitle>
                            <CardDescription>
                                Track your representatives and their performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myOfficials.map((official) => (
                                    <Card key={official.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/g/${official.id}`)}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarImage src={official.photo_url} />
                                                    <AvatarFallback>{getInitials(official.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{official.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{official.position}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {official.constituency || official.county}
                                                    </p>
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span>Completion Rate</span>
                                                            <span className="font-semibold">{Math.round(official.completionRate)}%</span>
                                                        </div>
                                                        <Progress value={official.completionRate} className="h-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DiscoveryDashboard;

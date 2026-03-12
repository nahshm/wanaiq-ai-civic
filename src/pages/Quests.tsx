import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Quest, UserQuest } from '@/types/gamification';
import { Target, TrendingUp, Users, BookOpen, FileText, CheckCircle, Clock, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuestEvidenceDialog } from '@/components/quests/QuestEvidenceDialog';

const categoryIcons = {
    reporting: <FileText className="w-5 h-5" />,
    attendance: <Users className="w-5 h-5" />,
    engagement: <TrendingUp className="w-5 h-5" />,
    content: <FileText className="w-5 h-5" />,
    learning: <BookOpen className="w-5 h-5" />
};

const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500'
};

const Quests = () => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [selectedQuest, setSelectedQuest] = useState<UserQuest | null>(null);
    const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);

    useEffect(() => {
        fetchQuests();
        if (user) fetchUserQuests();
    }, [user]);

    const fetchQuests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('quests' as any)
                .select('*')
                .eq('is_active', true)
                .order('difficulty', { ascending: true });

            if (error) throw error;
            setQuests((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching quests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserQuests = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_quests' as any)
                .select('*, quest:quests(*)')
                .eq('user_id', user.id);

            if (error) throw error;
            setUserQuests((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching user quests:', error);
        }
    };

    const startQuest = async (questId: string) => {
        if (!user) {
            authModal.open('login');
            return;
        }

        try {
            const { error } = await supabase
                .from('user_quests' as any)
                .insert({
                    user_id: user.id,
                    quest_id: questId,
                    status: 'active',
                    progress: 0
                });

            if (error) throw error;

            toast({ title: 'Quest Started!', description: 'Good luck completing this quest.' });
            fetchUserQuests();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const getUserQuestStatus = (questId: string) => {
        return userQuests.find(uq => uq.quest_id === questId);
    };

    const continueQuest = (userQuest: UserQuest) => {
        setSelectedQuest(userQuest);
        setIsEvidenceDialogOpen(true);
    };

    const filteredQuests = activeCategory === 'all'
        ? quests
        : quests.filter(q => q.category === activeCategory);

    const getStatusBadge = (userQuest?: UserQuest) => {
        if (!userQuest) return null;

        const statusConfig = {
            active: { label: 'In Progress', className: 'bg-blue-500 text-white' },
            pending_verification: { label: 'Pending', className: 'bg-yellow-500 text-white' },
            completed: { label: 'Completed', className: 'bg-green-500 text-white' },
            rejected: { label: 'Rejected', className: 'bg-red-500 text-white' }
        };

        const config = statusConfig[userQuest.status];
        return <Badge className={config?.className}>{config?.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading quests...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">Civic Quests</h1>
                </div>
                <p className="text-muted-foreground">
                    Complete real-world civic tasks to earn points and badges
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Quests</p>
                                <p className="text-2xl font-bold">{userQuests.filter(uq => uq.status === 'active').length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">{userQuests.filter(uq => uq.status === 'completed').length}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Points</p>
                                <p className="text-2xl font-bold">
                                    {userQuests
                                        .filter(uq => uq.status === 'completed')
                                        .reduce((sum, uq) => sum + (uq.quest?.points || 0), 0)}
                                </p>
                            </div>
                            <Award className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Available</p>
                                <p className="text-2xl font-bold">{quests.length}</p>
                            </div>
                            <Target className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quest Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="mb-6">
                    <TabsTrigger value="all">All Quests</TabsTrigger>
                    <TabsTrigger value="reporting">Reporting</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="learning">Learning</TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuests.map((quest) => {
                            const userQuest = getUserQuestStatus(quest.id);
                            const isStarted = !!userQuest;
                            const isCompleted = userQuest?.status === 'completed';

                            return (
                                <Card key={quest.id} className={isCompleted ? 'opacity-75' : ''}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    {categoryIcons[quest.category]}
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline" className={difficultyColors[quest.difficulty || 'easy']}>
                                                {quest.difficulty || 'Easy'}
                                            </Badge>
                                            <Badge variant="secondary">{quest.points} pts</Badge>
                                            {getStatusBadge(userQuest)}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>

                                        {userQuest && userQuest.status === 'active' && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>Progress</span>
                                                    <span>{userQuest.progress}%</span>
                                                </div>
                                                <Progress value={userQuest.progress} />
                                            </div>
                                        )}

                                        {!isStarted && (
                                            <Button onClick={() => startQuest(quest.id)} className="w-full">
                                                Start Quest
                                            </Button>
                                        )}

                                        {isStarted && !isCompleted && (
                                            <Button variant="outline" className="w-full" onClick={() => continueQuest(userQuest!)}>
                                                Continue Quest
                                            </Button>
                                        )}

                                        {isCompleted && (
                                            <Button variant="ghost" className="w-full" disabled>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Completed
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {filteredQuests.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No quests found</h3>
                                <p className="text-muted-foreground">Check back later for new quests!</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Evidence Submission Dialog */}
            {selectedQuest && (
                <QuestEvidenceDialog
                    isOpen={isEvidenceDialogOpen}
                    onClose={() => setIsEvidenceDialogOpen(false)}
                    userQuest={selectedQuest}
                    onSubmit={() => {
                        fetchUserQuests();
                        fetchQuests();
                    }}
                />
            )}
        </div>
    );
};

export default Quests;

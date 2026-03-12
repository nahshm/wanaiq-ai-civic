import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BarChart2, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreatePollDialog } from './CreatePollDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { DetailedPollCard } from './DetailedPollCard';

interface CommunityPollsWidgetProps {
    communityId: string;
    isAdmin: boolean;
    community?: any;
}

export const CommunityPollsWidget: React.FC<CommunityPollsWidgetProps> = ({ communityId, isAdmin, community }) => {
    const [polls, setPolls] = useState<any[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});
    const [pollResults, setPollResults] = useState<Record<string, number[]>>({}); // pollId -> [countValidOption0, countValidOption1...]
    const [loading, setLoading] = useState(true);
    const [createPollOpen, setCreatePollOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchPolls = async () => {
        try {
            const { data: pollsData, error } = await supabase
                .from('community_polls')
                .select('*')
                .eq('community_id', communityId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;

            if (!pollsData || pollsData.length === 0) {
                setPolls([]);
                return;
            }

            setPolls(pollsData);

            // Fetch user votes
            if (user) {
                const pollIds = pollsData.map(p => p.id);
                const { data: votesData } = await supabase
                    .from('community_poll_votes')
                    .select('poll_id, option_index')
                    .in('poll_id', pollIds)
                    .eq('user_id', user.id);

                const votesMap: Record<string, number> = {};
                votesData?.forEach((v: any) => {
                    votesMap[v.poll_id] = v.option_index;
                });
                setUserVotes(votesMap);

                // Fetch aggregation (simplified: fetch all votes for these polls)
                // For scalability, this should be a stored procedure or view, but safe for < 1000 votes
                const { data: allVotes } = await supabase
                    .from('community_poll_votes')
                    .select('poll_id, option_index')
                    .in('poll_id', pollIds);

                const resultsMap: Record<string, number[]> = {};
                pollsData.forEach(p => {
                    const optionsArray = Array.isArray(p.options) ? p.options : [];
                    resultsMap[p.id] = new Array(optionsArray.length).fill(0);
                });

                allVotes?.forEach((v: any) => {
                    if (resultsMap[v.poll_id]) {
                        resultsMap[v.poll_id][v.option_index]++;
                    }
                });
                setPollResults(resultsMap);
            }
        } catch (error) {
            console.error('Error fetching polls:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, [communityId, user]);

    const handleVote = async (pollId: string, optionIndex: number) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('community_poll_votes')
                .insert({
                    poll_id: pollId,
                    user_id: user.id,
                    option_index: optionIndex
                });

            if (error) throw error;

            toast({
                title: 'Vote recorded',
                description: 'Thanks for voting!',
            });

            fetchPolls(); // Refresh to show results
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to vote',
                variant: 'destructive',
            });
        }
    };

    if (loading) return null;

    return (
        <>
            <div className="w-full max-w-3xl mx-auto">
                {/* Header Actions */}
                {isAdmin && (
                    <div className="flex justify-end mb-6">
                        <Button
                            onClick={() => setCreatePollOpen(true)}
                            className="rounded-full shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Poll
                        </Button>
                    </div>
                )}

                {/* Polls List */}
                {polls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-16 border border-dashed border-border bg-card/50 rounded-xl">
                        <BarChart2 className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No active polls</h3>
                        <p className="max-w-sm text-center mb-6">Engage your community by asking for their opinion on important matters.</p>
                        {isAdmin && (
                            <Button onClick={() => setCreatePollOpen(true)} className="rounded-full">
                                <Plus className="w-4 h-4 mr-2" /> Create one now
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {polls.map(poll => {
                            const hasVoted = userVotes.hasOwnProperty(poll.id);
                            const totalVotes = pollResults[poll.id]?.reduce((a, b) => a + b, 0) || 0;
                            const userChoice = hasVoted ? userVotes[poll.id] : undefined;

                            return (
                                <DetailedPollCard 
                                    key={poll.id}
                                    poll={poll}
                                    hasVoted={hasVoted}
                                    userChoice={userChoice}
                                    results={pollResults[poll.id] || []}
                                    totalVotes={totalVotes}
                                    onVote={handleVote}
                                    bannerUrl={community?.banner_url}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <CreatePollDialog
                isOpen={createPollOpen}
                onClose={() => setCreatePollOpen(false)}
                communityId={communityId}
                onPollCreated={fetchPolls}
            />
        </>
    );
};

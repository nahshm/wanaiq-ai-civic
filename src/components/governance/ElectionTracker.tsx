import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ElectionCycle, GovernmentPosition } from '@/types/governance';
import { Calendar, Clock, Flag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function ElectionTracker() {
    const [upcomingElections, setUpcomingElections] = useState<{ cycle: ElectionCycle, position: GovernmentPosition }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchElections = async () => {
            // Fetch next 3 upcoming elections
            const { data, error } = await supabase
                .from('election_cycles')
                .select(`
                    *,
                    position:government_positions(*)
                `)
                .gte('election_date', new Date().toISOString())
                .order('election_date', { ascending: true })
                .limit(3);

            if (!error && data) {
                // Transform data to match local types if needed, or rely on inference
                const typedData = data.map((item: any) => ({
                    cycle: item,
                    position: item.position
                }));
                setUpcomingElections(typedData);
            }
            setIsLoading(false);
        };

        fetchElections();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Upcoming Elections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (upcomingElections.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Upcoming Elections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No upcoming elections scheduled.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2"><Flag className="w-4 h-4 text-primary" /> Election Watch</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                {upcomingElections.map(({ cycle, position }) => (
                    <div key={cycle.id} className="flex flex-col gap-1 border-b last:border-0 last:pb-0 pb-3">
                        <span className="font-semibold text-sm">{position.title}</span>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(cycle.election_date), 'MMM d, yyyy')}
                            </span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {formatDistanceToNow(new Date(cycle.election_date))}
                            </span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

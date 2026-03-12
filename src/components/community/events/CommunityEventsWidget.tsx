import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Video, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { CreateEventDialog } from './CreateEventDialog';
import { useAuth } from '@/contexts/AuthContext';
import { DetailedEventCard } from './DetailedEventCard';

interface CommunityEventsWidgetProps {
    communityId: string;
    isAdmin: boolean;
    community?: any;
}

export const CommunityEventsWidget: React.FC<CommunityEventsWidgetProps> = ({ communityId, isAdmin, community }) => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createEventOpen, setCreateEventOpen] = useState(false);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('community_events')
                .select('*')
                .eq('community_id', communityId)
                .gte('start_time', new Date().toISOString()) // Only future events
                .order('start_time', { ascending: true })
                .limit(3);

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [communityId]);

    if (loading) {
        return (
            <Card className="bg-sidebar-background border-sidebar-border">
                <CardContent className="pt-4">
                    <div className="h-20 bg-sidebar-accent/50 animate-pulse rounded"></div>
                </CardContent>
            </Card>
        );
    }

    // If no events and not admin, don't show anything (or show empty state?)
    // Let's show empty state to encourage activity if admin, or just hide if user?
    // Decisions: Show "No upcoming events" to everyone.

    return (
        <>
            <div className="w-full max-w-3xl mx-auto">
                {/* Header Actions */}
                {isAdmin && (
                    <div className="flex justify-end mb-6">
                        <Button
                            onClick={() => setCreateEventOpen(true)}
                            className="rounded-full shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule Event
                        </Button>
                    </div>
                )}

                {/* Events List */}
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-16 border border-dashed border-border bg-card/50 rounded-xl">
                        <Calendar className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No upcoming events</h3>
                        <p className="max-w-sm text-center mb-6">There are currently no scheduled events for this community.</p>
                        {isAdmin && (
                            <Button onClick={() => setCreateEventOpen(true)} className="rounded-full">
                                <Plus className="w-4 h-4 mr-2" /> Schedule one now
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event) => (
                            <DetailedEventCard 
                                key={event.id} 
                                event={event} 
                                bannerUrl={community?.banner_url} 
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateEventDialog
                isOpen={createEventOpen}
                onClose={() => setCreateEventOpen(false)}
                communityId={communityId}
                onEventCreated={fetchEvents}
            />
        </>
    );
};

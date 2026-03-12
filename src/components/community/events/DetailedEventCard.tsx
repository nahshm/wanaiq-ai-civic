import React, { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Video, Copy, Bell, MoreHorizontal, Info, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface DetailedEventCardProps {
    event: any;
    bannerUrl?: string;
}

export const DetailedEventCard: React.FC<DetailedEventCardProps> = ({ event, bannerUrl }) => {
    const { toast } = useToast();
    const [interested, setInterested] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/communities?event=${event.id}`);
        toast({ title: 'Link copied', description: 'Event link copied to clipboard.' });
    };

    const handleInterested = () => {
        setInterested(!interested);
        toast({ 
            title: !interested ? 'Marked as interested' : 'Removed interest', 
            description: !interested ? "We'll remind you when this event starts." : "You will no longer receive reminders.",
            duration: 3000
        });
    };

    const isOnline = event.location_type === 'online';
    const locationString = isOnline 
        ? 'Online Event' 
        : (typeof event.location_data === 'string' ? event.location_data : event.location_data?.address || 'Physical Location');

    // Default gradient if no banner
    const defaultBanner = "bg-gradient-to-r from-blue-900 via-purple-900 to-pink-500 bg-opacity-50";

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-6 max-w-3xl mx-auto">
            {/* Banner Section */}
            <div className={`h-32 md:h-48 w-full relative ${!bannerUrl ? defaultBanner : ''}`}>
                {bannerUrl && (
                    <img src={bannerUrl} alt="Event Banner" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-md">{event.title}</h2>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex gap-4 w-full">
                        <div className="bg-primary/10 text-primary rounded-lg p-3 flex flex-col items-center justify-center min-w-[64px] h-[64px] shrink-0">
                            <Calendar className="w-6 h-6 mb-1" />
                            {/* In a real app we might show date and month here instead of icon */}
                        </div>
                        <div className="w-full">
                            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-1">
                                {format(new Date(event.start_time), 'EEE MMM do • HH:mm')}
                            </div>
                            <div className="text-muted-foreground text-sm mb-4">
                                Repeats (Coming Soon)
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{event.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                        {isOnline ? <Video className="w-4 h-4 text-muted-foreground" /> : <MapPin className="w-4 h-4 text-muted-foreground" />}
                        <span className="truncate max-w-[200px] sm:max-w-[300px] hover:underline cursor-pointer text-primary">{locationString}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button variant="secondary" size="icon" className="h-9 w-9 bg-secondary hover:bg-secondary/80">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleCopyLink} className="h-9 font-semibold bg-secondary hover:bg-secondary/80">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                        </Button>
                        <Button variant={interested ? "secondary" : "secondary"} size="sm" onClick={handleInterested} className={`h-9 font-semibold ${interested ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}>
                            <Bell className={`w-4 h-4 mr-2 ${interested ? 'fill-current' : ''}`} />
                            {interested ? 'Interested' : 'Interested'}
                        </Button>
                    </div>
                </div>
                
                {/* Series placeholder */}
                <div className="mt-2 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-4">Events in series</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="font-bold text-foreground group-hover:underline">{format(new Date(event.start_time), 'EEE MMM do • HH:mm')}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Placeholder fake future events to mimic design */}
                        <div className="flex items-center justify-between group cursor-pointer opacity-70">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="font-bold text-foreground group-hover:underline">{(new Date(new Date(event.start_time).getTime() + 7 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {format(new Date(event.start_time), 'HH:mm')}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <Button variant="link" className="text-primary font-medium hover:text-primary/80">View future events</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

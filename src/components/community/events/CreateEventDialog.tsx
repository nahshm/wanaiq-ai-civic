import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';

interface CreateEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    onEventCreated: () => void;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
    isOpen,
    onClose,
    communityId,
    onEventCreated,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [locationType, setLocationType] = useState('online');
    const [locationData, setLocationData] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('community_events')
                .insert({
                    community_id: communityId,
                    title,
                    description,
                    start_time: new Date(startTime).toISOString(),
                    end_time: endTime ? new Date(endTime).toISOString() : null,
                    location_type: locationType,
                    location_data: locationType === 'online' ? { url: locationData } : { address: locationData },
                    created_by: user.id,
                });

            if (error) throw error;

            toast({
                title: 'Event scheduled',
                description: 'The event has been successfully created.',
            });

            onEventCreated();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setStartTime('');
            setEndTime('');
            setLocationData('');
        } catch (error: any) {
            console.error('Error creating event:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create event',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule Event</DialogTitle>
                    <DialogDescription>
                        Create a new event for your community.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Weekly Town Hall"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this event about?"
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input
                                id="start-time"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-time">End Time (Optional)</Label>
                            <Input
                                id="end-time"
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                min={startTime}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location-type">Location Type</Label>
                        <Select value={locationType} onValueChange={setLocationType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="online">Online (Link)</SelectItem>
                                <SelectItem value="physical">Physical (Address)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location-data">
                            {locationType === 'online' ? 'Meeting Link' : 'Address / Venue'}
                        </Label>
                        <Input
                            id="location-data"
                            value={locationData}
                            onChange={(e) => setLocationData(e.target.value)}
                            placeholder={locationType === 'online' ? 'https://meet.google.com/...' : 'Community Hall, Main St.'}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !title || !startTime}>
                            {loading ? 'Scheduling...' : 'Schedule Event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

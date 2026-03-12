import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserQuest } from '@/types/gamification';
import { Upload, MapPin, Camera, X } from 'lucide-react';

interface QuestEvidenceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userQuest: UserQuest;
    onSubmit: () => void;
}

export const QuestEvidenceDialog = ({ isOpen, onClose, userQuest, onSubmit }: QuestEvidenceDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const captureGPS = () => {
        if (navigator.geolocation) {
            toast({ title: 'Getting location...', description: 'Please allow location access' });
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    toast({ title: 'Location captured!', description: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}` });
                },
                (error) => {
                    toast({ title: 'Location Error', description: error.message, variant: 'destructive' });
                }
            );
        } else {
            toast({ title: 'GPS Not Supported', description: 'Your browser does not support geolocation', variant: 'destructive' });
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        // Validation based on quest requirements
        if (userQuest.quest?.verification_type === 'photo' && photos.length === 0) {
            toast({ title: 'Photos Required', description: 'This quest requires photo evidence', variant: 'destructive' });
            return;
        }

        if (userQuest.quest?.requirements?.require_gps && !gpsLocation) {
            toast({ title: 'GPS Required', description: 'This quest requires GPS location', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            // Build evidence object
            const evidence: any = {
                notes,
                photos: photos.map(f => f.name), // In production, upload to storage
                gps: gpsLocation,
                submitted_at: new Date().toISOString()
            };

            // Determine new status based on verification type
            let newStatus: 'pending_verification' | 'completed' = 'pending_verification';
            if (userQuest.quest?.verification_type === 'automatic') {
                newStatus = 'completed';
            }

            // Update user quest
            const { error } = await supabase
                .from('user_quests' as any)
                .update({
                    evidence,
                    status: newStatus,
                    progress: 100
                })
                .eq('id', userQuest.id);

            if (error) throw error;

            toast({
                title: newStatus === 'completed' ? 'Quest Completed!' : 'Evidence Submitted!',
                description: newStatus === 'completed'
                    ? `You earned ${userQuest.quest?.points} points!`
                    : 'Your evidence is pending verification'
            });

            onSubmit();
            onClose();
        } catch (error: any) {
            toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Submit Quest Evidence</DialogTitle>
                    <DialogDescription>
                        {userQuest.quest?.title} - {userQuest.quest?.verification_type} verification
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Photo Upload */}
                    <div>
                        <Label>Evidence Photos {userQuest.quest?.requirements?.min_photos && `(Min: ${userQuest.quest.requirements.min_photos})`}</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative mt-2">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handlePhotoChange}
                            />
                            <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload photos</p>
                        </div>

                        {photoPreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {photoPreviews.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square bg-muted rounded-md overflow-hidden group">
                                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* GPS Capture */}
                    {userQuest.quest?.requirements?.require_gps && (
                        <div>
                            <Label>GPS Location {userQuest.quest?.requirements?.require_gps && '(Required)'}</Label>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={captureGPS}
                                className="w-full mt-2"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                {gpsLocation ? `Location Captured (${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)})` : 'Capture GPS Location'}
                            </Button>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <Label>Additional Notes (Optional)</Label>
                        <Textarea
                            placeholder="Describe what you did to complete this quest..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="mt-2"
                        />
                    </div>

                    {/* Verification Info */}
                    <div className="bg-muted p-3 rounded-lg text-sm">
                        <p className="font-semibold mb-1">Verification Type: {userQuest.quest?.verification_type}</p>
                        {userQuest.quest?.verification_type === 'photo' && (
                            <p className="text-muted-foreground">Photos will be automatically verified with GPS data</p>
                        )}
                        {userQuest.quest?.verification_type === 'social_proof' && (
                            <p className="text-muted-foreground">3+ community members need to verify your submission</p>
                        )}
                        {userQuest.quest?.verification_type === 'official' && (
                            <p className="text-muted-foreground">A moderator or official will review your submission</p>
                        )}
                        {userQuest.quest?.verification_type === 'automatic' && (
                            <p className="text-muted-foreground">Quest will be automatically completed upon submission</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Evidence'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

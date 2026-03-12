import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

interface SubmitProjectUpdateProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const SubmitProjectUpdate: React.FC<SubmitProjectUpdateProps> = ({
    projectId,
    open,
    onOpenChange,
    onSuccess
}) => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [updateType, setUpdateType] = useState<'progress' | 'issue' | 'delay'>('progress');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).slice(0, 5); // Max 5 photos
            setPhotos(prev => [...prev, ...newFiles].slice(0, 5));

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPhotoPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadPhotos = async (): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of photos) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            const { error } = await supabase.storage
                .from('project-media')
                .upload(filePath, file);

            if (!error) {
                const { data } = supabase.storage.from('project-media').getPublicUrl(filePath);
                urls.push(data.publicUrl);
            }
        }

        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            authModal.open('login');
            return;
        }

        setLoading(true);
        try {
            // Upload photos
            const photoUrls = await uploadPhotos();

            // Insert update - using columns that exist in the schema
            const { error } = await supabase
                .from('project_updates')
                .insert({
                    created_by: user.id,
                    title,
                    description,
                    media_urls: photoUrls,
                    update_type: updateType
                } as any);

            if (error) throw error;

            toast({
                title: 'Update Submitted!',
                description: 'Your project update has been posted.'
            });

            // Reset form
            setTitle('');
            setDescription('');
            setPhotos([]);
            setPhotoPreviews([]);
            setUpdateType('progress');

            onOpenChange(false);
            onSuccess?.();

        } catch (error: any) {
            toast({
                title: 'Submission Failed',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Submit Project Update</DialogTitle>
                    <DialogDescription>
                        Report on the project's progress, issues, or delays. Add photos as evidence.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Update Type */}
                    <div className="space-y-2">
                        <Label htmlFor="updateType">Update Type *</Label>
                        <Select value={updateType} onValueChange={(val: any) => setUpdateType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="progress">Progress Update</SelectItem>
                                <SelectItem value="issue">Issue / Problem</SelectItem>
                                <SelectItem value="delay">Delay / Stalled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Brief summary of update"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide details about this update..."
                            rows={4}
                            required
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <Label>Photos (Optional, max 5)</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handlePhotoChange}
                                disabled={photos.length >= 5}
                            />
                            <ImageIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {photos.length >= 5 ? 'Maximum 5 photos' : 'Click to upload photos'}
                            </p>
                        </div>

                        {/* Photo Previews */}
                        {photoPreviews.length > 0 && (
                            <div className="grid grid-cols-5 gap-2">
                                {photoPreviews.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square bg-muted rounded-md overflow-hidden group">
                                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Update
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

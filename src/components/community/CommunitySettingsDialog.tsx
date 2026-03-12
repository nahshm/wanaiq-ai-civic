import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Upload, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { CommunityProfile } from '@/types/index';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommunitySettingsDialogProps {
    community: CommunityProfile;
    trigger?: React.ReactNode;
    onUpdate?: () => void;
}

export const CommunitySettingsDialog: React.FC<CommunitySettingsDialogProps> = ({
    community,
    trigger,
    onUpdate,
}) => {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState(community.description || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(community.avatarUrl);
    const [bannerPreview, setBannerPreview] = useState(community.bannerUrl);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'avatar') {
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
            } else {
                setBannerFile(file);
                setBannerPreview(URL.createObjectURL(file));
            }
        }
    };

    const uploadImage = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let newAvatarUrl = community.avatarUrl;
            let newBannerUrl = community.bannerUrl;

            if (avatarFile) {
                newAvatarUrl = await uploadImage(avatarFile, `communities/${community.id}/avatar`);
            }

            if (bannerFile) {
                newBannerUrl = await uploadImage(bannerFile, `communities/${community.id}/banner`);
            }

            const { error } = await supabase
                .from('communities')
                .update({
                    description,
                    avatar_url: newAvatarUrl,
                    banner_url: newBannerUrl,
                })
                .eq('id', community.id);

            if (error) throw error;

            toast({
                title: 'Community updated',
                description: 'Changes have been saved successfully.',
            });

            if (onUpdate) onUpdate();
            setOpen(false);
        } catch (error: any) {
            console.error('Error updating community:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update community',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Settings className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Community Settings</DialogTitle>
                    <DialogDescription>
                        Manage your community's appearance and details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="appearance">Appearance</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Community Name</Label>
                                <Input value={community.name} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Community names cannot be changed.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="h-[200px] resize-none"
                                    placeholder="Tell people what this community is about..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="appearance" className="space-y-6 py-4 overflow-y-auto">
                            {/* Avatar Section */}
                            <div className="space-y-4">
                                <Label>Community Avatar</Label>
                                <div className="flex items-center gap-6">
                                    <Avatar className="w-24 h-24 border-2 border-border">
                                        <AvatarImage src={avatarPreview || undefined} />
                                        <AvatarFallback className="text-2xl">{community.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                                                <Upload className="w-4 h-4" />
                                                Upload new avatar
                                            </div>
                                            <Input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'avatar')}
                                            />
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Recommended 256x256px. Max 2MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Banner Section */}
                            <div className="space-y-4">
                                <Label>Community Banner</Label>
                                <div className="space-y-3">
                                    <div
                                        className="h-32 w-full rounded-md bg-cover bg-center border border-border flex items-center justify-center bg-muted"
                                        style={{
                                            backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
                                            background: !bannerPreview ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--civic-blue)) 100%)' : undefined
                                        }}
                                    >
                                        {!bannerPreview && <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="banner-upload" className="cursor-pointer">
                                            <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Change Banner
                                            </Button>
                                            <Input
                                                id="banner-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'banner')}
                                            />
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Recommended 1920x384px. Max 5MB.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label>Platform Tour</Label>
                                <p className="text-sm text-muted-foreground">
                                    Replay the guided walkthrough to learn about community features.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        localStorage.removeItem('platform-tour-completed');
                                        localStorage.removeItem(`admin-tour-completed-${community.id}`);
                                        toast({
                                            title: 'Tour restarted',
                                            description: 'The walkthrough will appear when you close settings.',
                                        });
                                        setOpen(false);
                                    }}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Restart Tour
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="py-4 mt-auto">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
    userId: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userId }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [displayName, setDisplayName] = React.useState('');
    const [bio, setBio] = React.useState('');

    // Fetch current profile data
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile-settings', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, bio')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    // Update form when data loads
    React.useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName.trim() || null,
                    bio: bio.trim() || null,
                })
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile-v2'] });
            queryClient.invalidateQueries({ queryKey: ['profile-settings', userId] });
            toast({
                title: 'Profile updated',
                description: 'Your profile has been successfully updated.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="w-4 h-4" />
                    Profile Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveMutation.mutate();
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell people about yourself..."
                            rows={4}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                            {bio.length}/500 characters
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="w-full"
                    >
                        {saveMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

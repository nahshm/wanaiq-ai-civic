import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Users,
    Shield,
    UserPlus,
    UserMinus,
    Crown,
    Search,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Moderator {
    id: string;
    user_id: string;
    role: string;
    added_at: string;
    profile: {
        display_name: string;
        avatar_url: string | null;
        username: string;
    };
}

interface ModeratorPanelProps {
    communityId: string;
    communityName: string;
    isAdmin: boolean;
}

export function ModeratorPanel({ communityId, communityName, isAdmin }: ModeratorPanelProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [addUserSearch, setAddUserSearch] = useState('');

    // Fetch moderators
    const { data: moderators, isLoading } = useQuery({
        queryKey: ['community-moderators', communityId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('community_moderators')
                .select(`
                    id,
                    user_id,
                    role,
                    added_at
                `)
                .eq('community_id', communityId)
                .order('role', { ascending: true });

            if (error) throw error;

            // Fetch profiles separately
            if (!data || data.length === 0) return [];

            const userIds = data.map(m => m.user_id).filter(Boolean);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url, username')
                .in('id', userIds);

            const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
            return data.map(m => ({
                ...m,
                profile: profilesMap.get(m.user_id) || null
            })) as Moderator[];
        },
    });

    // Search users to add
    const { data: searchResults, isLoading: searchLoading } = useQuery({
        queryKey: ['user-search', addUserSearch],
        queryFn: async () => {
            if (!addUserSearch.trim()) return [];
            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url, username')
                .or(`display_name.ilike.%${addUserSearch}%,username.ilike.%${addUserSearch}%`)
                .limit(5);

            if (error) throw error;
            return data;
        },
        enabled: addUserSearch.length >= 2,
    });

    // Add moderator mutation
    const addModeratorMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from('community_moderators')
                .insert({
                    community_id: communityId,
                    user_id: userId,
                    role: 'moderator',
                    added_by: user?.id,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-moderators', communityId] });
            toast.success('Moderator added');
            setAddUserSearch('');
        },
        onError: (error) => {
            toast.error('Failed to add moderator: ' + error.message);
        },
    });

    // Remove moderator mutation
    const removeModeratorMutation = useMutation({
        mutationFn: async (moderatorId: string) => {
            const { error } = await supabase
                .from('community_moderators')
                .delete()
                .eq('id', moderatorId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-moderators', communityId] });
            toast.success('Moderator removed');
        },
        onError: (error) => {
            toast.error('Failed to remove moderator: ' + error.message);
        },
    });

    // Promote to admin mutation
    const promoteToAdminMutation = useMutation({
        mutationFn: async (moderatorId: string) => {
            const { error } = await supabase
                .from('community_moderators')
                .update({ role: 'admin' })
                .eq('id', moderatorId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-moderators', communityId] });
            toast.success('Promoted to admin');
        },
        onError: (error) => {
            toast.error('Failed to promote: ' + error.message);
        },
    });

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredModerators = moderators?.filter(m =>
        m.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const existingUserIds = new Set(moderators?.map(m => m.user_id) || []);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Team
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Community Team
                    </SheetTitle>
                    <SheetDescription>
                        Manage moderators and admins for {communityName}
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="team" className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="team">
                            <Users className="h-4 w-4 mr-2" />
                            Team
                        </TabsTrigger>
                        <TabsTrigger value="add" disabled={!isAdmin}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                        </TabsTrigger>
                    </TabsList>

                    {/* Team Tab */}
                    <TabsContent value="team" className="mt-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search team members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredModerators?.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No team members found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {filteredModerators?.map((mod) => (
                                    <Card key={mod.id}>
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={mod.profile?.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {getInitials(mod.profile?.display_name || 'U')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {mod.profile?.display_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    @{mod.profile?.username}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={mod.role === 'admin' ? 'default' : 'secondary'}
                                                className="flex-shrink-0"
                                            >
                                                {mod.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                                                {mod.role}
                                            </Badge>
                                            {isAdmin && mod.user_id !== user?.id && (
                                                <div className="flex gap-1">
                                                    {mod.role !== 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => promoteToAdminMutation.mutate(mod.id)}
                                                            title="Promote to Admin"
                                                        >
                                                            <Crown className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => removeModeratorMutation.mutate(mod.id)}
                                                        title="Remove"
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Add Member Tab */}
                    <TabsContent value="add" className="mt-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or username..."
                                value={addUserSearch}
                                onChange={(e) => setAddUserSearch(e.target.value)}
                                className="pl-10"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {addUserSearch.length < 2 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Type at least 2 characters to search
                            </p>
                        ) : searchResults?.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No users found
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {searchResults?.map((profile) => {
                                    const isAlreadyMod = existingUserIds.has(profile.id);
                                    return (
                                        <Card key={profile.id}>
                                            <CardContent className="p-3 flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={profile.avatar_url || undefined} />
                                                    <AvatarFallback>
                                                        {getInitials(profile.display_name || 'U')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                        {profile.display_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        @{profile.username}
                                                    </p>
                                                </div>
                                                {isAlreadyMod ? (
                                                    <Badge variant="outline">Already added</Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addModeratorMutation.mutate(profile.id)}
                                                        disabled={addModeratorMutation.isPending}
                                                    >
                                                        <UserPlus className="h-4 w-4 mr-1" />
                                                        Add
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                Moderators can manage channels, pin posts, and moderate discussions.
                                Admins have full control including adding/removing other team members.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}

export default ModeratorPanel;

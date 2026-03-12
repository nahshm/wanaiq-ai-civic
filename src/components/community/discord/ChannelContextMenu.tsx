import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { copyToClipboard } from '@/lib/clipboard-utils';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Pencil,
    Trash2,
    Lock,
    Unlock,
    Copy,
    Bell,
    BellOff,
    Settings,
    BarChart3,
    Smile,
} from 'lucide-react';
import { toast } from 'sonner';

// Common emoji shortcuts for quick selection
const QUICK_EMOJIS = ['📢', '💬', '📋', '🎯', '📊', '🔔', '⭐', '🏆', '🗳️', '📝', '🔍', '💡'];

interface Channel {
    id: string;
    name: string;
    type: string;
    category: string;
    description?: string | null;
    emoji_prefix?: string | null;
    is_locked?: boolean;
    is_private?: boolean;
}

interface ChannelContextMenuProps {
    channel: Channel;
    isAdmin: boolean;
    isModerator: boolean;
    communityId: string;
    children: React.ReactNode;
    onChannelUpdate?: () => void;
}

export function ChannelContextMenu({
    channel,
    isAdmin,
    isModerator,
    communityId,
    children,
    onChannelUpdate,
}: ChannelContextMenuProps) {
    const queryClient = useQueryClient();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editName, setEditName] = useState(channel.name);
    const [editDescription, setEditDescription] = useState(channel.description || '');
    const [editEmoji, setEditEmoji] = useState(channel.emoji_prefix || '');

    const canManage = isAdmin || isModerator;
    const canDelete = isAdmin && !channel.is_locked;

    // Update channel mutation
    const updateChannelMutation = useMutation({
        mutationFn: async (updates: Partial<Channel>) => {
            const { error } = await supabase
                .from('channels')
                .update(updates)
                .eq('id', channel.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-channels', communityId] });
            toast.success('Channel updated');
            setEditDialogOpen(false);
            onChannelUpdate?.();
        },
        onError: (error) => {
            toast.error('Failed to update channel: ' + error.message);
        },
    });

    // Delete channel mutation
    const deleteChannelMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', channel.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-channels', communityId] });
            toast.success('Channel deleted');
            setDeleteDialogOpen(false);
            onChannelUpdate?.();
        },
        onError: (error) => {
            toast.error('Failed to delete channel: ' + error.message);
        },
    });

    const handleCopyLink = () => {
        const url = `${window.location.origin}/c/${communityId}?channel=${channel.id}`;
        copyToClipboard(url, 'Channel link copied!');
    };

    const handleTogglePrivate = () => {
        updateChannelMutation.mutate({ is_private: !channel.is_private });
    };

    const handleSaveEdit = () => {
        updateChannelMutation.mutate({
            name: editName,
            description: editDescription,
            emoji_prefix: editEmoji || null,
        });
    };

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    {children}
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                    {/* View Actions - Everyone */}
                    <ContextMenuItem onClick={handleCopyLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                    </ContextMenuItem>

                    {/* Notification Settings */}
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                            <ContextMenuItem>
                                <Bell className="h-4 w-4 mr-2" />
                                All Messages
                            </ContextMenuItem>
                            <ContextMenuItem>
                                <BellOff className="h-4 w-4 mr-2" />
                                Mute Channel
                            </ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>

                    {canManage && (
                        <>
                            <ContextMenuSeparator />

                            {/* Admin/Mod Actions */}
                            <ContextMenuItem onClick={() => {
                                setEditName(channel.name);
                                setEditDescription(channel.description || '');
                                setEditEmoji(channel.emoji_prefix || '');
                                setEditDialogOpen(true);
                            }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Channel
                            </ContextMenuItem>

                            <ContextMenuItem onClick={handleTogglePrivate}>
                                {channel.is_private ? (
                                    <>
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Make Public
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Make Private
                                    </>
                                )}
                            </ContextMenuItem>

                            <ContextMenuItem disabled>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Analytics
                                <Badge variant="outline" className="ml-auto text-[10px]">Soon</Badge>
                            </ContextMenuItem>
                        </>
                    )}

                    {canDelete && (
                        <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Channel
                            </ContextMenuItem>
                        </>
                    )}

                    {channel.is_locked && (
                        <>
                            <ContextMenuSeparator />
                            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center">
                                <Lock className="h-3 w-3 mr-1" />
                                Core channel (protected)
                            </div>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            {/* Edit Channel Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Channel</DialogTitle>
                        <DialogDescription>
                            Customize your channel settings
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Emoji Prefix */}
                        <div className="space-y-2">
                            <Label>Emoji Prefix</Label>
                            <div className="flex gap-2 flex-wrap">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <Button
                                        key={emoji}
                                        variant={editEmoji === emoji ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-lg p-2 h-10 w-10"
                                        onClick={() => setEditEmoji(editEmoji === emoji ? '' : emoji)}
                                    >
                                        {emoji}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="px-3"
                                    onClick={() => setEditEmoji('')}
                                >
                                    None
                                </Button>
                            </div>
                            <Input
                                placeholder="Or type custom emoji..."
                                value={editEmoji}
                                onChange={(e) => setEditEmoji(e.target.value.slice(0, 2))}
                                className="w-20"
                            />
                        </div>

                        {/* Channel Name */}
                        <div className="space-y-2">
                            <Label>Channel Name</Label>
                            <div className="flex items-center gap-2">
                                {editEmoji && <span className="text-lg">{editEmoji}</span>}
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    disabled={channel.is_locked}
                                />
                            </div>
                            {channel.is_locked && (
                                <p className="text-xs text-muted-foreground">
                                    Core channels cannot be renamed
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="What is this channel for?"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={updateChannelMutation.isPending}
                        >
                            {updateChannelMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete #{channel.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All messages and threads in this channel will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteChannelMutation.mutate()}
                        >
                            {deleteChannelMutation.isPending ? 'Deleting...' : 'Delete Channel'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default ChannelContextMenu;

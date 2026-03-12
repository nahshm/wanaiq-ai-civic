import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Book, Link2, FileText, MessageCircle, Globe, ExternalLink, Users, Shield, Hammer, Loader2 } from 'lucide-react';

// Available icons for bookmarks
const availableIcons = [
    { value: 'book', label: 'Book', icon: Book },
    { value: 'link', label: 'Link', icon: Link2 },
    { value: 'file', label: 'Document', icon: FileText },
    { value: 'chat', label: 'Chat', icon: MessageCircle },
    { value: 'globe', label: 'Website', icon: Globe },
    { value: 'external', label: 'External', icon: ExternalLink },
    { value: 'users', label: 'Community', icon: Users },
    { value: 'shield', label: 'Rules', icon: Shield },
    { value: 'hammer', label: 'Projects', icon: Hammer },
];

interface Bookmark {
    id: string;
    label: string;
    url: string;
    icon: string;
    position: number;
}

interface BookmarkManageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    bookmark?: Bookmark | null; // If editing
    nextPosition?: number; // For new bookmarks
}

export const BookmarkManageDialog: React.FC<BookmarkManageDialogProps> = ({
    isOpen,
    onClose,
    communityId,
    bookmark,
    nextPosition = 0,
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!bookmark;

    const [label, setLabel] = useState(bookmark?.label || '');
    const [url, setUrl] = useState(bookmark?.url || '');
    const [icon, setIcon] = useState(bookmark?.icon || 'link');

    // Reset form when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setLabel(bookmark?.label || '');
            setUrl(bookmark?.url || '');
            setIcon(bookmark?.icon || 'link');
        }
    }, [isOpen, bookmark]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (isEditing) {
                const { error } = await (supabase.from as any)('community_bookmarks')
                    .update({ label, url, icon })
                    .eq('id', bookmark.id);
                if (error) throw error;
            } else {
                const { error } = await (supabase.from as any)('community_bookmarks')
                    .insert({
                        community_id: communityId,
                        label,
                        url,
                        icon,
                        position: nextPosition,
                    });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast({
                title: isEditing ? 'Bookmark updated' : 'Bookmark created',
                description: `"${label}" has been ${isEditing ? 'updated' : 'added'}`,
            });
            queryClient.invalidateQueries({ queryKey: ['community-bookmarks', communityId] });
            onClose();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to ${isEditing ? 'update' : 'create'} bookmark`,
                variant: 'destructive',
            });
            console.error('Bookmark save error:', error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!bookmark) return;
            const { error } = await (supabase.from as any)('community_bookmarks')
                .delete()
                .eq('id', bookmark.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: 'Bookmark deleted',
                description: `"${bookmark?.label}" has been removed`,
            });
            queryClient.invalidateQueries({ queryKey: ['community-bookmarks', communityId] });
            onClose();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: 'Failed to delete bookmark',
                variant: 'destructive',
            });
            console.error('Bookmark delete error:', error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim() || !url.trim()) {
            toast({
                title: 'Validation error',
                description: 'Label and URL are required',
                variant: 'destructive',
            });
            return;
        }
        saveMutation.mutate();
    };

    const isPending = saveMutation.isPending || deleteMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Bookmark' : 'Add Bookmark'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g., Community Rules"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select value={icon} onValueChange={setIcon} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableIcons.map((iconOption) => {
                                    const IconComponent = iconOption.icon;
                                    return (
                                        <SelectItem key={iconOption.value} value={iconOption.value}>
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="w-4 h-4" />
                                                {iconOption.label}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => deleteMutation.mutate()}
                                disabled={isPending}
                                className="mr-auto"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {saveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isEditing ? (
                                'Save Changes'
                            ) : (
                                'Add Bookmark'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

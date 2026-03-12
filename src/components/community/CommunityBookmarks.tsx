import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Book, Link2, FileText, MessageCircle, Globe, ExternalLink,
    Users, Shield, Hammer, Plus, Pencil, GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BookmarkManageDialog } from './BookmarkManageDialog';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface Bookmark {
    id: string;
    label: string;
    url: string;
    icon: string;
    position: number;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    book: Book,
    link: Link2,
    file: FileText,
    chat: MessageCircle,
    globe: Globe,
    external: ExternalLink,
    users: Users,
    shield: Shield,
    hammer: Hammer,
};

async function fetchBookmarks(communityId: string, signal?: AbortSignal): Promise<Bookmark[]> {
    // Cast to any because Supabase types may not be regenerated yet
    const { data, error } = await (supabase
        .from('community_bookmarks' as any)
        .select('id, label, url, icon, position')
        .eq('community_id', communityId)
        .order('position')
        .abortSignal(signal) as any);

    if (error) {
        console.error('Error fetching bookmarks:', error);
        return [];
    }

    return (data || []) as Bookmark[];
}

// Default bookmarks shown when none exist in database
const defaultBookmarks: Bookmark[] = [
    { id: 'wiki', label: 'Wiki', url: '#', icon: 'book', position: 0 },
    { id: 'rules', label: 'Rules', url: '#', icon: 'shield', position: 1 },
    { id: 'faq', label: 'FAQ', url: '#', icon: 'chat', position: 2 },
    { id: 'links', label: 'Links', url: '#', icon: 'link', position: 3 },
];

interface CommunityBookmarksProps {
    communityId?: string;
    isAdmin?: boolean;
}

export const CommunityBookmarks = ({ communityId, isAdmin = false }: CommunityBookmarksProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

    const { data: bookmarks = [], isLoading } = useQuery({
        queryKey: ['community-bookmarks', communityId],
        queryFn: ({ signal }) => fetchBookmarks(communityId!, signal),
        enabled: !!communityId,
        staleTime: 10 * 60 * 1000,
    });

    // Use database bookmarks if available, otherwise show defaults (but only clickable if isAdmin)
    const displayBookmarks = bookmarks.length > 0 ? bookmarks : defaultBookmarks;
    const isUsingDefaults = bookmarks.length === 0;

    const handleAddClick = () => {
        setEditingBookmark(null);
        setDialogOpen(true);
    };

    const handleEditClick = (bookmark: Bookmark) => {
        if (isUsingDefaults) return; // Can't edit default placeholders
        setEditingBookmark(bookmark);
        setDialogOpen(true);
    };

    const nextPosition = displayBookmarks.length > 0
        ? Math.max(...displayBookmarks.map(b => b.position)) + 1
        : 0;

    return (
        <>
            <Card className="bg-sidebar-background border-sidebar-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground flex items-center justify-between">
                        Community Bookmarks
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-sidebar-accent"
                                onClick={handleAddClick}
                                title="Add bookmark"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-10 bg-sidebar-accent/30 rounded-md animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {displayBookmarks.map((bookmark) => {
                                const Icon = iconMap[bookmark.icon] || Link2;
                                const isPlaceholder = isUsingDefaults;

                                const bookmarkContent = (
                                    <a
                                        href={isPlaceholder ? undefined : bookmark.url}
                                        className={`
                                            flex items-center justify-center gap-2 p-2 rounded-md 
                                            bg-sidebar-accent/30 hover:bg-sidebar-accent 
                                            transition-colors text-sm font-medium
                                            ${isPlaceholder ? 'opacity-50 cursor-default' : ''}
                                            ${isAdmin && !isPlaceholder ? 'group relative' : ''}
                                        `}
                                        target={bookmark.url.startsWith('http') ? '_blank' : undefined}
                                        rel={bookmark.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        onClick={(e) => {
                                            if (isPlaceholder) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {bookmark.label}
                                        {isAdmin && !isPlaceholder && (
                                            <Pencil className="w-3 h-3 absolute right-1 top-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                                        )}
                                    </a>
                                );

                                // Wrap with context menu for admins
                                if (isAdmin && !isPlaceholder) {
                                    return (
                                        <ContextMenu key={bookmark.id}>
                                            <ContextMenuTrigger asChild>
                                                {bookmarkContent}
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem onClick={() => handleEditClick(bookmark)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit bookmark
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    );
                                }

                                return <React.Fragment key={bookmark.id}>{bookmarkContent}</React.Fragment>;
                            })}
                        </div>
                    )}

                    {isUsingDefaults && isAdmin && (
                        <p className="text-xs text-sidebar-muted-foreground mt-3 text-center">
                            Click + to add your first bookmark
                        </p>
                    )}
                </CardContent>
            </Card>

            {communityId && (
                <BookmarkManageDialog
                    isOpen={dialogOpen}
                    onClose={() => {
                        setDialogOpen(false);
                        setEditingBookmark(null);
                    }}
                    communityId={communityId}
                    bookmark={editingBookmark}
                    nextPosition={nextPosition}
                />
            )}
        </>
    );
};

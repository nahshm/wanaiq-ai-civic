import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    MessageSquare,
    Plus,
    Pin,
    Lock,
    Clock,
    ArrowLeft,
    Send,
    ChevronRight,
    Loader2,
    Smile,
    Reply,
    Copy,
    Flag,
    Trash2,
    ThumbsUp,
    MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/clipboard-utils';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '💡', '👀', '✅'];

interface ForumChannelProps {
    channelId: string;
    channelName: string;
    communityId: string;
}

interface ForumThread {
    id: string;
    title: string;
    content: string | null;
    pinned: boolean;
    locked: boolean;
    reply_count: number;
    last_reply_at: string | null;
    created_at: string;
    author: {
        id: string;
        display_name: string;
        avatar_url: string | null;
        role?: string;
    };
    reactions?: { [emoji: string]: string[] };
}

interface ForumReply {
    id: string;
    content: string;
    upvotes: number;
    created_at: string;
    parent_reply_id: string | null;
    author: {
        id: string;
        display_name: string;
        avatar_url: string | null;
        role?: string;
    };
    reactions?: { [emoji: string]: string[] };
}

export function ForumChannel({ channelId, channelName, communityId }: ForumChannelProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
    const [newThreadOpen, setNewThreadOpen] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
    const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [replyEmojiOpen, setReplyEmojiOpen] = useState(false);
    const repliesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Fetch threads
    const { data: threads, isLoading: threadsLoading } = useQuery({
        queryKey: ['forum-threads', channelId],
        queryFn: async () => {
            const { data, error } = await (supabase.from as any)('forum_threads')
                .select(`
                    id, title, content, pinned, locked, reply_count, last_reply_at, created_at,
                    author:profiles!author_id(id, display_name, avatar_url, role)
                `)
                .eq('channel_id', channelId)
                .order('pinned', { ascending: false })
                .order('last_reply_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(t => ({
                ...t,
                reactions: {}
            })) as unknown as ForumThread[];
        },
    });

    // Fetch replies
    const { data: replies, isLoading: repliesLoading } = useQuery({
        queryKey: ['forum-replies', selectedThread?.id],
        queryFn: async () => {
            if (!selectedThread) return [];
            const { data, error } = await (supabase.from as any)('forum_replies')
                .select(`
                    id, content, upvotes, created_at, parent_reply_id,
                    author:profiles!author_id(id, display_name, avatar_url, role)
                `)
                .eq('thread_id', selectedThread.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return (data || []).map(r => ({
                ...r,
                reactions: {}
            })) as unknown as ForumReply[];
        },
        enabled: !!selectedThread,
    });

    // Create thread
    const createThreadMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Not authenticated');
            const { error } = await (supabase.from as any)('forum_threads')
                .insert({
                    channel_id: channelId,
                    community_id: communityId,
                    author_id: user.id,
                    title: newThreadTitle,
                    content: newThreadContent,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forum-threads', channelId] });
            setNewThreadOpen(false);
            setNewThreadTitle('');
            setNewThreadContent('');
            toast.success('Thread created!');
        },
        onError: (error) => toast.error('Failed: ' + error.message),
    });

    // Post reply
    const postReplyMutation = useMutation({
        mutationFn: async () => {
            if (!user || !selectedThread) throw new Error('Missing data');
            const { error } = await (supabase.from as any)('forum_replies')
                .insert({
                    thread_id: selectedThread.id,
                    author_id: user.id,
                    content: replyContent,
                    parent_reply_id: replyingTo?.id || null,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedThread?.id] });
            queryClient.invalidateQueries({ queryKey: ['forum-threads', channelId] });
            // Optimistic reply count update
            if (selectedThread) {
                setSelectedThread(prev => prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : prev);
            }
            setReplyContent('');
            setReplyingTo(null);
            toast.success('Reply posted!');
            scrollToBottom();
        },
        onError: (error) => toast.error('Failed: ' + error.message),
    });

    // Handle reaction on reply (optimistic only until types regenerated)
    const handleReplyReaction = async (replyId: string, emoji: string) => {
        if (!user) return;

        const reply = replies?.find(r => r.id === replyId);
        const hasReacted = reply?.reactions?.[emoji]?.includes(user.id);

        queryClient.setQueryData(['forum-replies', selectedThread?.id], (old: ForumReply[] | undefined) => {
            if (!old) return old;
            return old.map(r => {
                if (r.id === replyId) {
                    const reactions = { ...r.reactions };
                    if (!reactions[emoji]) reactions[emoji] = [];
                    if (hasReacted) {
                        reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
                        if (reactions[emoji].length === 0) delete reactions[emoji];
                    } else {
                        reactions[emoji] = [...reactions[emoji], user.id];
                    }
                    return { ...r, reactions };
                }
                return r;
            });
        });
        setEmojiPickerOpen(null);
    };

    // Delete reply
    const handleDeleteReply = async (replyId: string) => {
        const { error } = await (supabase.from as any)('forum_replies').delete().eq('id', replyId);
        if (error) {
            toast.error('Failed to delete');
        } else {
            queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedThread?.id] });
            toast.success('Reply deleted');
        }
    };

    const handleCopy = (content: string) => {
        copyToClipboard(content, 'Copied!');
    };

    const insertEmojiToReply = (emoji: string) => {
        setReplyContent(prev => prev + emoji);
        setReplyEmojiOpen(false);
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const getRoleColor = (role?: string) => {
        const colors: { [key: string]: string } = {
            admin: 'text-red-500', moderator: 'text-blue-500', official: 'text-green-500',
        };
        return colors[role || ''] || '';
    };

    // Group replies by parent for collapsible threading
    const parentReplies = (replies || []).filter(r => !r.parent_reply_id);
    const childRepliesMap: { [parentId: string]: ForumReply[] } = {};

    (replies || []).forEach(r => {
        if (r.parent_reply_id) {
            if (!childRepliesMap[r.parent_reply_id]) {
                childRepliesMap[r.parent_reply_id] = [];
            }
            childRepliesMap[r.parent_reply_id].push(r);
        }
    });

    const toggleReplyThread = (replyId: string) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            if (next.has(replyId)) {
                next.delete(replyId);
            } else {
                next.add(replyId);
            }
            return next;
        });
    };

    const getVisibleChildren = (parentId: string) => {
        const children = childRepliesMap[parentId] || [];
        return expandedReplies.has(parentId) ? children : children.slice(0, 1);
    };

    const getHiddenChildCount = (parentId: string) => {
        const children = childRepliesMap[parentId] || [];
        return Math.max(0, children.length - 1);
    };

    // Thread List View
    if (!selectedThread) {
        return (
            <TooltipProvider>
                <div className="flex flex-col h-full bg-background">
                    {/* Header */}
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-card/50">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                {channelName}
                            </h2>
                            <p className="text-sm text-muted-foreground">{threads?.length || 0} discussions</p>
                        </div>
                        <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1" /> New Thread
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Thread</DialogTitle>
                                    <DialogDescription>Start a discussion in #{channelName}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Input placeholder="Title..." value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} />
                                    <Textarea placeholder="What would you like to discuss?" value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} rows={4} />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setNewThreadOpen(false)}>Cancel</Button>
                                        <Button onClick={() => createThreadMutation.mutate()} disabled={!newThreadTitle.trim() || createThreadMutation.isPending}>
                                            {createThreadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                            Create
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Thread List */}
                    <ScrollArea className="flex-1 p-4">
                        {threadsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : threads?.length === 0 ? (
                            <div className="text-center py-16">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="font-semibold mb-2">No discussions yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">Start the conversation!</p>
                                <Button onClick={() => setNewThreadOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" /> Create First Thread
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {threads?.map((thread) => (
                                    <Card
                                        key={thread.id}
                                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                                        onClick={() => setSelectedThread(thread)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={thread.author?.avatar_url || undefined} />
                                                    <AvatarFallback>{getInitials(thread.author?.display_name || 'U')}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {thread.pinned && <Pin className="h-3 w-3 text-primary" />}
                                                        {thread.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                        <h3 className="font-semibold truncate">{thread.title}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{thread.content || 'No content'}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" /> {thread.reply_count || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                                        </span>
                                                        {thread.reactions && Object.keys(thread.reactions).length > 0 && (
                                                            <div className="flex gap-1">
                                                                {Object.entries(thread.reactions).slice(0, 3).map(([emoji, users]) => (
                                                                    <span key={emoji} className="flex items-center">{emoji} {users.length}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </TooltipProvider>
        );
    }

    // Thread Detail View
    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center gap-4 bg-card/50">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedThread(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {selectedThread.pinned && <Pin className="h-4 w-4 text-primary" />}
                            {selectedThread.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                            <h2 className="font-semibold truncate">{selectedThread.title}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedThread.reply_count || 0} replies</p>
                    </div>
                </div>

                {/* Thread Content & Replies */}
                <ScrollArea className="flex-1 p-4">
                    {/* Original Post */}
                    <Card className="border-primary/20 mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedThread.author?.avatar_url || undefined} />
                                    <AvatarFallback>{getInitials(selectedThread.author?.display_name || 'U')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={cn("font-semibold", getRoleColor(selectedThread.author?.role))}>
                                            {selectedThread.author?.display_name}
                                        </span>
                                        <Badge variant="outline" className="text-[10px]">OP</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(selectedThread.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{selectedThread.content || 'No content'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Replies */}
                    {repliesLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : replies?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No replies yet. Be the first to respond!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {parentReplies.map((reply) => {
                                const isMe = reply.author?.id === user?.id;
                                const isHovered = hoveredReplyId === reply.id;
                                const hasChildren = (childRepliesMap[reply.id] || []).length > 0;

                                return (
                                    <div key={reply.id}>
                                        <ContextMenu>
                                            <ContextMenuTrigger>
                                                <div
                                                    className="relative group"
                                                    onMouseEnter={() => setHoveredReplyId(reply.id)}
                                                    onMouseLeave={() => setHoveredReplyId(null)}
                                                >
                                                    <Card className={cn("transition-colors", isHovered && "bg-accent/50")}>
                                                        <CardContent className="p-3">
                                                            <div className="flex items-start gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={reply.author?.avatar_url || undefined} />
                                                                    <AvatarFallback>{getInitials(reply.author?.display_name || 'U')}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={cn("font-medium text-sm", getRoleColor(reply.author?.role))}>
                                                                            {reply.author?.display_name}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {format(new Date(reply.created_at), 'MMM d, HH:mm')}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>

                                                                    {/* Reactions */}
                                                                    {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {Object.entries(reply.reactions).map(([emoji, users]) => (
                                                                                users.length > 0 && (
                                                                                    <Button
                                                                                        key={emoji}
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className={cn(
                                                                                            "h-6 px-2 text-xs rounded-full",
                                                                                            users.includes(user?.id || '') && "bg-primary/20 border-primary"
                                                                                        )}
                                                                                        onClick={() => handleReplyReaction(reply.id, emoji)}
                                                                                    >
                                                                                        {emoji} {users.length}
                                                                                    </Button>
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Hover Toolbar */}
                                                                {isHovered && (
                                                                    <div className="absolute -top-2 right-2 flex items-center bg-background rounded-md border shadow-lg">
                                                                        <Popover open={emojiPickerOpen === reply.id} onOpenChange={(open) => setEmojiPickerOpen(open ? reply.id : null)}>
                                                                            <PopoverTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                    <Smile className="h-4 w-4" />
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-auto p-2" align="end">
                                                                                <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                                                    {QUICK_REACTIONS.map(emoji => (
                                                                                        <Button
                                                                                            key={emoji}
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-8 w-8 p-0 text-lg"
                                                                                            onClick={() => handleReplyReaction(reply.id, emoji)}
                                                                                        >
                                                                                            {emoji}
                                                                                        </Button>
                                                                                    ))}
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setReplyingTo(reply)}>
                                                                            <Reply className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleCopy(reply.content)}>
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                        {isMe && (
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteReply(reply.id)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent className="w-48">
                                                <ContextMenuItem onClick={() => setReplyingTo(reply)}>
                                                    <Reply className="h-4 w-4 mr-2" /> Reply
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleCopy(reply.content)}>
                                                    <Copy className="h-4 w-4 mr-2" /> Copy
                                                </ContextMenuItem>
                                                <ContextMenuSeparator />
                                                <ContextMenuItem className="text-destructive">
                                                    <Flag className="h-4 w-4 mr-2" /> Report
                                                </ContextMenuItem>
                                                {isMe && (
                                                    <ContextMenuItem className="text-destructive" onClick={() => handleDeleteReply(reply.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </ContextMenuItem>
                                                )}
                                            </ContextMenuContent>
                                        </ContextMenu>

                                        {/* Nested child replies */}
                                        {hasChildren && (
                                            <div className="ml-10 mt-1 space-y-1">
                                                {getVisibleChildren(reply.id).map((child) => {
                                                    const childIsMe = child.author?.id === user?.id;
                                                    const childHovered = hoveredReplyId === child.id;

                                                    return (
                                                        <div
                                                            key={child.id}
                                                            className="relative"
                                                            onMouseEnter={() => setHoveredReplyId(child.id)}
                                                            onMouseLeave={() => setHoveredReplyId(null)}
                                                        >
                                                            {/* Curved connector line */}
                                                            <div className="absolute -left-6 top-0 flex items-start">
                                                                <div className="w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
                                                            </div>

                                                            <div className={cn(
                                                                "flex gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors",
                                                                childHovered && "bg-accent/50"
                                                            )}>
                                                                <Avatar className="h-6 w-6 flex-shrink-0">
                                                                    <AvatarImage src={child.author?.avatar_url || undefined} />
                                                                    <AvatarFallback className="text-xs">{getInitials(child.author?.display_name || 'U')}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5 text-xs">
                                                                        <Reply className="h-3 w-3 text-muted-foreground" />
                                                                        <span className={cn("font-medium", getRoleColor(child.author?.role))}>
                                                                            {child.author?.display_name}
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {format(new Date(child.created_at), 'MMM d, HH:mm')}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm whitespace-pre-wrap">{child.content}</p>
                                                                </div>

                                                                {/* Child actions */}
                                                                {childHovered && (
                                                                    <div className="flex items-center gap-0.5">
                                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyingTo(child)}>
                                                                            <Reply className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopy(child.content)}>
                                                                            <Copy className="h-3 w-3" />
                                                                        </Button>
                                                                        {childIsMe && (
                                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteReply(child.id)}>
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Show more button */}
                                                {getHiddenChildCount(reply.id) > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-primary ml-1"
                                                        onClick={() => toggleReplyThread(reply.id)}
                                                    >
                                                        {expandedReplies.has(reply.id)
                                                            ? "Collapse replies"
                                                            : `Show ${getHiddenChildCount(reply.id)} more ${getHiddenChildCount(reply.id) === 1 ? 'reply' : 'replies'}`
                                                        }
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Scroll anchor */}
                    <div ref={repliesEndRef} />
                </ScrollArea>

                {/* Reply Preview */}
                {replyingTo && (
                    <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-3">
                        <Reply className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Replying to </span>
                            <span className="text-xs font-medium">{replyingTo.author?.display_name}</span>
                            <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Reply Input */}
                {!selectedThread.locked ? (
                    <div className="p-4 border-t">
                        <div className="flex items-center gap-2 bg-background border rounded-lg">
                            <Textarea
                                placeholder={replyingTo ? "Write your reply..." : "Add to the discussion..."}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="flex-1 border-0 bg-transparent resize-none min-h-[44px] max-h-[120px] focus-visible:ring-0 pl-4"
                                rows={1}
                            />
                            <div className="flex items-center gap-1 pr-2">
                                <Popover open={replyEmojiOpen} onOpenChange={setReplyEmojiOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
                                            <Smile className="h-5 w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2" align="end">
                                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                                            {QUICK_REACTIONS.map(emoji => (
                                                <Button
                                                    key={emoji}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-lg"
                                                    onClick={() => insertEmojiToReply(emoji)}
                                                >
                                                    {emoji}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    onClick={() => postReplyMutation.mutate()}
                                    disabled={!replyContent.trim() || postReplyMutation.isPending}
                                    size="icon"
                                    className="h-9 w-9"
                                >
                                    {postReplyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
                        <Lock className="h-4 w-4 inline mr-1" /> This thread is locked.
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

export default ForumChannel;

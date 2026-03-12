import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    Send,
    Lock,
    Hash,
    Search,
    Pin,
    Users,
    Plus,
    Smile,
    Image as ImageIcon,
    Paperclip,
    Reply,
    Copy,
    Flag,
    Trash2,
    X,
    Loader2,
    Pencil,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';
import { MessageContent } from './MessageContent';
import { MessageMedia } from './MessageMedia';
import { TypingIndicator } from './TypingIndicator';

// Quick reaction emojis
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅'];

interface PendingFile {
    file: File;
    preview?: string;
    isImage: boolean;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    reply_to_id?: string | null;
    media_urls?: string[];
    media_type?: string | null;
    edited_at?: string | null;
    sender?: {
        id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
        role?: string;
    };
    reactions?: { [emoji: string]: string[] };
}

interface ChannelChatWindowProps {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    channelEmoji?: string;
    isReadOnly?: boolean;
}

export function ChannelChatWindow({
    channelId,
    channelName,
    channelDescription,
    channelEmoji,
    isReadOnly = false
}: ChannelChatWindowProps) {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
    const [inputEmojiOpen, setInputEmojiOpen] = useState(false);
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [plusMenuOpen, setPlusMenuOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editContent, setEditContent] = useState('');
    const [typingUsers, setTypingUsers] = useState<{ id: string; username: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── Fetch Messages + Reactions ───
    const fetchMessages = useCallback(async () => {
        setIsLoading(true);

        const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select(`
                *,
                reply_to_id,
                sender:profiles!sender_id(id, username, display_name, avatar_url, role)
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            toast.error('Failed to load messages');
            setIsLoading(false);
            return;
        }

        const msgIds = (messagesData || []).map(m => (m as any).id);

        // Batch-fetch reactions
        let reactionsMap: { [msgId: string]: { [emoji: string]: string[] } } = {};
        if (msgIds.length > 0) {
            const { data: reactionsData } = await supabase
                .from('message_reactions')
                .select('message_id, emoji, user_id')
                .in('message_id', msgIds);

            if (reactionsData) {
                reactionsData.forEach((r: any) => {
                    if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = {};
                    if (!reactionsMap[r.message_id][r.emoji]) reactionsMap[r.message_id][r.emoji] = [];
                    reactionsMap[r.message_id][r.emoji].push(r.user_id);
                });
            }
        }

        const messagesWithReactions = (messagesData || []).map((msg: any) => ({
            ...msg,
            reactions: reactionsMap[msg.id] || {},
        }));

        setMessages(messagesWithReactions as Message[]);
        setTimeout(scrollToBottom, 100);
        setIsLoading(false);
    }, [channelId]);

    useEffect(() => {
        if (!channelId) return;

        fetchMessages();

        // Realtime: messages (INSERT + UPDATE + DELETE)
        const channel = supabase
            .channel(`channel:${channelId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
                async (payload) => {
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('id, username, display_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        sender_id: payload.new.sender_id,
                        reply_to_id: payload.new.reply_to_id,
                        media_urls: payload.new.media_urls || [],
                        media_type: payload.new.media_type,
                        edited_at: payload.new.edited_at,
                        sender: senderData || { id: payload.new.sender_id, username: 'Unknown' },
                        reactions: {},
                    };

                    setMessages((prev) => {
                        const filtered = prev.filter(m => m.id !== newMsg.id && !(m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id));
                        return [...filtered, newMsg];
                    });

                    if (isNearBottom()) {
                        scrollToBottom();
                    } else {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
                (payload) => {
                    setMessages((prev) => prev.map(m =>
                        m.id === payload.new.id
                            ? { ...m, content: payload.new.content, edited_at: payload.new.edited_at }
                            : m
                    ));
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
                (payload) => {
                    setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
                }
            )
            .subscribe();

        // Realtime: reactions
        const reactionsChannel = supabase
            .channel(`reactions:${channelId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'message_reactions' },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                        const msgId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
                        if (msgId) {
                            supabase
                                .from('message_reactions')
                                .select('emoji, user_id')
                                .eq('message_id', msgId)
                                .then(({ data }) => {
                                    const grouped: { [emoji: string]: string[] } = {};
                                    (data || []).forEach((r: any) => {
                                        if (!grouped[r.emoji]) grouped[r.emoji] = [];
                                        grouped[r.emoji].push(r.user_id);
                                    });
                                    setMessages(prev => prev.map(m =>
                                        m.id === msgId ? { ...m, reactions: grouped } : m
                                    ));
                                });
                        }
                    }
                }
            )
            .subscribe();

        // Typing indicator: broadcast channel
        const typingChannel = supabase.channel(`typing:${channelId}`);
        typingChannel
            .on('broadcast', { event: 'typing' }, ({ payload: p }) => {
                if (p.user_id === user?.id) return;
                setTypingUsers(prev => {
                    const exists = prev.find(u => u.id === p.user_id);
                    if (!exists) return [...prev, { id: p.user_id, username: p.username }];
                    return prev;
                });
                // Auto-remove after 3s
                setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u.id !== p.user_id));
                }, 3000);
            })
            .on('broadcast', { event: 'stop_typing' }, ({ payload: p }) => {
                setTypingUsers(prev => prev.filter(u => u.id !== p.user_id));
            })
            .subscribe();
        typingChannelRef.current = typingChannel;

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(reactionsChannel);
            supabase.removeChannel(typingChannel);
            typingChannelRef.current = null;
        };
    }, [channelId, fetchMessages]);

    // ─── Helpers ───
    const isNearBottom = () => {
        const container = document.querySelector('[data-radix-scroll-area-viewport]');
        if (!container) return true;
        const { scrollTop, scrollHeight, clientHeight } = container;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ─── File Upload ───
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
        const files = Array.from(e.target.files || []);
        const maxSize = 10 * 1024 * 1024; // 10MB

        const valid = files.filter(f => {
            if (f.size > maxSize) {
                toast.error(`${f.name} exceeds 10MB limit`);
                return false;
            }
            return true;
        });

        const pending: PendingFile[] = valid.map(f => ({
            file: f,
            isImage: isImage || f.type.startsWith('image/'),
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        }));

        setPendingFiles(prev => [...prev, ...pending]);
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => {
            const file = prev[index];
            if (file.preview) URL.revokeObjectURL(file.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadFiles = async (): Promise<{ urls: string[]; type: string } | null> => {
        if (!user || pendingFiles.length === 0) return null;

        setIsUploading(true);
        const urls: string[] = [];
        let mediaType = 'file';

        try {
            for (const pf of pendingFiles) {
                const timestamp = Date.now();
                const safeName = pf.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${user.id}/${timestamp}_${safeName}`;

                const { error } = await supabase.storage
                    .from('chat-media')
                    .upload(path, pf.file, { contentType: pf.file.type });

                if (error) {
                    toast.error(`Failed to upload ${pf.file.name}`);
                    console.error('Upload error:', error);
                    continue;
                }
                urls.push(path);
                if (pf.isImage) mediaType = 'image';
            }
        } finally {
            setIsUploading(false);
            // Cleanup previews
            pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
            setPendingFiles([]);
        }

        return urls.length > 0 ? { urls, type: mediaType } : null;
    };

    // ─── Send Message ───
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && pendingFiles.length === 0) || !user) return;

        const content = newMessage.trim();
        const replyId = replyingTo?.id || null;

        // Upload files first if any
        const uploaded = await uploadFiles();

        // Don't send empty message with no attachments
        if (!content && !uploaded) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            content,
            created_at: new Date().toISOString(),
            sender_id: user.id,
            reply_to_id: replyId,
            media_urls: uploaded?.urls || [],
            media_type: uploaded?.type || null,
            sender: {
                id: user.id,
                username: profile?.username || user.email?.split('@')[0] || 'You',
                display_name: profile?.displayName || user.user_metadata?.display_name || user.email?.split('@')[0],
                avatar_url: profile?.avatar || user.user_metadata?.avatar_url,
            },
            reactions: {},
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setReplyingTo(null);
        // Stop typing indicator
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingChannelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { user_id: user.id } });
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        const insertPayload: any = {
            channel_id: channelId,
            sender_id: user.id,
            content: content || '',
            reply_to_id: replyId,
        };
        if (uploaded) {
            insertPayload.media_urls = uploaded.urls;
            insertPayload.media_type = uploaded.type;
        }

        const { error } = await supabase
            .from('chat_messages')
            .insert(insertPayload);

        if (error) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error('Failed to send message');
            setNewMessage(content);
        }
    };

    // ─── Reactions (DB-backed) ───
    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user) return;

        const currentMessage = messages.find(m => m.id === messageId);
        const hasReacted = currentMessage?.reactions?.[emoji]?.includes(user.id);

        // Optimistic update
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const reactions = { ...msg.reactions };
                if (!reactions[emoji]) reactions[emoji] = [];
                if (hasReacted) {
                    reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
                    if (reactions[emoji].length === 0) delete reactions[emoji];
                } else {
                    reactions[emoji] = [...reactions[emoji], user.id];
                }
                return { ...msg, reactions };
            }
            return msg;
        }));
        setEmojiPickerOpen(null);

        // Persist to DB
        if (hasReacted) {
            await supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('emoji', emoji)
                .eq('user_id', user.id);
        } else {
            await supabase
                .from('message_reactions')
                .insert({ message_id: messageId, emoji, user_id: user.id });
        }
    };

    // ─── Typing Broadcast ───
    const broadcastTyping = useCallback(() => {
        if (!user || !typingChannelRef.current) return;
        const username = profile?.username || profile?.displayName || user.email?.split('@')[0] || 'Someone';
        typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: user.id, username },
        });

        // Clear previous timeout and set new stop-typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            typingChannelRef.current?.send({
                type: 'broadcast',
                event: 'stop_typing',
                payload: { user_id: user.id },
            });
        }, 2000);
    }, [user, profile]);

    // ─── Message Editing ───
    const startEditing = (msg: Message) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setEditContent('');
    };

    const handleEditSave = async () => {
        if (!editingMessage || !editContent.trim()) return;
        if (editContent.trim() === editingMessage.content) {
            cancelEditing();
            return;
        }

        // Optimistic
        const newContent = editContent.trim();
        const editedAt = new Date().toISOString();
        setMessages(prev => prev.map(m =>
            m.id === editingMessage.id ? { ...m, content: newContent, edited_at: editedAt } : m
        ));
        cancelEditing();

        const { error } = await supabase
            .from('chat_messages')
            .update({ content: newContent, edited_at: editedAt } as any)
            .eq('id', editingMessage.id);

        if (error) {
            // Revert
            setMessages(prev => prev.map(m =>
                m.id === editingMessage.id ? { ...m, content: editingMessage.content, edited_at: editingMessage.edited_at } : m
            ));
            toast.error('Failed to edit message');
        }
    };

    // ─── Delete / Copy / Reply ───
    const handleDeleteMessage = async (messageId: string) => {
        const deletedMessage = messages.find(m => m.id === messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));

        const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
        if (error) {
            if (deletedMessage) {
                setMessages(prev => [...prev, deletedMessage].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ));
            }
            toast.error('Failed to delete message');
        } else {
            toast.success('Message deleted');
        }
    };

    const handleCopyMessage = (content: string) => {
        copyToClipboard(content, 'Message copied');
    };

    const handleReply = (msg: Message) => {
        setReplyingTo(msg);
        inputRef.current?.focus();
    };

    // ─── Formatting helpers ───
    const formatMessageDate = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    };

    const getRoleBadge = (role?: string) => {
        if (!role) return null;
        const badges: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
            admin: { label: 'ADMIN', variant: 'destructive' },
            moderator: { label: 'MOD', variant: 'default' },
            official: { label: 'OFFICIAL', variant: 'secondary' },
            super_admin: { label: 'SUPER', variant: 'destructive' },
        };
        return badges[role];
    };

    const getRoleColor = (role?: string) => {
        const colors: { [key: string]: string } = {
            admin: 'text-red-500 dark:text-red-400',
            moderator: 'text-blue-500 dark:text-blue-400',
            official: 'text-green-500 dark:text-green-400',
            super_admin: 'text-purple-500 dark:text-purple-400',
        };
        return colors[role || ''] || 'text-foreground';
    };

    // ─── Grouping ───
    const parentMessages = messages.filter(m => !m.reply_to_id);
    const repliesMap: { [parentId: string]: Message[] } = {};
    messages.forEach(msg => {
        if (msg.reply_to_id) {
            if (!repliesMap[msg.reply_to_id]) repliesMap[msg.reply_to_id] = [];
            repliesMap[msg.reply_to_id].push(msg);
        }
    });

    const groupedMessages: { date: Date; messages: Message[] }[] = [];
    parentMessages.forEach((msg) => {
        const msgDate = new Date(msg.created_at);
        const lastGroup = groupedMessages[groupedMessages.length - 1];
        if (!lastGroup || !isSameDay(lastGroup.date, msgDate)) {
            groupedMessages.push({ date: msgDate, messages: [msg] });
        } else {
            lastGroup.messages.push(msg);
        }
    });

    const toggleThread = (messageId: string) => {
        setExpandedThreads(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) next.delete(messageId);
            else next.add(messageId);
            return next;
        });
    };

    const getVisibleReplies = (messageId: string) => {
        const replies = repliesMap[messageId] || [];
        return expandedThreads.has(messageId) ? replies : replies.slice(0, 1);
    };

    const getHiddenReplyCount = (messageId: string) => {
        return Math.max(0, (repliesMap[messageId] || []).length - 1);
    };

    // ─── Render ───
    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background">
                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => handleFileSelect(e, false)}
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    multiple
                    onChange={(e) => handleFileSelect(e, true)}
                />

                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between bg-card/50 backdrop-blur shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2">
                            {channelEmoji ? (
                                <span className="text-xl">{channelEmoji}</span>
                            ) : (
                                <Hash className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="font-semibold">{channelName}</span>
                            {isReadOnly && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        {channelDescription && (
                            <>
                                <div className="w-px h-4 bg-border" />
                                <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                                    {channelDescription}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pin className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pinned Messages</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Users className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Member List</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Search</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Unread Banner */}
                {unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground px-4 py-1.5 flex items-center justify-between text-sm font-medium">
                        <span>{unreadCount}+ new messages</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-foreground hover:bg-primary-foreground/10 h-6"
                            onClick={() => { scrollToBottom(); setUnreadCount(0); }}
                        >
                            Mark As Read 🔔
                        </Button>
                    </div>
                )}

                {/* Messages Area */}
                <ScrollArea className="flex-1 px-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-10">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Hash className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Welcome to #{channelName}!</h2>
                            <p className="text-muted-foreground">This is the start of the #{channelName} channel.</p>
                        </div>
                    ) : (
                        <div className="py-4">
                            {groupedMessages.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-4 my-4">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {formatMessageDate(group.date)}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>

                                    {group.messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        const roleBadge = getRoleBadge(msg.sender?.role);
                                        const isHovered = hoveredMessageId === msg.id;

                                        return (
                                            <div key={msg.id}>
                                                <ContextMenu>
                                                    <ContextMenuTrigger>
                                                        <div
                                                            className={cn(
                                                                'group relative flex gap-4 py-1.5 px-2 -mx-2 rounded-md transition-colors',
                                                                isHovered && 'bg-accent/50'
                                                            )}
                                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                                            onMouseLeave={() => setHoveredMessageId(null)}
                                                        >
                                                            <Avatar className="w-10 h-10 flex-shrink-0 mt-0.5">
                                                                <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                                                <AvatarFallback>
                                                                    {(msg.sender?.display_name || msg.sender?.username)?.[0]?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={cn('font-medium hover:underline cursor-pointer', getRoleColor(msg.sender?.role))}>
                                                                        {msg.sender?.display_name || msg.sender?.username}
                                                                    </span>
                                                                    {roleBadge && (
                                                                        <Badge variant={roleBadge.variant} className="text-[10px] px-1.5 py-0 h-4">
                                                                            {roleBadge.label}
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(msg.created_at), 'HH:mm')}
                                                                    </span>
                                                                </div>

                                                                {/* Message text with auto-linked URLs or edit input */}
                                                                {editingMessage?.id === msg.id ? (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Input
                                                                            ref={editInputRef}
                                                                            value={editContent}
                                                                            onChange={(e) => setEditContent(e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') handleEditSave();
                                                                                if (e.key === 'Escape') cancelEditing();
                                                                            }}
                                                                            className="flex-1 h-8 text-sm"
                                                                        />
                                                                        <Button size="icon" className="h-7 w-7" onClick={handleEditSave}>
                                                                            <Check className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditing}>
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                ) : msg.content ? (
                                                                    <div className="flex items-baseline gap-1">
                                                                        <MessageContent content={msg.content} />
                                                                        {msg.edited_at && (
                                                                            <span className="text-[10px] text-muted-foreground italic">(edited)</span>
                                                                        )}
                                                                    </div>
                                                                ) : null}

                                                                {/* Media attachments */}
                                                                {msg.media_urls && msg.media_urls.length > 0 && (
                                                                    <MessageMedia urls={msg.media_urls} mediaType={msg.media_type} />
                                                                )}

                                                                {/* Reactions */}
                                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                                            users.length > 0 && (
                                                                                <Button
                                                                                    key={emoji}
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className={cn(
                                                                                        'h-6 px-2 text-xs rounded-full',
                                                                                        users.includes(user?.id || '') && 'bg-primary/20 border-primary'
                                                                                    )}
                                                                                    onClick={() => handleReaction(msg.id, emoji)}
                                                                                >
                                                                                    {emoji} {users.length}
                                                                                </Button>
                                                                            )
                                                                        ))}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100"
                                                                            onClick={() => setEmojiPickerOpen(msg.id)}
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Hover Actions */}
                                                            {isHovered && (
                                                                <div className="absolute -top-3 right-2 flex items-center bg-background rounded-md border shadow-lg">
                                                                    <Popover open={emojiPickerOpen === msg.id} onOpenChange={(open) => setEmojiPickerOpen(open ? msg.id : null)}>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                <Smile className="h-4 w-4" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-2" align="end">
                                                                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                                                {QUICK_REACTIONS.map(emoji => (
                                                                                    <Button key={emoji} variant="ghost" size="sm" className="h-8 w-8 p-0 text-lg" onClick={() => handleReaction(msg.id, emoji)}>
                                                                                        {emoji}
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleReply(msg)}>
                                                                                <Reply className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Reply</TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleCopyMessage(msg.content)}>
                                                                                <Copy className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Copy</TooltipContent>
                                                                    </Tooltip>
                                                                    {isMe && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEditing(msg)}>
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Edit</TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                    {isMe && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteMessage(msg.id)}>
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Delete</TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ContextMenuTrigger>
                                                    <ContextMenuContent className="w-48">
                                                        <ContextMenuItem onClick={() => handleReply(msg)}>
                                                            <Reply className="h-4 w-4 mr-2" /> Reply
                                                        </ContextMenuItem>
                                                        <ContextMenuItem onClick={() => handleCopyMessage(msg.content)}>
                                                            <Copy className="h-4 w-4 mr-2" /> Copy Text
                                                        </ContextMenuItem>
                                                        {isMe && (
                                                            <ContextMenuItem onClick={() => startEditing(msg)}>
                                                                <Pencil className="h-4 w-4 mr-2" /> Edit Message
                                                            </ContextMenuItem>
                                                        )}
                                                        <ContextMenuSeparator />
                                                        <ContextMenuItem className="text-destructive focus:text-destructive">
                                                            <Flag className="h-4 w-4 mr-2" /> Report Message
                                                        </ContextMenuItem>
                                                        {isMe && (
                                                            <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteMessage(msg.id)}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Message
                                                            </ContextMenuItem>
                                                        )}
                                                    </ContextMenuContent>
                                                </ContextMenu>

                                                {/* Threaded Replies */}
                                                {repliesMap[msg.id] && repliesMap[msg.id].length > 0 && (
                                                    <div className="ml-10 mt-1">
                                                        {getVisibleReplies(msg.id).map((reply) => {
                                                            const replyIsMe = reply.sender_id === user?.id;
                                                            const replyHovered = hoveredMessageId === reply.id;

                                                            return (
                                                                <div
                                                                    key={reply.id}
                                                                    className="relative"
                                                                    onMouseEnter={() => setHoveredMessageId(reply.id)}
                                                                    onMouseLeave={() => setHoveredMessageId(null)}
                                                                >
                                                                    <div className="absolute -left-6 top-0 flex items-start">
                                                                        <div className="w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
                                                                    </div>

                                                                    <div className={cn(
                                                                        "flex gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors",
                                                                        replyHovered && "bg-accent/50"
                                                                    )}>
                                                                        <Avatar className="w-7 h-7 flex-shrink-0">
                                                                            <AvatarImage src={reply.sender?.avatar_url || undefined} />
                                                                            <AvatarFallback className="text-xs">
                                                                                {(reply.sender?.display_name || reply.sender?.username)?.[0]?.toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                                <Reply className="h-3 w-3 text-muted-foreground" />
                                                                                <span className={cn("font-medium", getRoleColor(reply.sender?.role))}>
                                                                                    {reply.sender?.display_name || reply.sender?.username}
                                                                                </span>
                                                                                <span className="text-muted-foreground">
                                                                                    {format(new Date(reply.created_at), 'HH:mm')}
                                                                                </span>
                                                                            </div>
                                                                            {reply.content && (
                                                                                <MessageContent content={reply.content} className="text-sm text-foreground whitespace-pre-wrap" />
                                                                            )}
                                                                            {reply.media_urls && reply.media_urls.length > 0 && (
                                                                                <MessageMedia urls={reply.media_urls} mediaType={reply.media_type} />
                                                                            )}

                                                                            {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                                    {Object.entries(reply.reactions).map(([emoji, users]) => (
                                                                                        users.length > 0 && (
                                                                                            <Button key={emoji} variant="outline" size="sm"
                                                                                                className={cn("h-5 px-1.5 text-[10px] rounded-full", users.includes(user?.id || '') && "bg-primary/20 border-primary")}
                                                                                                onClick={() => handleReaction(reply.id, emoji)}
                                                                                            >
                                                                                                {emoji} {users.length}
                                                                                            </Button>
                                                                                        )
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {replyHovered && (
                                                                            <div className="flex items-center gap-0.5">
                                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleReply(reply)}>
                                                                                    <Reply className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopyMessage(reply.content)}>
                                                                                    <Copy className="h-3 w-3" />
                                                                                </Button>
                                                                                {replyIsMe && (
                                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteMessage(reply.id)}>
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {getHiddenReplyCount(msg.id) > 0 && (
                                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary ml-1 mt-1" onClick={() => toggleThread(msg.id)}>
                                                                {expandedThreads.has(msg.id)
                                                                    ? "Collapse replies"
                                                                    : `Show ${getHiddenReplyCount(msg.id)} more ${getHiddenReplyCount(msg.id) === 1 ? 'reply' : 'replies'}`
                                                                }
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Reply Preview */}
                {replyingTo && (
                    <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-3">
                        <Reply className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Replying to </span>
                            <span className="text-xs font-medium">{replyingTo.sender?.display_name || replyingTo.sender?.username}</span>
                            <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Pending Files Preview */}
                {pendingFiles.length > 0 && (
                    <div className="px-4 py-2 border-t bg-muted/30 flex flex-wrap gap-2">
                        {pendingFiles.map((pf, i) => (
                            <div key={i} className="relative group/file">
                                {pf.isImage && pf.preview ? (
                                    <img src={pf.preview} alt={pf.file.name} className="h-16 w-16 object-cover rounded-lg border" />
                                ) : (
                                    <div className="h-16 px-3 flex items-center gap-2 rounded-lg border bg-muted">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs truncate max-w-[100px]">{pf.file.name}</span>
                                    </div>
                                )}
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover/file:opacity-100 transition-opacity"
                                    onClick={() => removePendingFile(i)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Typing Indicator */}
                <TypingIndicator typingUsers={typingUsers} />

                {/* Input Bar */}
                <div className="p-4 border-t bg-card/50">
                    {isReadOnly ? (
                        <div className="flex items-center justify-center py-3 bg-muted rounded-lg text-muted-foreground text-sm">
                            <Lock className="w-4 h-4 mr-2" />
                            You do not have permission to send messages in this channel.
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="relative">
                            <div className="flex items-center bg-background border rounded-lg">
                                {/* Plus menu */}
                                <Popover open={plusMenuOpen} onOpenChange={setPlusMenuOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-11 w-11">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-44 p-1" align="start" side="top">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 h-9"
                                            onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }}
                                        >
                                            <ImageIcon className="h-4 w-4" /> Upload Image
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 h-9"
                                            onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); }}
                                        >
                                            <Paperclip className="h-4 w-4" /> Upload File
                                        </Button>
                                    </PopoverContent>
                                </Popover>

                                <Input
                                    ref={inputRef}
                                    placeholder={replyingTo ? 'Type your reply...' : `Message #${channelName}`}
                                    value={newMessage}
                                    onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                                />

                                <div className="flex items-center gap-1 pr-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}>
                                                <Paperclip className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Attach File</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => imageInputRef.current?.click()}>
                                                <ImageIcon className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Upload Image</TooltipContent>
                                    </Tooltip>

                                    {/* Emoji Picker */}
                                    <EmojiPicker
                                        open={inputEmojiOpen}
                                        onOpenChange={setInputEmojiOpen}
                                        onSelect={(emoji) => {
                                            setNewMessage(prev => prev + emoji);
                                            setInputEmojiOpen(false);
                                            inputRef.current?.focus();
                                        }}
                                    />

                                    {(newMessage.trim() || pendingFiles.length > 0) && (
                                        <Button type="submit" size="icon" className="h-9 w-9" disabled={isUploading}>
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}

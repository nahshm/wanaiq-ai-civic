import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ChatWindowProps {
    chatId: string;
    type: 'direct' | 'group' | 'mod_mail';
}

export const ChatWindow = ({ chatId, type }: ChatWindowProps) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatDetails, setChatDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || !chatId) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                if (type === 'mod_mail') {
                    // Fetch mod mail messages without join
                    const { data: messagesData } = await supabase
                        .from('mod_mail_messages')
                        .select('*')
                        .eq('thread_id', chatId)
                        .order('created_at', { ascending: true });

                    // Fetch sender profiles separately
                    if (messagesData && messagesData.length > 0) {
                        const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))];
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('id, username, avatar_url')
                            .in('id', senderIds);

                        // Merge profiles into messages
                        const messagesWithProfiles = messagesData.map(msg => ({
                            ...msg,
                            sender: profiles?.find(p => p.id === msg.sender_id)
                        }));
                        setMessages(messagesWithProfiles);
                    } else {
                        setMessages(messagesData || []);
                    }

                    // Fetch thread details
                    const { data: thread } = await supabase
                        .from('mod_mail_threads')
                        .select(`*, community:communities(name)`)
                        .eq('id', chatId)
                        .single();
                    setChatDetails(thread);

                } else {
                    // Fetch regular chat messages without join
                    const { data: messagesData } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('room_id', chatId)
                        .order('created_at', { ascending: true });

                    // Fetch sender profiles separately
                    if (messagesData && messagesData.length > 0) {
                        const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))];
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('id, username, avatar_url')
                            .in('id', senderIds);

                        // Merge profiles into messages
                        const messagesWithProfiles = messagesData.map(msg => ({
                            ...msg,
                            sender: profiles?.find(p => p.id === msg.sender_id)
                        }));
                        setMessages(messagesWithProfiles);
                    } else {
                        setMessages(messagesData || []);
                    }

                    // Fetch room details
                    const { data: room } = await supabase
                        .from('chat_rooms')
                        .select('*')
                        .eq('id', chatId)
                        .single();
                    setChatDetails(room);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: type === 'mod_mail' ? 'mod_mail_messages' : 'chat_messages',
                    filter: `${type === 'mod_mail' ? 'thread_id' : 'room_id'}=eq.${chatId}`
                },
                (payload) => {
                    // Optimistically fetch the sender profile or just append if we have enough info
                    // For simplicity, re-fetching or appending with minimal info
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, type, user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            if (type === 'mod_mail') {
                await supabase.from('mod_mail_messages').insert({
                    thread_id: chatId,
                    sender_id: user.id,
                    content: newMessage,
                    is_internal: false
                });
            } else {
                await supabase.from('chat_messages').insert({
                    room_id: chatId,
                    sender_id: user.id,
                    content: newMessage
                });
            }
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (loading || !chatDetails) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-sidebar-background/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{chatDetails.name?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-bold">
                            {type === 'mod_mail'
                                ? `Mod Mail: ${chatDetails.subject}`
                                : chatDetails.name || 'Chat'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {type === 'mod_mail' ? `r/${chatDetails.community?.name}` : 'Active now'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {!isMe && (
                                        <Avatar className="w-8 h-8 mt-1">
                                            <AvatarImage src={msg.sender?.avatar_url} />
                                            <AvatarFallback>{msg.sender?.username?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        <div
                                            className={`p-3 rounded-2xl ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted text-foreground rounded-tl-none'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <div className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                                            {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : 'Sending...'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-sidebar-background">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

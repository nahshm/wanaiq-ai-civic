import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MessageSquare, Users, Shield, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatSidebarProps {
    activeTab: 'direct' | 'group' | 'mod_mail' | 'unread';
    onTabChange: (tab: 'direct' | 'group' | 'mod_mail' | 'unread') => void;
    onSelectChat: (chatId: string, type: 'direct' | 'group' | 'mod_mail') => void;
    selectedChatId?: string;
    onNewChat: () => void;
}

export const ChatSidebar = ({
    activeTab,
    onTabChange,
    onSelectChat,
    selectedChatId,
    onNewChat
}: ChatSidebarProps) => {
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchChats = async () => {
            setLoading(true);
            try {
                let data = [];

                if (activeTab === 'mod_mail') {
                    // Fetch mod mail threads
                    const { data: threads, error } = await supabase
                        .from('mod_mail_threads')
                        .select(`
              *,
              community:communities(name, avatar_url),
              messages:mod_mail_messages(count)
            `)
                        .order('updated_at', { ascending: false });

                    if (error) throw error;
                    data = threads || [];
                } else {
                    // Fetch regular chats
                    const { data: rooms, error } = await supabase
                        .from('chat_rooms')
                        .select(`
              *,
              participants:chat_participants(user_id, last_read_at)
            `)
                        .eq('type', activeTab === 'unread' ? 'direct' : activeTab) // Simplified for unread
                        .order('updated_at', { ascending: false });

                    if (error) throw error;
                    data = rooms || [];

                    // For direct chats, we need to fetch the other user's profile
                    if (activeTab === 'direct' || activeTab === 'unread') {
                        // This logic would be more complex in a real app to get the OTHER user's profile
                        // For now, we'll just assume we can get it or display a placeholder
                    }
                }

                setChats(data);
            } catch (error) {
                console.error('Error fetching chats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();

        // Realtime subscription would go here

    }, [user, activeTab]);

    return (
        <div className="w-80 border-r bg-sidebar-background flex flex-col h-full">
            <div className="p-4 border-b">
                <Button onClick={onNewChat} className="w-full justify-start gap-2" variant="outline">
                    <Plus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            <div className="flex p-2 gap-1 overflow-x-auto no-scrollbar border-b">
                <Button
                    variant={activeTab === 'direct' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onTabChange('direct')}
                    className="flex-1 text-xs"
                >
                    Direct
                </Button>
                <Button
                    variant={activeTab === 'group' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onTabChange('group')}
                    className="flex-1 text-xs"
                >
                    Group
                </Button>
                <Button
                    variant={activeTab === 'mod_mail' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onTabChange('mod_mail')}
                    className="flex-1 text-xs"
                >
                    Mod Mail
                </Button>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search chats..." className="pl-8" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {loading ? (
                        <div className="text-center p-4 text-muted-foreground text-sm">Loading...</div>
                    ) : chats.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground text-sm">
                            No chats found.
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat(chat.id, activeTab === 'mod_mail' ? 'mod_mail' : chat.type)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                                    selectedChatId === chat.id
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "hover:bg-sidebar-accent/50"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={activeTab === 'mod_mail' ? chat.community?.avatar_url : undefined} />
                                    <AvatarFallback>
                                        {activeTab === 'mod_mail' ? chat.community?.name?.charAt(0) : chat.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate">
                                            {activeTab === 'mod_mail' ? `r/${chat.community?.name}: ${chat.subject}` : chat.name || 'Chat'}
                                        </span>
                                        {/* Timestamp would go here */}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {activeTab === 'mod_mail' ? chat.status : 'Last message...'}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

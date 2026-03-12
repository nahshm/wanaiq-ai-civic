import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserSearchProps {
    onStartChat: (userId: string) => void;
}

export const UserSearch = ({ onStartChat }: UserSearchProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !user) return;

        setSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${query}%`)
                .neq('id', user.id) // Don't show self
                .limit(10);

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
            toast({
                title: "Error",
                description: "Failed to search users.",
                variant: "destructive",
            });
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users by username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button type="submit" disabled={searching}>
                    {searching ? 'Searching...' : 'Search'}
                </Button>
            </form>

            <div className="space-y-2">
                {results.length > 0 ? (
                    results.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={profile.avatar_url} />
                                    <AvatarFallback>{profile.username?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{profile.display_name || profile.username}</div>
                                    <div className="text-xs text-muted-foreground">@{profile.username}</div>
                                </div>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => onStartChat(profile.id)}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat
                            </Button>
                        </div>
                    ))
                ) : query && !searching ? (
                    <div className="text-center text-muted-foreground py-8">
                        No users found matching "{query}"
                    </div>
                ) : null}
            </div>
        </div>
    );
};

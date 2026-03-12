import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, X, ArrowRight, Users, User, MessageSquare, Briefcase, Target, FolderKanban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
    id: string;
    type: 'official' | 'promise' | 'project' | 'community' | 'user' | 'post' | 'comment';
    title: string;
    subtitle?: string;
    badge?: string;
    icon?: React.ReactNode;
}

interface GlobalSearchBarProps {
    className?: string;
    onClose?: () => void;
}

export const GlobalSearchBar = ({ className, onClose }: GlobalSearchBarProps) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent searches', e);
            }
        }
    }, []);

    // Fetch suggestions when query changes
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const results: SearchSuggestion[] = [];

                // Search communities
                const { data: communities } = await supabase
                    .from('communities')
                    .select('id, name, display_name, description, member_count')
                    .or(`name.ilike.%${query}%,display_name.ilike.%${query}%`)
                    .limit(2);

                if (communities) {
                    results.push(...communities.map(c => ({
                        id: c.id,
                        type: 'community' as const,
                        title: c.display_name || c.name,
                        subtitle: `${c.member_count || 0} members`,
                        badge: 'Community',
                        icon: <Users className="w-4 h-4" />
                    })));
                }

                // Search users
                const { data: users } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, bio')
                    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                    .limit(2);

                if (users) {
                    results.push(...users.map(u => ({
                        id: u.id,
                        type: 'user' as const,
                        title: u.display_name || u.username,
                        subtitle: u.bio || `@${u.username}`,
                        badge: 'User',
                        icon: <User className="w-4 h-4" />
                    })));
                }

                // Search posts
                const { data: posts } = await supabase
                    .from('posts')
                    .select('id, title, community:communities(name)')
                    .ilike('title', `%${query}%`)
                    .limit(2);

                if (posts) {
                    results.push(...posts.map(p => ({
                        id: p.id,
                        type: 'post' as const,
                        title: p.title,
                        subtitle: p.community ? `in c/${p.community.name}` : 'Post',
                        badge: 'Post',
                        icon: <MessageSquare className="w-4 h-4" />
                    })));
                }

                // Search officials
                const { data: officials } = await supabase
                    .from('officials')
                    .select('id, name, position, county')
                    .ilike('name', `%${query}%`)
                    .limit(2);

                if (officials) {
                    results.push(...officials.map(o => ({
                        id: o.id,
                        type: 'official' as const,
                        title: o.name,
                        subtitle: `${o.position} - ${o.county}`,
                        badge: 'Official',
                        icon: <Briefcase className="w-4 h-4" />
                    })));
                }

                // Search promises
                const { data: promises } = await supabase
                    .from('development_promises')
                    .select('id, title, status')
                    .ilike('title', `%${query}%`)
                    .limit(2);

                if (promises) {
                    results.push(...promises.map(p => ({
                        id: p.id,
                        type: 'promise' as const,
                        title: p.title,
                        subtitle: p.status,
                        badge: 'Promise',
                        icon: <Target className="w-4 h-4" />
                    })));
                }

                // Search projects
                const { data: projects } = await supabase
                    .from('government_projects')
                    .select('id, title, county, status')
                    .ilike('title', `%${query}%`)
                    .limit(2);

                if (projects) {
                    results.push(...projects.map(p => ({
                        id: p.id,
                        type: 'project' as const,
                        title: p.title,
                        subtitle: `${p.county} - ${p.status}`,
                        badge: 'Project',
                        icon: <FolderKanban className="w-4 h-4" />
                    })));
                }

                setSuggestions(results);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < suggestions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                        handleSelectSuggestion(suggestions[selectedIndex]);
                    } else if (query.length >= 2) {
                        handleSearch();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    onClose?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, suggestions, query]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveRecentSearch = (searchQuery: string) => {
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
        saveRecentSearch(suggestion.title);
        setIsOpen(false);
        onClose?.();

        // Navigate based on type
        switch (suggestion.type) {
            case 'official':
                navigate(`/g/${suggestion.id}`);
                break;
            case 'promise':
                navigate(`/pr/${suggestion.id}`);
                break;
            case 'project':
                navigate(`/p/${suggestion.id}`);
                break;
            case 'community':
                navigate(`/c/${suggestion.id}`);
                break;
            case 'user':
                navigate(`/u/${suggestion.id}`);
                break;
            case 'post':
                navigate(`/posts/${suggestion.id}`);
                break;
            case 'comment':
                navigate(`/posts/${suggestion.id}`);
                break;
        }
    };

    const handleSearch = () => {
        if (query.length >= 2) {
            saveRecentSearch(query);
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
            onClose?.();
        }
    };

    const handleRecentSearch = (search: string) => {
        setQuery(search);
        navigate(`/search?q=${encodeURIComponent(search)}`);
        setIsOpen(false);
        onClose?.();
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'Official': return 'bg-blue-500';
            case 'Promise': return 'bg-green-500';
            case 'Project': return 'bg-purple-500';
            case 'Community': return 'bg-orange-500';
            case 'User': return 'bg-pink-500';
            case 'Post': return 'bg-cyan-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className={cn('relative w-full', className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search everything... (Ctrl+K)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && query.length >= 2) {
                            handleSearch();
                        }
                    }}
                    className="pl-10 pr-10"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (query.length >= 2 || recentSearches.length > 0) && (
                <Card
                    ref={dropdownRef}
                    className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg"
                >
                    <CardContent className="p-0">
                        {/* Loading State */}
                        {loading && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Searching across platform...
                            </div>
                        )}

                        {/* Suggestions */}
                        {!loading && suggestions.length > 0 && (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
                                    Suggestions
                                </div>
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={`${suggestion.type}-${suggestion.id}`}
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        className={cn(
                                            'w-full px-3 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between gap-3',
                                            selectedIndex === index && 'bg-muted'
                                        )}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="text-muted-foreground">
                                                {suggestion.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{suggestion.title}</div>
                                                {suggestion.subtitle && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {suggestion.subtitle}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {suggestion.badge && (
                                                <Badge className={cn('text-white text-xs', getBadgeColor(suggestion.badge))}>
                                                    {suggestion.badge}
                                                </Badge>
                                            )}
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && query.length >= 2 && suggestions.length === 0 && (
                            <div className="p-8 text-center">
                                <div className="text-sm text-muted-foreground mb-2">
                                    No results found for "{query}"
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSearch}
                                    className="mt-2"
                                >
                                    Search all content
                                </Button>
                            </div>
                        )}

                        {/* Recent Searches */}
                        {!loading && query.length < 2 && recentSearches.length > 0 && (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        Recent Searches
                                    </span>
                                    <button
                                        onClick={clearRecentSearches}
                                        className="text-xs hover:text-foreground transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRecentSearch(search)}
                                        className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* View All Results */}
                        {!loading && query.length >= 2 && suggestions.length > 0 && (
                            <div className="border-t p-2">
                                <button
                                    onClick={handleSearch}
                                    className="w-full px-3 py-2 text-sm text-primary hover:bg-muted rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    View all results for "{query}"
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

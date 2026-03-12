import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Users, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { buildProfileLink } from '@/lib/profile-links';

export const QuickSearchDropdown = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: results, isLoading } = useSearch({
    query: debouncedQuery,
    type: 'all',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categorizedResults = {
    posts: results?.posts?.slice(0, 3) || [],
    users: results?.users?.slice(0, 2) || [],
    communities: results?.communities?.slice(0, 2) || [],
  };

  const hasResults = Object.values(categorizedResults).some(arr => arr.length > 0);

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Quick search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          className="pl-9 pr-9 bg-sidebar-background border-sidebar-border focus:border-civic-green/50 transition-colors"
          aria-label="Quick search"
          aria-expanded={isOpen}
          aria-controls="quick-search-results"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query && (
        <Card 
          id="quick-search-results"
          className="absolute top-full mt-2 w-full bg-sidebar-background border-sidebar-border shadow-lg max-h-96 overflow-y-auto z-50 animate-fade-in"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : hasResults ? (
            <div className="p-2 space-y-3">
              {/* Posts */}
              {categorizedResults.posts.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Posts
                  </div>
                  {categorizedResults.posts.map((post: any) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
                      onClick={() => setIsOpen(false)}
                      role="option"
                    >
                      <div className="text-sm font-medium line-clamp-1 group-hover:text-civic-green transition-colors">
                        {post.title}
                      </div>
                      {post.community && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          c/{post.community.name}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Users */}
              {categorizedResults.users.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Users
                  </div>
                  {categorizedResults.users.map((user: any) => (
                    <Link
                      key={user.id}
                      to={buildProfileLink({ username: user.username, is_verified: user.is_verified, official_position: user.official_position })}
                      className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
                      onClick={() => setIsOpen(false)}
                      role="option"
                    >
                      <div className="flex items-center gap-2">
                        {user.avatar_url && (
                          <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <div className="text-sm font-medium group-hover:text-civic-blue transition-colors">
                          u/{user.username}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Communities */}
              {categorizedResults.communities.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Communities
                  </div>
                  {categorizedResults.communities.map((community: any) => (
                    <Link
                      key={community.id}
                      to={`/c/${community.name}`}
                      className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
                      onClick={() => setIsOpen(false)}
                      role="option"
                    >
                      <div className="text-sm font-medium group-hover:text-civic-orange transition-colors">
                        c/{community.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {community.member_count} members
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* View All Results */}
              <Link
                to={`/search?q=${encodeURIComponent(query)}`}
                className="block px-3 py-2 text-center text-sm text-civic-green hover:bg-sidebar-accent rounded-lg transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all results →
              </Link>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

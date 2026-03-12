import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import { SearchQuickResults } from './SearchQuickResults';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export const SearchBar = ({ placeholder = "Search discussions, communities...", onSearch, className }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Use the new search hook for quick results
  const { data: quickResults, isLoading } = useSearch({
    query,
    type: 'all',
    limit: 5
  });

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (query.trim()) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);

      // Call optional callback
      onSearch?.(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="pl-10 pr-4 bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-ring transition-colors rounded-full"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setShowResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button 
          variant="secondary" 
          onClick={() => navigate('/civic-assistant')}
          className="rounded-full gap-2 px-4 shadow-sm hover:shadow-md transition-all bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border border-orange-200/50"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Ask</span>
        </Button>
      </div>

      {/* Quick Search Results Dropdown */}
      {showResults && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SearchQuickResults
              results={quickResults}
              query={query}
              onClose={() => setShowResults(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
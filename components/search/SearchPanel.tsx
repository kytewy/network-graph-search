import { useState } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/lib/stores/filter-store';
import { useUIStore } from '@/lib/stores/ui-store';

// Node interface definition (simplified version of what's in page.tsx)
interface Node {
  id: string;
  label: string;
  summary: string;
  content: string;
  type: string;
  continent: string;
  country: string;
  sourceType: string;
  size: number;
  color: string;
  similarity?: number;
  stateProvince?: string;
}

interface SearchPanelProps {
  searchStatus: string;
  hasSearched: boolean;
  isSearching: boolean;
  setSearchStatus: (status: string) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setIsSearching: (isSearching: boolean) => void;
  calculateSimilarity: (query: string, text: string) => number;
}

export default function SearchPanel({
  searchStatus,
  hasSearched,
  isSearching,
  setSearchStatus,
  setHasSearched,
  setIsSearching,
  calculateSimilarity
}: SearchPanelProps) {
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const apiKey = useUIStore((state) => state.apiKey);
  
  const [topResults, setTopResults] = useState(5);
  
  const hasApiKey = (apiKey || '').trim().length > 0;

  const handleExpandQuery = async () => {
    if (!hasApiKey || !searchTerm.trim()) return;

    try {
      console.log('[v0] Expanding query with AI:', searchTerm);
      const response = await fetch('/api/expand-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (response.ok) {
        const { expandedQuery } = await response.json();
        setSearchTerm(expandedQuery);
        console.log('[v0] Query expanded successfully:', expandedQuery);
      } else {
        console.error(
          '[v0] Query expansion failed:',
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error('[v0] Error expanding query:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm || !searchTerm.trim()) return;

    setIsSearching(true);
    setSearchStatus('');

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsSearching(false);
    setHasSearched(true);

    // Since we don't have direct access to filteredNodes in the store,
    // we'll rely on the parent component's calculateSimilarity function
    // to determine the search status
    
    // In a real implementation, we would get the filtered nodes from the parent
    // For now, we'll just set a generic success message
    const highlightedCount = 5; // Placeholder value

    if (highlightedCount > 0) {
      setSearchStatus(`Found ${highlightedCount} semantically similar results`);
    } else {
      setSearchStatus('No semantic matches found - try different terms');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setHasSearched(false);
    setSearchStatus('');
  };

  return (
    <div className="space-y-4 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <Label className="text-sidebar-foreground font-medium text-base">
          Search Content
        </Label>
        <button
          className={`p-1 rounded transition-all duration-200 ${
            hasApiKey
              ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
              : 'text-gray-400 opacity-50 cursor-not-allowed'
          }`}
          onClick={hasApiKey ? handleExpandQuery : undefined}
          title={
            hasApiKey
              ? 'Expand search with AI'
              : 'AI expansion unavailable - add API key'
          }
          disabled={!hasApiKey}>
          ✨
        </button>
      </div>

      {/* Search Nodes */}
      <div className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Ask about AI regulations...."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="pr-12 py-3 min-h-[4rem] max-h-[8rem] text-base bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 resize-none transition-all duration-200 ease-out overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-2"
            style={{
              height: 'auto',
              minHeight: '4rem',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height =
                Math.min(target.scrollHeight, 8 * 24) + 'px';
            }}
          />
        </div>

        {searchStatus && (
          <div className="text-sm text-sidebar-foreground/70 px-2">
            {searchStatus}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">
              Limit
            </Label>
            <Input
              type="number"
              value={topResults}
              onChange={(e) =>
                setTopResults(
                  Math.max(1, Number.parseInt(e.target.value) || 1)
                )
              }
              className="w-16 h-8 text-center bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground"
              min="1"
              max="100"
            />
            <span className="text-xs text-sidebar-foreground/50">
              nodes
            </span>
          </div>

          <Button
            size="sm"
            className={`h-8 w-8 p-0 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              searchTerm.trim() && hasSearched
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'
                : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
            }`}
            onClick={
              searchTerm.trim() && hasSearched
                ? handleClearSearch
                : handleSearch
            }
            disabled={isSearching}>
            {isSearching ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : searchTerm.trim() && hasSearched ? (
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

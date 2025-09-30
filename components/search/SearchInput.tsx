'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-state';

/**
 * SearchInput - Main search interface component
 * 
 * Provides:
 * - Search query input field
 * - Search button with loading state
 * - Result count control (topK parameter)
 * 
 * Uses app store for state management
 */
export function SearchInput() {
  // Get state and actions from app store
  const query = useAppStore((state) => state.query);
  const setQuery = useAppStore((state) => state.setQuery);
  const isLoading = useAppStore((state) => state.isLoading);
  const topK = useAppStore((state) => state.topK);
  const setTopK = useAppStore((state) => state.setTopK);
  const performSearch = useAppStore((state) => state.performSearch);

  // Handle search
  const handleSearch = () => {
    if (!query.trim()) return;
    performSearch(query, topK);
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Search</h2>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="Enter search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <span className="text-sm text-gray-600">Results to fetch:</span>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTopK(Math.max(5, topK - 5))}
              disabled={topK <= 5}
              className="h-8 w-8 p-0">
              -
            </Button>
            <span className="mx-2 font-medium">{topK}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTopK(topK + 5)}
              className="h-8 w-8 p-0">
              +
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

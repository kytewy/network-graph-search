'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-state';
import { SEARCH_CONFIG } from '@/lib/config/search-config';

/**
 * SearchResults component
 * Displays search results in a list format with details
 */
export function SearchResults() {
  const [isClient, setIsClient] = useState(false);

  // Get state from app store - MUST be called before conditional returns
  const searchResults = useAppStore((state) => state.searchResults);
  const filteredResults = useAppStore((state) => state.filteredResults);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  // If no search results, don't render anything
  const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
  const safeFilteredResults = Array.isArray(filteredResults) ? filteredResults : [];
  
  if (safeSearchResults.length === 0) {
    return null;
  }

  return (
    <Card className={`p-4 overflow-auto ${SEARCH_CONFIG.RESULTS.MAX_HEIGHT}`}>
      <h3 className="text-lg font-semibold mb-2">
        Search Results: {safeFilteredResults.length} of {safeSearchResults.length}
      </h3>
      {safeFilteredResults.map((result, index) => (
        <div key={result.id} className="mb-4 p-3 border rounded">
          <div className="flex justify-between">
            <span className="font-semibold">
              #{index + 1} - {result.label || result.id}
            </span>
            <span className="text-sm bg-blue-100 px-2 py-1 rounded">
              Score: {result.score ? result.score.toFixed(SEARCH_CONFIG.RESULTS.SCORE_DECIMAL_PLACES) : 'N/A'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Category: {result.category || 'Unknown'} | Type:{' '}
            {result.type || 'Unknown'}
          </div>
          <p className="mt-2 text-sm">
            {result.text?.substring(0, SEARCH_CONFIG.CONTENT_PREVIEW_LENGTH) ||
              result.content?.substring(0, SEARCH_CONFIG.CONTENT_PREVIEW_LENGTH) ||
              'No content available'}
            ...
          </p>
        </div>
      ))}
    </Card>
  );
}

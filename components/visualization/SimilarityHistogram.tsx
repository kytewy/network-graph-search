'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-state';

/**
 * SimilarityHistogram component
 * Displays a histogram of search results by similarity ranges
 * Allows filtering results by clicking on bars
 */
export function SimilarityHistogram() {
  const searchResults = useAppStore((state) => state.searchResults);
  const selectedSimilarityRanges = useAppStore(
    (state) => state.selectedSimilarityRanges
  );
  const toggleSimilarityRange = useAppStore(
    (state) => state.toggleSimilarityRange
  );
  const clearSimilarityRanges = useAppStore(
    (state) => state.clearSimilarityRanges
  );

  // Generate histogram data from search results
  const histogramData = useMemo(() => {
    const ranges = [
      { range: '<20', min: 0, max: 19 },
      { range: '21-40', min: 20, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    // Always show bars if we have nodes
    if (!searchResults || searchResults.length === 0) {
      // Return minimal width bars (15%) when no results are available
      return ranges.map(({ range, min, max }) => ({
        range,
        count: 0,
        width: 15,
        min,
        max,
      }));
    }

    // Calculate based on search results using vector search scores
    const processedResults = searchResults.map((node) => {
      // Handle different score formats:
      // 1. _score from Pinecone API (already between 0-1)
      // 2. score from processed results (already between 0-1)
      // 3. similarity from other sources (already between 0-1)
      const similarity = node._score || node.score || node.similarity || 0;

      return {
        ...node,
        // Convert to percentage (0-100)
        searchSimilarity: Math.round(similarity * 100),
      };
    });

    // Calculate counts for each range
    const rangeCounts = ranges.map(({ range, min, max }) => {
      const count = processedResults.filter((node) => {
        const similarity = node.searchSimilarity;
        return similarity >= min && similarity <= max;
      }).length;
      return { range, count, min, max };
    });

    // Find the maximum count across all ranges
    const maxCount = Math.max(
      ...rangeCounts.map((item) => item.count),
      1 // Ensure we don't divide by zero
    );

    // Calculate widths based on the maximum count
    return rangeCounts.map(({ range, count, min, max }) => {
      // If count is 0, show a minimal bar width (15%)
      // Otherwise, scale the width based on the proportion of the maximum count
      const width = count === 0 ? 15 : Math.max(15, (count / maxCount) * 100);
      return { range, count, width, min, max };
    });
  }, [searchResults]);

  // If no search results, don't render anything
  if (searchResults.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-2">Filter by Similarity</h2>
      <p className="text-sm text-gray-600 mb-3">
        Click on bars to filter results by similarity score.
        {selectedSimilarityRanges.length === 0
          ? ' Currently showing all results.'
          : ` Currently filtering by: ${selectedSimilarityRanges.join(', ')}`}
      </p>
      
      {/* Histogram visualization */}
      <div className="w-full">
        <div className="space-y-2">
          {histogramData.map((bar) => (
            <div key={bar.range} className="flex items-center gap-3">
              <div className="w-16 text-xs text-gray-600 text-right">
                {bar.range}%
              </div>
              <div className="flex-1 relative">
                <div
                  className={`h-6 rounded cursor-pointer transition-all duration-200 flex items-center justify-end pr-2 ${
                    selectedSimilarityRanges.includes(bar.range)
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-md'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  style={{ width: `${bar.width}%` }}
                  onClick={() => toggleSimilarityRange(bar.range)}>
                  {bar.count > 0 && (
                    <span className="text-xs font-medium text-white">
                      {bar.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Range selection buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['<20', '21-40', '41-60', '61-80', '81-100'].map((range) => (
          <Button
            key={range}
            variant={
              selectedSimilarityRanges.includes(range)
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => toggleSimilarityRange(range)}
            className="text-xs">
            {range}%
          </Button>
        ))}
        {selectedSimilarityRanges.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearSimilarityRanges()}
            className="text-xs ml-auto">
            Clear Filters
          </Button>
        )}
      </div>
    </Card>
  );
}

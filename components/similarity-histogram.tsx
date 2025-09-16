"use client"

import { useMemo } from "react"
import { useUnifiedSearchStore } from "@/lib/stores/unified-search-store"

interface SimilarityHistogramProps {
  filteredNodes: any[]
}

const SimilarityHistogram = ({
  filteredNodes,
}: SimilarityHistogramProps) => {
  // Get state from unified search store
  const searchTerm = useUnifiedSearchStore((state) => state.searchTerm);
  const hasSearched = useUnifiedSearchStore((state) => state.hasSearched);
  const selectedSimilarityRange = useUnifiedSearchStore((state) => state.selectedSimilarityRange);
  const toggleSimilarityRange = useUnifiedSearchStore((state) => state.toggleSimilarityRange);
  const searchResultNodes = useUnifiedSearchStore((state) => state.searchResultNodes);
  const searchMode = useUnifiedSearchStore((state) => state.searchMode);
  
  const histogramData = useMemo(() => {
    const ranges = [
      { range: "<20", min: 0, max: 19 },
      { range: "21-40", min: 20, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-80", min: 61, max: 80 },
      { range: "81-100", min: 81, max: 100 },
    ]

    // Use search result nodes if available (from vector search), otherwise use filtered nodes
    const nodesToUse = searchMode === 'semantic' && searchResultNodes && searchResultNodes.length > 0 
      ? searchResultNodes 
      : filteredNodes;
      
    // Always show bars if we have nodes, even without a search term
    if (!nodesToUse || nodesToUse.length === 0) {
      // Return minimal width bars (15%) when no results are available
      return ranges.map(({ range, min, max }) => ({ range, count: 0, width: 15, min, max }))
    }

    // Calculate based on search results using vector search scores
    const searchResults = nodesToUse.map((node) => {
      // Handle different score formats:
      // 1. _score from Pinecone API (already between 0-1)
      // 2. score from processed results (already between 0-1)
      // 3. similarity from other sources (already between 0-1)
      const similarity = node._score || node.score || node.similarity || 0;
      
      return {
        ...node,
        // Convert to percentage (0-100)
        searchSimilarity: Math.round(similarity * 100)
      };
    })

    console.log('Search results with similarity scores:', searchResults);

    // Calculate counts for each range
    const rangeCounts = ranges.map(({ range, min, max }) => {
      const count = searchResults.filter((node) => {
        const similarity = node.searchSimilarity;
        return similarity >= min && similarity <= max;
      }).length;
      return { range, count, min, max };
    });
    
    console.log('Range counts:', rangeCounts);
    
    // Find the maximum count across all ranges
    const maxCount = Math.max(
      ...rangeCounts.map(item => item.count),
      1 // Ensure we don't divide by zero
    );
    
    // Calculate widths based on the maximum count
    return rangeCounts.map(({ range, count, min, max }) => {
      // If count is 0, show a minimal bar width (15%)
      // Otherwise, scale the width based on the proportion of the maximum count
      const width = count === 0 ? 15 : Math.max(15, (count / maxCount) * 100);
      return { range, count, width, min, max }
    })
  }, [searchTerm, filteredNodes, hasSearched, searchResultNodes])

  const handleSimilarityRangeClick = (range: string) => {
    toggleSimilarityRange(range);
  }

  return (
    <div className="w-full">
      <div className="space-y-2">
        {histogramData.map((bar) => (
          <div key={bar.range} className="flex items-center gap-3">
            <div className="w-16 text-xs text-gray-600 text-right">{bar.range}%</div>
            <div className="flex-1 relative">
              <div
                className={`h-6 rounded cursor-pointer transition-all duration-200 flex items-center justify-end pr-2 ${
                  selectedSimilarityRange.includes(bar.range)
                    ? "bg-purple-600 hover:bg-purple-700 shadow-md"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                style={{ width: `${bar.width}%` }}
                onClick={() => handleSimilarityRangeClick(bar.range)}
              >
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
  )
}

export default SimilarityHistogram
export { SimilarityHistogram }

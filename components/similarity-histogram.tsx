"use client"

import { useMemo } from "react"
import { useUnifiedSearchStore } from "@/lib/stores/unified-search-store"

interface SimilarityHistogramProps {
  filteredNodes: any[]
  calculateSimilarity: (text1: string, text2: string) => number
}

const SimilarityHistogram = ({
  filteredNodes,
  calculateSimilarity,
}: SimilarityHistogramProps) => {
  // Get state from unified search store
  const searchTerm = useUnifiedSearchStore((state) => state.searchTerm);
  const hasSearched = useUnifiedSearchStore((state) => state.hasSearched);
  const selectedSimilarityRange = useUnifiedSearchStore((state) => state.selectedSimilarityRange);
  const toggleSimilarityRange = useUnifiedSearchStore((state) => state.toggleSimilarityRange);
  const histogramData = useMemo(() => {
    const ranges = [
      { range: "<20", min: 0, max: 19 },
      { range: "21-40", min: 21, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-80", min: 61, max: 80 },
      { range: "81-100", min: 81, max: 100 },
    ]

    // Always show bars if we have nodes, even without a search term
    if (filteredNodes.length === 0) {
      return ranges.map(({ range }) => ({ range, count: 0, width: 0, min: 0, max: 0 }))
    }

    // Calculate based on search results or use existing similarity
    const searchResults = filteredNodes.map((node) => {
      // If node already has similarity, use it; otherwise calculate
      const similarity = node.similarity !== undefined
        ? node.similarity
        : calculateSimilarity(searchTerm || "test query", node.text || node.summary || "");
      
      return {
        ...node,
        searchSimilarity: Math.round(similarity * 100)
      };
    })

    // Calculate counts for each range
    const rangeCounts = ranges.map(({ range, min, max }) => {
      const count = searchResults.filter((node) => node.searchSimilarity >= min && node.searchSimilarity <= max).length;
      return { range, count, min, max };
    });
    
    // Find the maximum count across all ranges
    const maxCount = Math.max(
      ...rangeCounts.map(item => item.count),
      1 // Ensure we don't divide by zero
    );
    
    // Calculate widths based on the maximum count
    return rangeCounts.map(({ range, count, min, max }) => {
      // If count is 0, show a minimal bar width (5%)
      // Otherwise, scale the width based on the proportion of the maximum count
      const width = count === 0 ? 5 : Math.max(10, (count / maxCount) * 100);
      return { range, count, width, min, max }
    })
  }, [searchTerm, filteredNodes, hasSearched, calculateSimilarity])

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
                className={`h-6 rounded cursor-pointer transition-all duration-200 ${
                  selectedSimilarityRange.includes(bar.range)
                    ? "bg-purple-600 hover:bg-purple-700 shadow-md"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                style={{ width: `${bar.width}%` }}
                onClick={() => handleSimilarityRangeClick(bar.range)}
              />
            </div>
            <div className="w-8 text-xs text-left">
              <span
                className={
                  selectedSimilarityRange.includes(bar.range) ? "text-purple-600 font-medium" : "text-gray-500"
                }
              >
                {bar.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimilarityHistogram
export { SimilarityHistogram }

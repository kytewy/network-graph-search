"use client"

import { useMemo } from "react"

interface SimilarityHistogramProps {
  searchTerm: string
  filteredNodes: any[]
  hasSearched: boolean
  calculateSimilarity: (text1: string, text2: string) => number
  selectedSimilarityRange?: string[]
  onSimilarityRangeClick?: (range: string) => void
}

const SimilarityHistogram = ({
  searchTerm,
  filteredNodes,
  hasSearched,
  calculateSimilarity,
  selectedSimilarityRange = [],
  onSimilarityRangeClick,
}: SimilarityHistogramProps) => {
  const histogramData = useMemo(() => {
    const ranges = [
      { range: "<20", min: 0, max: 19 },
      { range: "21-40", min: 21, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-80", min: 61, max: 80 },
      { range: "81-100", min: 81, max: 100 },
    ]

    // If no search term, return zero bars
    if (!searchTerm.trim() || !hasSearched) {
      return ranges.map(({ range }) => ({ range, count: 0, width: 0, min: 0, max: 0 }))
    }

    // Calculate based on search results
    const searchResults = filteredNodes.map((node) => ({
      ...node,
      searchSimilarity: Math.round(calculateSimilarity(searchTerm, node.text || node.summary || "") * 100),
    }))

    return ranges.map(({ range, min, max }) => {
      const count = searchResults.filter((node) => node.searchSimilarity >= min && node.searchSimilarity <= max).length
      const maxCount = Math.max(
        ...ranges.map(
          (r) =>
            searchResults.filter((node) => node.searchSimilarity >= r.min && node.searchSimilarity <= r.max).length,
        ),
        1,
      )
      const width = Math.max(10, (count / maxCount) * 100) // Width percentage
      return { range, count, width, min, max }
    })
  }, [searchTerm, filteredNodes, hasSearched, calculateSimilarity])

  const handleSimilarityRangeClick = (range: string) => {
    if (onSimilarityRangeClick) {
      onSimilarityRangeClick(range)
    }
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

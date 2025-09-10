"use client"

import { useMemo } from "react"
import { useDebouncedCallback } from "use-debounce"

export interface SimilarityResult {
  calculateSimilarity: (query: string, text: string) => number
  adjustNodeSize: (node: any, similarity: number) => any
}

export function useSimilarityCalculation(): SimilarityResult {
  const calculateSimilarity = useDebouncedCallback((query: string, text: string): number => {
    if (!query || !text) return 0

    const queryWords = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0),
    )
    const textWords = new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0),
    )

    const intersection = new Set([...queryWords].filter((word) => textWords.has(word)))
    const union = new Set([...queryWords, ...textWords])

    return union.size === 0 ? 0 : (intersection.size / union.size) * 100
  }, 100)

  const adjustNodeSize = useMemo(
    () => (node: any, similarity: number) => {
      const baseSize = 20
      const maxSize = 40
      const sizeMultiplier = 1 + similarity / 100
      const adjustedSize = Math.min(baseSize * sizeMultiplier, maxSize)

      return {
        ...node,
        size: adjustedSize,
        similarity,
      }
    },
    [],
  )

  return {
    calculateSimilarity: calculateSimilarity.callback,
    adjustNodeSize,
  }
}

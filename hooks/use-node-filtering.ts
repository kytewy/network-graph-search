"use client"

import { useState, useEffect, useMemo } from "react"
import { useNetworkStore } from "@/lib/stores/network-store"
import { useFilterStore } from "@/lib/stores/filter-store"
import { useDebouncedCallback } from "use-debounce"

export interface FilteredData {
  filteredNodes: any[]
  filteredLinks: any[]
  isFiltering: boolean
}

export function useNodeFiltering(): FilteredData {
  const nodes = useNetworkStore((state) => state.nodes)
  const links = useNetworkStore((state) => state.links)

  const searchTerm = useFilterStore((state) => state.searchTerm)
  const selectedNodeTypes = useFilterStore((state) => state.selectedNodeTypes)
  const selectedContinents = useFilterStore((state) => state.selectedContinents)
  const selectedCountries = useFilterStore((state) => state.selectedCountries)
  const selectedSourceTypes = useFilterStore((state) => state.selectedSourceTypes)
  const minSimilarity = useFilterStore((state) => state.minSimilarity)
  const maxSimilarity = useFilterStore((state) => state.maxSimilarity)

  const [filteredNodes, setFilteredNodes] = useState(nodes)
  const [isFiltering, setIsFiltering] = useState(false)

  const debouncedFilter = useDebouncedCallback(() => {
    setIsFiltering(true)

    let filtered = [...nodes]

    // Text search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (node) =>
          node.label?.toLowerCase().includes(searchLower) ||
          node.content?.toLowerCase().includes(searchLower) ||
          node.summary?.toLowerCase().includes(searchLower),
      )
    }

    // Node type filtering
    if (selectedNodeTypes.length > 0) {
      filtered = filtered.filter((node) => selectedNodeTypes.includes(node.type))
    }

    // Geographic filtering - continent level
    if (selectedContinents.length > 0) {
      filtered = filtered.filter((node) => selectedContinents.includes(node.continent))
    }

    // Geographic filtering - country level
    if (selectedCountries.length > 0) {
      filtered = filtered.filter((node) => selectedCountries.includes(node.country))
    }

    // Source type filtering
    if (selectedSourceTypes.length > 0) {
      filtered = filtered.filter((node) => selectedSourceTypes.includes(node.sourceType))
    }

    // Similarity filtering
    if (minSimilarity > 0 || maxSimilarity < 100) {
      filtered = filtered.filter((node) => {
        const similarity = node.similarity || 0
        return similarity >= minSimilarity && similarity <= maxSimilarity
      })
    }

    setFilteredNodes(filtered)
    setIsFiltering(false)
  }, 300)

  useEffect(() => {
    debouncedFilter()
  }, [
    searchTerm,
    selectedNodeTypes,
    selectedContinents,
    selectedCountries,
    selectedSourceTypes,
    minSimilarity,
    maxSimilarity,
    nodes,
    debouncedFilter,
  ])

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((node) => node.id))
    return links.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
  }, [filteredNodes, links])

  return {
    filteredNodes,
    filteredLinks,
    isFiltering,
  }
}

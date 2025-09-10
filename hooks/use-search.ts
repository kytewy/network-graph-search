"use client"

import { useState, useCallback, useEffect } from "react"
import { useFilterStore } from "@/lib/stores/filter-store"

interface UseSearchReturn {
  // State
  searchTerm: string
  isSearching: boolean
  searchHistory: string[]
  searchStatus: "idle" | "searching" | "success" | "error"

  // Handlers
  setSearchTerm: (term: string) => void
  handleSearch: () => void
  handleClear: () => void
  addToHistory: (term: string) => void
  removeFromHistory: (term: string) => void
  clearHistory: () => void
}

export function useSearch(): UseSearchReturn {
  // Zustand store selectors
  const searchTerm = useFilterStore((state) => state.searchTerm)
  const setSearchTermStore = useFilterStore((state) => state.setSearchTerm)

  // Local state
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "success" | "error">("idle")
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Debounced search term setter
  const setSearchTerm = useCallback(
    (term: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const timer = setTimeout(() => {
        setSearchTermStore(term)
      }, 300)

      setDebounceTimer(timer)
    },
    [debounceTimer, setSearchTermStore],
  )

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setSearchStatus("searching")

    // Add to history
    addToHistory(searchTerm.trim())

    // Simulate search completion
    setTimeout(() => {
      setIsSearching(false)
      setSearchStatus("success")
    }, 500)
  }, [searchTerm])

  // Clear handler
  const handleClear = useCallback(() => {
    setSearchTermStore("")
    setIsSearching(false)
    setSearchStatus("idle")
  }, [setSearchTermStore])

  // History management
  const addToHistory = useCallback((term: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== term)
      return [term, ...filtered].slice(0, 5) // Max 5 items
    })
  }, [])

  const removeFromHistory = useCallback((term: string) => {
    setSearchHistory((prev) => prev.filter((item) => item !== term))
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    searchTerm,
    isSearching,
    searchHistory,
    searchStatus,
    setSearchTerm,
    handleSearch,
    handleClear,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}

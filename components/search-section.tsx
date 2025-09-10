"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, Sparkles, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearch } from "@/hooks/use-search"

interface SearchSectionProps {
  onSearch?: (query: string) => void
  onExpandQuery?: (query: string) => void
  hasApiKey?: boolean
  resultLimit?: number
  onResultLimitChange?: (limit: number) => void
}

export function SearchSection({
  onSearch,
  onExpandQuery,
  hasApiKey = false,
  resultLimit = 10,
  onResultLimitChange,
}: SearchSectionProps) {
  const { searchTerm, isSearching, searchHistory, searchStatus, setSearchTerm, handleSearch, handleClear } = useSearch()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const scrollHeight = Math.max(64, Math.min(128, textarea.scrollHeight)) // 4rem to 8rem
      textarea.style.height = `${scrollHeight}px`
    }
  }, [localSearchTerm])

  // Handle search execution
  const executeSearch = () => {
    if (localSearchTerm.trim()) {
      setSearchTerm(localSearchTerm)
      handleSearch()
      onSearch?.(localSearchTerm)
    }
  }

  // Handle clear
  const executeClear = () => {
    setLocalSearchTerm("")
    handleClear()
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      executeSearch()
    }
  }

  // Handle AI expand
  const handleExpandQuery = () => {
    if (localSearchTerm.trim() && hasApiKey) {
      onExpandQuery?.(localSearchTerm)
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-sidebar-foreground font-medium text-base">Search Content</Label>

      {/* Search Input */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes by content, labels, or descriptions..."
            className="min-h-16 max-h-32 resize-none rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            style={{ minHeight: "4rem", maxHeight: "8rem" }}
          />
        </div>

        {/* Search Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={localSearchTerm.trim() ? executeSearch : executeClear}
            disabled={isSearching}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : localSearchTerm.trim() ? (
              <Search className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {isSearching ? "Searching..." : localSearchTerm.trim() ? "Search" : "Clear"}
          </Button>

          <Button
            onClick={handleExpandQuery}
            disabled={!hasApiKey || !localSearchTerm.trim() || isSearching}
            variant="outline"
            className="rounded-lg px-3 py-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 bg-transparent"
            title={!hasApiKey ? "API key required for query expansion" : "Expand query with AI"}
          >
            <Sparkles className={`h-4 w-4 ${hasApiKey ? "text-purple-600" : "text-gray-400"}`} />
          </Button>
        </div>

        {/* Result Limit Controls */}
        <div className="flex items-center gap-3">
          <Label htmlFor="result-limit" className="text-sm text-gray-600">
            Result Limit:
          </Label>
          <Input
            id="result-limit"
            type="number"
            min="1"
            max="100"
            value={resultLimit}
            onChange={(e) => onResultLimitChange?.(Number.parseInt(e.target.value) || 10)}
            className="w-20 h-8 rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Recent Searches:</Label>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSearchTerm(term)}
                  className="text-xs rounded-full bg-gray-50 hover:bg-gray-100 border-gray-200"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Status */}
        {searchStatus === "error" && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">Search failed. Please try again.</div>
        )}
      </div>
    </div>
  )
}

'use client';

/**
 * SearchPanel Component
 * 
 * This component provides the main search interface for the network graph application.
 * It allows users to search for nodes, filter results by similarity score,
 * and adjust the number of results to display.
 */

import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SimilarityHistogram from '@/components/similarity-histogram';
import { useUnifiedSearchStore } from '@/lib/stores/unified-search-store';
import { useUIStore } from '@/lib/stores/ui-store';

// Node interface definition (simplified version of what's in page.tsx)
interface Node {
  id: string;
  label: string;
  summary: string;
  content: string;
  type: string;
  continent: string;
  country: string;
  sourceType: string;
  size: number;
  color: string;
  similarity?: number;
  score?: number;  // Added score field to match API response format
  stateProvince?: string;
}

export default function SearchPanel() {
  /**
   * Component State
   * 
   * Local state for managing UI elements and processed search results
   */
  const [processedResults, setProcessedResults] = useState<any[]>([]);  // Using any[] to avoid type conflicts
  const [filteredNodes, setFilteredNodes] = useState<any[]>([]);        // Using any[] to avoid type conflicts
  
  /**
   * Store Connections
   * 
   * Connect to global state via unified search store and UI store
   */
  // Search parameters and status
  const searchTerm = useUnifiedSearchStore((state) => state.searchTerm);
  const setSearchTerm = useUnifiedSearchStore((state) => state.setSearchTerm);
  const searchStatus = useUnifiedSearchStore((state) => state.searchStatus);
  const hasSearched = useUnifiedSearchStore((state) => state.hasSearched);
  const isSearching = useUnifiedSearchStore((state) => state.isSearching);
  const topResults = useUnifiedSearchStore((state) => state.topResults);
  const setSearchStatus = useUnifiedSearchStore((state) => state.setSearchStatus);
  const setHasSearched = useUnifiedSearchStore((state) => state.setHasSearched);
  const setIsSearching = useUnifiedSearchStore((state) => state.setIsSearching);
  const setTopResults = useUnifiedSearchStore((state) => state.setTopResults);
  const addToSearchHistory = useUnifiedSearchStore((state) => state.addToSearchHistory);
  
  // Search results and filtering - use selectors to avoid unnecessary re-renders
  const searchResultNodes = useUnifiedSearchStore((state) => state.searchResultNodes); // Don't provide default here
  const selectedSimilarityRange = useUnifiedSearchStore((state) => state.selectedSimilarityRange); // Don't provide default here
  const toggleSimilarityRange = useUnifiedSearchStore((state) => state.toggleSimilarityRange);
  
  // API key for AI query expansion
  const apiKey = useUIStore((state) => state.apiKey);
  const hasApiKey = (apiKey || '').trim().length > 0;
  
  /**
   * Effect: Filter Results by Similarity
   * 
   * When search results or selected similarity ranges change,
   * filter the nodes accordingly and update local state
   */
  useEffect(() => {
    // Guard against undefined values that could cause infinite loops
    const safeSearchNodes = searchResultNodes || [];
    const safeRanges = selectedSimilarityRange || [];
    
    // Create a copy of the array to avoid reference issues
    let nodes = [...safeSearchNodes];
    
    // Only apply filtering if we have results
    if (nodes.length > 0 && safeRanges.length > 0) {
      // Apply similarity range filters
      nodes = nodes.filter((node) => {
        // Calculate similarity percentage (0-100)
        const similarity = Math.round((node.score || node.similarity || 0) * 100);
        
        // Check if the node's similarity falls within any selected range
        return safeRanges.some(range => {
          switch (range) {
            case '<20': return similarity >= 0 && similarity <= 19;
            case '21-40': return similarity >= 20 && similarity <= 40;
            case '41-60': return similarity >= 41 && similarity <= 60;
            case '61-80': return similarity >= 61 && similarity <= 80;
            case '81-100': return similarity >= 81 && similarity <= 100;
            default: return false;
          }
        });
      });
    }
    
    // Update local state with filtered and processed results
    setFilteredNodes(nodes as any[]);
    
    // Only update processedResults if searchResultNodes has changed
    // This prevents unnecessary re-renders
    // Use JSON.stringify for deep comparison to avoid reference issues
    if (JSON.stringify(safeSearchNodes) !== JSON.stringify(processedResults)) {
      setProcessedResults(safeSearchNodes as any[]);
    }
  }, [searchResultNodes, selectedSimilarityRange, processedResults]);  // Include processedResults to prevent unnecessary updates

  /**
   * Handler: Expand Query with AI
   * 
   * Uses the AI API to expand the search query with related terms
   * Only works if an API key is provided
   */
  const handleExpandQuery = async () => {
    // Early return if no API key or empty query
    if (!hasApiKey || !searchTerm.trim()) return;

    try {
      console.log('[v0] Expanding query with AI:', searchTerm);
      
      // Call the expand-query API
      const response = await fetch('/api/expand-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (response.ok) {
        // Update search term with expanded query
        const { expandedQuery } = await response.json();
        setSearchTerm(expandedQuery);
        console.log('[v0] Query expanded successfully:', expandedQuery);
      } else {
        console.error(
          '[v0] Query expansion failed:',
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error('[v0] Error expanding query:', error);
    }
  };

  /**
   * Handler: Perform Search
   * 
   * Executes the vector search using the unified search store
   */
  const handleSearch = async () => {
    // Early return if empty query
    if (!searchTerm || !searchTerm.trim()) return;

    try {
      // Use the performVectorSearch function from the unified search store
      // This will update searchResultNodes when complete
      await useUnifiedSearchStore.getState().performVectorSearch(searchTerm, topResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Handler: Clear Search
   * 
   * Resets the search state and clears results
   */
  const handleClearSearch = () => {
    // Reset all search-related state
    useUnifiedSearchStore.getState().clearSearch();
    
    // Clear local state in a single batch to avoid multiple re-renders
    setTimeout(() => {
      setProcessedResults([]);
      setFilteredNodes([]);
    }, 0);
  };

  /**
   * Component Rendering
   */
  return (
    <div className="space-y-4 rounded-lg p-4 bg-white">
      {/* Header with Search Label and AI Expansion Button */}
      <div className="flex items-center justify-between">
        <Label className="text-sidebar-foreground font-medium text-base">
          Search Content
        </Label>
        <button
          className={`p-1 rounded transition-all duration-200 ${
            hasApiKey
              ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
              : 'text-gray-400 opacity-50 cursor-not-allowed'
          }`}
          onClick={hasApiKey ? handleExpandQuery : undefined}
          title={
            hasApiKey
              ? 'Expand search with AI'
              : 'AI expansion unavailable - add API key'
          }
          disabled={!hasApiKey}>
          ✨
        </button>
      </div>

      {/* Search Input Area */}
      <div className="space-y-4">
        {/* Search Textarea with Auto-resize */}
        <div className="relative">
          <Textarea
            placeholder="Ask about AI regulations...."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="pr-12 py-3 min-h-[4rem] max-h-[8rem] text-base bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 resize-none transition-all duration-200 ease-out overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-2"
            style={{
              height: 'auto',
              minHeight: '4rem',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height =
                Math.min(target.scrollHeight, 8 * 24) + 'px';
            }}
          />
        </div>

        {/* Search Status Message */}
        {searchStatus && (
          <div className="text-sm text-sidebar-foreground/70 px-2">
            {searchStatus}
          </div>
        )}

        {/* Results Limit Control and Search Button */}
        <div className="flex items-center justify-between gap-2">
          {/* Results Limit Controls */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">
              Limit
            </Label>
            <div className="flex items-center">
              {/* Decrement Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTopResults(Math.max(5, topResults - 5))}
                disabled={topResults <= 5}
                className="h-8 w-8 p-0 bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground"
                aria-label="Decrease result limit"
              >
                -
              </Button>
              
              {/* Result Count Input */}
              <Input
                type="number"
                value={topResults}
                onChange={(e) =>
                  setTopResults(
                    Math.max(1, Number.parseInt(e.target.value) || 1)
                  )
                }
                className="w-16 h-8 text-center bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground"
                min="1"
                max="100"
                aria-label="Number of results to fetch"
              />
              
              {/* Increment Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTopResults(topResults + 5)}
                className="h-8 w-8 p-0 bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground"
                aria-label="Increase result limit"
              >
                +
              </Button>
            </div>
            <span className="text-xs text-sidebar-foreground/50">
              nodes
            </span>
          </div>

          {/* Search/Clear Button with Dynamic State */}
          <Button
            size="sm"
            className={`h-8 w-8 p-0 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              searchTerm.trim() && hasSearched
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'
                : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
            }`}
            onClick={
              searchTerm.trim() && hasSearched
                ? handleClearSearch
                : handleSearch
            }
            disabled={isSearching}
            aria-label={searchTerm.trim() && hasSearched ? 'Clear search' : 'Search'}
          >
            {/* Button Icon: Loading Spinner, Reset Icon, or Search Icon */}
            {isSearching ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : searchTerm.trim() && hasSearched ? (
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Similarity Histogram Section */}
      {hasSearched && processedResults && processedResults.length > 0 && (
        <div className="mt-4 space-y-3">
          {/* Histogram Header */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sidebar-foreground" />
            <Label className="text-sidebar-foreground font-medium text-sm">
              Vector Similarity Distribution
            </Label>
          </div>
          
          {/* Histogram Card */}
          <Card className="p-3 bg-white border-sidebar-border">
            {/* Histogram Visualization Component */}
            <SimilarityHistogram filteredNodes={processedResults || []} />
            
            {/* Filter Status and Controls */}
            <div className="mt-3 text-xs text-sidebar-foreground/70">
              {selectedSimilarityRange.length > 0 ? (
                <div className="flex justify-between">
                  {/* Filter Status */}
                  <span>Filtered: {filteredNodes?.length || 0} of {processedResults?.length || 0}</span>
                  
                  {/* Clear Filters Button */}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-5 p-0 text-xs text-sidebar-foreground/70"
                    onClick={() => {
                      // Clear all selected ranges
                      (selectedSimilarityRange || []).forEach(range => toggleSimilarityRange(range));
                    }}
                    aria-label="Clear similarity filters"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <span>Click on bars to filter by similarity score</span>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

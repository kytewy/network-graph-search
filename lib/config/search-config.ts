/**
 * Search Configuration
 * Centralized configuration for all search-related components
 * Addresses audit finding: "Hardcoded Values and Magic Numbers"
 */

export const SEARCH_CONFIG = {
  // Search Input Configuration
  DEFAULT_TOP_K: 20,
  TOP_K_STEP: 5,
  MAX_TOP_K: 100,
  MIN_TOP_K: 5,
  
  // Document Collection Info
  DOCUMENT_COUNT: 300, // Total documents in the system
  
  // Content Display
  CONTENT_PREVIEW_LENGTH: 200,
  
  // Search UI
  SEARCH_PLACEHOLDER: "Search across documents...",
  RESULTS_TO_FETCH_LABEL: "Results to fetch",
  
  // Similarity Ranges Configuration
  SIMILARITY_RANGES: [
    { 
      range: '<20', 
      min: 0, 
      max: 19, 
      color: 'bg-red-500',
      hoverColor: 'bg-red-600',
      label: 'Low Relevance'
    },
    { 
      range: '21-40', 
      min: 20, 
      max: 40, 
      color: 'bg-orange-500',
      hoverColor: 'bg-orange-600',
      label: 'Below Average'
    },
    { 
      range: '41-60', 
      min: 41, 
      max: 60, 
      color: 'bg-yellow-500',
      hoverColor: 'bg-yellow-600',
      label: 'Average'
    },
    { 
      range: '61-80', 
      min: 61, 
      max: 80, 
      color: 'bg-blue-500',
      hoverColor: 'bg-blue-600',
      label: 'Good Match'
    },
    { 
      range: '81-100', 
      min: 81, 
      max: 100, 
      color: 'bg-green-500',
      hoverColor: 'bg-green-600',
      label: 'Excellent Match'
    },
  ],
  
  // Histogram Display
  HISTOGRAM: {
    MIN_BAR_WIDTH: 15, // Minimum width percentage for empty bars
    MAX_BAR_WIDTH: 100, // Maximum width percentage
    BAR_HEIGHT: 'h-6', // Tailwind class for bar height
    ANIMATION_DURATION: 'duration-200', // Tailwind animation class
  },
  
  // Search Results Display
  RESULTS: {
    MAX_HEIGHT: 'max-h-[500px]', // Tailwind class for max height
    ITEMS_PER_PAGE: 10, // For future pagination
    SCORE_DECIMAL_PLACES: 4,
  },
  
  // Performance Settings
  PERFORMANCE: {
    SEARCH_DEBOUNCE_MS: 300, // Debounce delay for search input
    VIRTUALIZATION_THRESHOLD: 50, // When to enable virtualization
  },
} as const;

// Type definitions for better TypeScript support
export type SimilarityRange = typeof SEARCH_CONFIG.SIMILARITY_RANGES[0];
export type SearchConfigType = typeof SEARCH_CONFIG;

// Helper functions for working with configuration
export const SearchConfigHelpers = {
  /**
   * Get similarity range configuration by range string
   */
  getSimilarityRange: (range: string): SimilarityRange | undefined => {
    return SEARCH_CONFIG.SIMILARITY_RANGES.find(r => r.range === range);
  },
  
  /**
   * Get dynamic document count placeholder text
   */
  getSearchPlaceholder: (): string => {
    return `Search across ${SEARCH_CONFIG.DOCUMENT_COUNT}+ documents...`;
  },
  
  /**
   * Validate topK value against configuration limits
   */
  validateTopK: (value: number): number => {
    return Math.max(
      SEARCH_CONFIG.MIN_TOP_K, 
      Math.min(SEARCH_CONFIG.MAX_TOP_K, value)
    );
  },
  
  /**
   * Get next valid topK value for increment/decrement
   */
  getNextTopK: (current: number, increment: boolean): number => {
    const next = increment 
      ? current + SEARCH_CONFIG.TOP_K_STEP 
      : current - SEARCH_CONFIG.TOP_K_STEP;
    return SearchConfigHelpers.validateTopK(next);
  },
};

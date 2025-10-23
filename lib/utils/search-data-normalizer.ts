/**
 * Search Data Normalizer
 * Addresses audit finding: "Inconsistent Data Handling"
 * 
 * Standardizes search results from various API sources into a consistent format.
 * Handles different field names and data structures gracefully.
 */

import { SEARCH_CONFIG } from '@/lib/config/search-config';
import type { SearchResult, NormalizedSearchResult } from '@/lib/config/types';

/**
 * Normalizes a raw search result into a standardized format
 * 
 * @param result Raw search result from API
 * @returns Normalized search result with consistent field names
 */
export function normalizeSearchResult(result: SearchResult): NormalizedSearchResult {
  // Handle different score field names and formats
  const rawScore = result._score ?? result.score ?? result.similarity ?? 0;
  const normalizedScore = typeof rawScore === 'number' ? rawScore : parseFloat(String(rawScore)) || 0;
  
  // Handle different content field names (priority order)
  const content = result.content || result.text || result.summary || result.description || '';
  
  // Handle different label/title field names (priority order)
  const label = result.label || result.title || result.name || result.id || 'Untitled';
  
  // Handle different category field names
  const category = result.category || result.sourceType || result.type || 'Unknown';
  
  // Calculate similarity percentage (0-100)
  const similarity = Math.round(normalizedScore * 100);
  
  return {
    id: result.id || generateFallbackId(result),
    label: String(label).trim(),
    content: String(content).trim(),
    score: normalizedScore,
    similarity,
    category: String(category).trim(),
    type: result.type || 'document',
    sourceType: result.sourceType,
    continent: result.continent,
    country: result.country,
    url: result.url,
    tags: Array.isArray(result.tags) ? result.tags : [],
  };
}

/**
 * Normalizes an array of search results
 * 
 * @param results Array of raw search results
 * @returns Array of normalized search results
 */
export function normalizeSearchResults(results: SearchResult[]): NormalizedSearchResult[] {
  if (!Array.isArray(results)) {
    console.warn('normalizeSearchResults: Expected array, got:', typeof results);
    return [];
  }
  
  return results.map((result, index) => {
    try {
      return normalizeSearchResult(result);
    } catch (error) {
      console.error(`Failed to normalize search result at index ${index}:`, error, result);
      return createFallbackResult(result, index);
    }
  });
}

/**
 * Extracts preview text from normalized content
 * 
 * @param content Full content string
 * @param maxLength Maximum length for preview (defaults to config)
 * @returns Truncated preview text with ellipsis if needed
 */
export function extractContentPreview(
  content: string, 
  maxLength: number = SEARCH_CONFIG.CONTENT_PREVIEW_LENGTH
): string {
  if (!content || typeof content !== 'string') {
    return 'No content available';
  }
  
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  // Try to break at word boundary near the limit
  const truncated = trimmed.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Formats score for display
 * 
 * @param score Raw score value
 * @param decimalPlaces Number of decimal places (defaults to config)
 * @returns Formatted score string
 */
export function formatScore(
  score: number, 
  decimalPlaces: number = SEARCH_CONFIG.RESULTS.SCORE_DECIMAL_PLACES
): string {
  if (typeof score !== 'number' || isNaN(score)) {
    return 'N/A';
  }
  
  return score.toFixed(decimalPlaces);
}

/**
 * Validates if a search result has minimum required fields
 * 
 * @param result Search result to validate
 * @returns True if result has required fields
 */
export function isValidSearchResult(result: any): result is SearchResult {
  return (
    result &&
    typeof result === 'object' &&
    (result.id || result.label || result.title) &&
    (result.content || result.text || result.summary)
  );
}

/**
 * Filters out invalid search results
 * 
 * @param results Array of potentially invalid results
 * @returns Array of valid search results
 */
export function filterValidResults(results: any[]): SearchResult[] {
  if (!Array.isArray(results)) {
    return [];
  }
  
  return results.filter(isValidSearchResult);
}

// Helper functions

/**
 * Generates a fallback ID when none is provided
 */
function generateFallbackId(result: any): string {
  const timestamp = Date.now();
  const hash = hashCode(JSON.stringify(result));
  return `fallback_${timestamp}_${hash}`;
}

/**
 * Creates a fallback normalized result for error cases
 */
function createFallbackResult(result: any, index: number): NormalizedSearchResult {
  return {
    id: `error_result_${index}_${Date.now()}`,
    label: 'Error Loading Result',
    content: 'This result could not be processed properly.',
    score: 0,
    similarity: 0,
    category: 'Error',
    type: 'error',
    tags: [],
  };
}

/**
 * Simple hash function for generating IDs
 */
function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

// Export utility object for easier importing
export const SearchDataNormalizer = {
  normalize: normalizeSearchResult,
  normalizeArray: normalizeSearchResults,
  extractPreview: extractContentPreview,
  formatScore,
  isValid: isValidSearchResult,
  filterValid: filterValidResults,
} as const;

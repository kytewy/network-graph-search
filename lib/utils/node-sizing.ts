/**
 * Node Size Calculation Utilities
 * 
 * Extracted from network-graph-context.tsx for better testability and maintainability.
 * Handles all size calculations for graph nodes based on different visualization modes.
 */

import type { Node } from '@/lib/stores/app-state';

/**
 * Available size modes for node visualization
 */
export type SizeMode = 
  | 'none' 
  | 'contentLength' 
  | 'summaryLength' 
  | 'similarity';

/**
 * Size constants
 */
const SIZES = {
  // Default sizes
  default: 10,
  
  // Content-based sizes
  small: 6,
  medium: 12,
  large: 20,
  
  // Similarity-based sizes (5 buckets)
  veryLow: 4,
  low: 8,
  medium2: 12,
  high: 16,
  veryHigh: 20,
} as const;

/**
 * Content length thresholds
 */
const CONTENT_THRESHOLDS = {
  large: 1000,
  medium: 500,
} as const;

/**
 * Similarity percentage thresholds
 */
const SIMILARITY_THRESHOLDS = {
  veryHigh: 81,
  high: 61,
  medium: 41,
  low: 20,
} as const;

/**
 * NodeSizeCalculator
 * 
 * Pure utility class for calculating node sizes based on various attributes.
 * All methods are static and side-effect free for easy testing.
 */
export class NodeSizeCalculator {
  /**
   * Main entry point for size calculation
   * 
   * @param node - The node to calculate size for
   * @param mode - The size mode to use
   * @returns Size value (number)
   */
  static getSize(node: Node, mode: SizeMode): number {
    switch (mode) {
      case 'similarity':
        return this.getSimilaritySize(node);
      case 'contentLength':
        return this.getContentLengthSize(node);
      case 'summaryLength':
        return this.getSummaryLengthSize(node);
      case 'none':
      default:
        return SIZES.default;
    }
  }

  /**
   * Get size based on similarity score (0-1 range)
   * Higher similarity = larger node
   */
  private static getSimilaritySize(node: Node): number {
    if (node.score === undefined) {
      return SIZES.default;
    }
    
    // Convert score to percentage (0-1 to 0-100)
    const similarityPercent = Math.round(node.score * 100);
    
    // 5 different size buckets based on similarity
    if (similarityPercent >= SIMILARITY_THRESHOLDS.veryHigh) return SIZES.veryHigh;  // 81-100%
    if (similarityPercent >= SIMILARITY_THRESHOLDS.high) return SIZES.high;          // 61-80%
    if (similarityPercent >= SIMILARITY_THRESHOLDS.medium) return SIZES.medium2;     // 41-60%
    if (similarityPercent >= SIMILARITY_THRESHOLDS.low) return SIZES.low;            // 20-40%
    return SIZES.veryLow;                                                            // <20%
  }

  /**
   * Get size based on content length
   * Longer content = larger node
   */
  private static getContentLengthSize(node: Node): number {
    const contentLength = (node.content || '').length;
    
    if (contentLength > CONTENT_THRESHOLDS.large) return SIZES.large;   // 1000+ chars
    if (contentLength > CONTENT_THRESHOLDS.medium) return SIZES.medium; // 501-1000 chars
    return SIZES.small;                                                  // Under 500 chars
  }

  /**
   * Get size based on summary length
   * Longer summary = larger node
   */
  private static getSummaryLengthSize(node: Node): number {
    const summaryLength = (node.summary || '').length;
    
    if (summaryLength > CONTENT_THRESHOLDS.large) return SIZES.large;   // 1000+ chars
    if (summaryLength > CONTENT_THRESHOLDS.medium) return SIZES.medium; // 501-1000 chars
    return SIZES.small;                                                  // Under 500 chars
  }

  /**
   * Get a human-readable description of what a size represents
   * Useful for accessibility and tooltips
   * 
   * @param node - The node
   * @param mode - The size mode
   * @returns Description string
   */
  static getSizeDescription(node: Node, mode: SizeMode): string {
    switch (mode) {
      case 'similarity':
        if (node.score !== undefined) {
          const percent = Math.round(node.score * 100);
          return `Similarity: ${percent}% (size: ${this.getSimilaritySize(node)})`;
        }
        return 'Similarity: unknown';
      case 'contentLength':
        const contentLength = (node.content || '').length;
        return `Content: ${contentLength} chars (size: ${this.getContentLengthSize(node)})`;
      case 'summaryLength':
        const summaryLength = (node.summary || '').length;
        return `Summary: ${summaryLength} chars (size: ${this.getSummaryLengthSize(node)})`;
      case 'none':
      default:
        return `Default size: ${SIZES.default}`;
    }
  }

  /**
   * Get size category for a node (useful for filtering/grouping)
   * 
   * @param node - The node
   * @param mode - The size mode
   * @returns Category string ('small' | 'medium' | 'large')
   */
  static getSizeCategory(node: Node, mode: SizeMode): 'small' | 'medium' | 'large' {
    const size = this.getSize(node, mode);
    
    if (size <= 6) return 'small';
    if (size <= 12) return 'medium';
    return 'large';
  }
}

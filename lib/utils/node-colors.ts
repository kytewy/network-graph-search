/**
 * Node Color Calculation Utilities
 * 
 * Extracted from network-graph-context.tsx for better testability and maintainability.
 * Handles all color calculations for graph nodes based on different visualization modes.
 */

import type { Node } from '@/lib/stores/app-state';

/**
 * Available color modes for node visualization
 */
export type ColorMode = 
  | 'sourceType' 
  | 'continent' 
  | 'similarityRange' 
  | 'documentType' 
  | 'country';

/**
 * Color palette constants
 */
const COLORS = {
  // Primary colors for types
  indigo: '#4f46e5',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  
  // Similarity gradient (green to red)
  greenBright: '#22c55e',
  greenLight: '#84cc16',
  yellow: '#eab308',
  orange: '#f97316',
  redBright: '#ef4444',
  
  // Country-specific
  darkBlue: '#1e40af',
  lightBlue: '#60a5fa',
  
  // Default/unknown
  gray: '#6b7280',
} as const;

/**
 * NodeColorCalculator
 * 
 * Pure utility class for calculating node colors based on various attributes.
 * All methods are static and side-effect free for easy testing.
 */
export class NodeColorCalculator {
  /**
   * Main entry point for color calculation
   * 
   * @param node - The node to calculate color for
   * @param mode - The color mode to use
   * @returns Hex color string
   */
  static getColor(node: Node, mode: ColorMode): string {
    switch (mode) {
      case 'sourceType':
      case 'documentType':
        return this.getSourceTypeColor(node);
      case 'continent':
        return this.getContinentColor(node);
      case 'country':
        return this.getCountryColor(node);
      case 'similarityRange':
        return this.getSimilarityRangeColor(node);
      default:
        return this.getDefaultColor(node);
    }
  }

  /**
   * Get color based on source/document type
   */
  private static getSourceTypeColor(node: Node): string {
    const typeColorMap: Record<string, string> = {
      article: COLORS.indigo,
      document: COLORS.emerald,
      webpage: COLORS.amber,
      pdf: COLORS.red,
    };
    
    return typeColorMap[node.type] || COLORS.purple;
  }

  /**
   * Get color based on continent
   */
  private static getContinentColor(node: Node): string {
    const continentColorMap: Record<string, string> = {
      'North America': COLORS.indigo,
      'Europe': COLORS.emerald,
      'Asia': COLORS.amber,
      'Africa': COLORS.red,
      'South America': COLORS.purple,
    };
    
    return continentColorMap[node.continent || ''] || COLORS.gray;
  }

  /**
   * Get color based on country
   */
  private static getCountryColor(node: Node): string {
    const countryColorMap: Record<string, string> = {
      'USA': COLORS.darkBlue,
      'Canada': COLORS.red,
      'European Union': COLORS.lightBlue,
    };
    
    return countryColorMap[node.country || ''] || COLORS.gray;
  }

  /**
   * Get color based on similarity score (0-1 range)
   * Uses a gradient from green (high similarity) to red (low similarity)
   */
  private static getSimilarityRangeColor(node: Node): string {
    if (node.score === undefined) {
      return COLORS.gray;
    }
    
    // Convert score to percentage (0-1 to 0-100)
    const similarityPercent = Math.round(node.score * 100);
    
    // Define color ranges matching the histogram
    if (similarityPercent >= 81) return COLORS.greenBright;  // 81-100%
    if (similarityPercent >= 61) return COLORS.greenLight;   // 61-80%
    if (similarityPercent >= 41) return COLORS.yellow;       // 41-60%
    if (similarityPercent >= 20) return COLORS.orange;       // 20-40%
    return COLORS.redBright;                                 // <20%
  }

  /**
   * Default color based on category
   */
  private static getDefaultColor(node: Node): string {
    return node.category === 'article' ? COLORS.indigo : COLORS.emerald;
  }

  /**
   * Get a human-readable description of what a color represents
   * Useful for accessibility and tooltips
   * 
   * @param node - The node
   * @param mode - The color mode
   * @returns Description string
   */
  static getColorDescription(node: Node, mode: ColorMode): string {
    switch (mode) {
      case 'sourceType':
      case 'documentType':
        return `Type: ${node.type || 'unknown'}`;
      case 'continent':
        return `Continent: ${node.continent || 'unknown'}`;
      case 'country':
        return `Country: ${node.country || 'unknown'}`;
      case 'similarityRange':
        if (node.score !== undefined) {
          const percent = Math.round(node.score * 100);
          return `Similarity: ${percent}%`;
        }
        return 'Similarity: unknown';
      default:
        return 'Default color';
    }
  }
}

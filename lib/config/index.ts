/**
 * Configuration Index
 * Centralized exports for all configuration files
 * 
 * @example
 * ```tsx
 * // Import everything from one place
 * import { SEARCH_CONFIG, GRAPH_LAYOUT_CONFIG, BRAND_COLORS, Node } from '@/lib/config';
 * 
 * // Or import specific modules
 * import { SEARCH_CONFIG } from '@/lib/config/search-config';
 * import { PATTERNS } from '@/lib/config/theme-config';
 * ```
 */

// Search Configuration
export * from './search-config';

// Graph Configuration  
export * from './graph-config';

// Theme Configuration
export * from './theme-config';

// Type Definitions
export * from './types';

// Resolve naming conflicts by explicitly re-exporting
export type { SimilarityRange as SearchSimilarityRange } from './search-config';
export type { SimilarityRange as TypesSimilarityRange } from './types';

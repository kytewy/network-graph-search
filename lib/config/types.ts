/**
 * Core Type Definitions
 * Centralized TypeScript interfaces and types for the application
 */

/**
 * Node Type Definition
 * 
 * ⚠️ IMPORTANT: This is the single source of truth for node properties.
 * When adding new fields, update ALL transformation points:
 * 1. lib/stores/app-state.ts - processApiResponse()
 * 2. hooks/use-graph-data.ts - graphNode transformation
 * 3. components/network/NetworkGraphCanvas.tsx - contextMenu
 * 
 * This is the UI-enhanced version that includes display properties like size and color.
 * Note: This extends the base Node type from app-state with additional visual properties.
 */
export interface Node {
  // Core properties (from app-state)
  id: string;
  label: string;
  type: string;
  category: string;
  summary: string; // Brief description for tooltip
  content: string; // Full article content for modal
  text?: string; // Alternate text content (chunk_text)
  
  // Scoring properties
  score: number;
  similarity?: number;
  
  // Visual properties (added for display)
  size: number;
  color: string;
  
  // Link property
  url?: string; // External link to the resource
  
  // Position properties (for graph layout)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  
  // Classification properties
  sourceType?: string;
  continent?: string;
  country?: string;
  
  // Clustering properties
  ai_clusters?: string; // AI cluster assignment (e.g., "cluster_0")
  
  // Tagging properties
  tags?: string[]; // User-defined tags for categorization and filtering
  
  // Raw fields for backward compatibility
  fields?: any;
}

/**
 * Link/Edge Type Definition
 * Represents connections between nodes in the graph
 */
export interface Link {
  id: string;
  source: string;
  target: string;
  weight?: number;
  type?: string;
}

/**
 * Search Result Type
 * Raw search result from API before normalization
 */
export interface SearchResult {
  id: string;
  _score?: number;
  score?: number;
  similarity?: number;
  label?: string;
  title?: string;
  content?: string;
  text?: string;
  summary?: string;
  category?: string;
  type?: string;
  sourceType?: string;
  continent?: string;
  country?: string;
  url?: string;
  tags?: string[];
  [key: string]: any; // Allow additional properties
}

/**
 * Normalized Search Result Type
 * Standardized format after data normalization
 */
export interface NormalizedSearchResult {
  id: string;
  label: string;
  content: string;
  score: number;
  similarity: number;
  category: string;
  type: string;
  sourceType?: string;
  continent?: string;
  country?: string;
  url?: string;
  tags?: string[];
}

/**
 * Graph Layout Types
 * Supported layout algorithms for network visualization
 */
export type NetworkLayoutType = 
  | 'forceDirected2d' 
  | 'circular2d' 
  | 'treeTd2d' 
  | 'treeLr2d' 
  | 'radialOut2d' 
  | 'forceatlas2';

export type ReagraphLayoutType = 
  | 'forceDirected2d' 
  | 'circular2d' 
  | 'treeTd2d' 
  | 'treeLr2d' 
  | 'radialOut2d' 
  | 'forceatlas2';

/**
 * Color Mode Types
 * Different ways to color nodes in the graph
 */
export type ColorMode = 
  | 'sourceType' 
  | 'continent' 
  | 'similarityRange' 
  | 'documentType' 
  | 'country';

/**
 * Cluster Mode Types
 * Different clustering visualization modes
 */
export type ClusterMode = 
  | 'none' 
  | 'ai_clusters';

/**
 * Node Size Mode Types
 * Different ways to size nodes in the graph
 */
export type NodeSizeMode = 
  | 'uniform' 
  | 'score' 
  | 'degree';

/**
 * Similarity Range Type
 * Configuration for similarity histogram ranges
 */
export interface SimilarityRange {
  range: string;
  min: number;
  max: number;
  color: string;
  hoverColor: string;
  label: string;
}

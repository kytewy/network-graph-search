/**
 * Core Type Definitions
 * Centralized TypeScript interfaces and types for the application
 */

/**
 * Node Type Definition
 * 
 * A search result arrives in this shape from lib/contracts/node.ts
 * (toApiNode), the one place Pinecone fields become a Node. To add a field,
 * add it to apiNodeSchema (lib/contracts/search.ts) and read it in toApiNode.
 * 
 * This is the UI-enhanced version that includes display properties like size and color.
 * Note: This extends the base Node type from app-state with additional visual properties.
 */
export interface Node {
  // Core properties (from app-state)
  id: string;
  label: string;
  publisher: string; // Who published it (see lib/config/document-taxonomy.json)
  documentType: string; // What kind of document: Law, Guidance, Interpretation
  summary: string; // Brief description for tooltip
  content: string; // Full article content for modal
  text?: string; // Alternate text content (chunk_text)
  
  // Scoring properties
  score: number;
  similarity?: number;
  
  // Visual properties (added for display)
  size: number;
  color?: string; // Not sent by the search; set by the graph when needed
  
  // Link property
  url?: string; // External link to the resource
  
  // Position properties (for graph layout)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  
  // Classification properties
  continent?: string;
  country?: string;
  
  // Clustering properties
  ai_clusters?: string; // AI cluster assignment (e.g., "cluster_0")
  
  // Tagging properties
  tags?: string[]; // User-defined tags for categorization and filtering
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
  label?: string;
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
  | 'publisher' 
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

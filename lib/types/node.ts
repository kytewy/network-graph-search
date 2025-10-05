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
  
  // Raw fields for backward compatibility
  fields?: any;
}

/**
 * Node Type Definition
 * 
 * Shared Node interface used across the application.
 * This is the UI-enhanced version that includes display properties like size and color.
 * 
 * Note: This extends the base Node type from app-state with additional visual properties.
 */

export interface Node {
  // Core properties (from app-state)
  id: string;
  label: string;
  type: string;
  summary: string; // Brief description for tooltip
  content: string; // Full article content for modal
  
  // Visual properties (added for display)
  size: number;
  color: string;
  
  // Optional metadata
  similarity?: number;
  url?: string;
  
  // Position properties (for graph layout)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  
  // Classification properties
  sourceType?: string;
  continent?: string;
  country?: string;
}

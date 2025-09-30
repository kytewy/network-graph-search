/**
 * Layout Type Mapping Utilities
 * 
 * Extracted from network-graph-context.tsx for better testability and maintainability.
 * Handles mapping between network store layout types and Reagraph layout types.
 */

/**
 * Network store layout types (simplified, user-facing names)
 */
export type NetworkLayoutType = 'forceDirected' | 'concentric' | 'radial' | 'hierarchical';

/**
 * Reagraph layout types (technical implementation names)
 */
export type ReagraphLayoutType =
  | 'forceDirected2d'
  | 'forceDirected3d'
  | 'hierarchical'
  | 'radial'
  | 'forceAtlas2'
  | 'noOverlap'
  | 'concentric2d'
  | 'radialOut2d';

/**
 * LayoutMapper
 * 
 * Utility class for mapping between different layout type representations.
 * Provides bidirectional conversion between network store and Reagraph types.
 */
export class LayoutMapper {
  /**
   * Map from network store layout type to Reagraph layout type
   * 
   * @param layoutType - Network store layout type
   * @returns Reagraph layout type
   */
  static toReagraph(layoutType: NetworkLayoutType): ReagraphLayoutType {
    const mapping: Record<NetworkLayoutType, ReagraphLayoutType> = {
      forceDirected: 'forceDirected2d',
      concentric: 'concentric2d',
      radial: 'radialOut2d',
      hierarchical: 'hierarchical',
    };
    
    return mapping[layoutType] || 'forceDirected2d';
  }

  /**
   * Map from Reagraph layout type to network store layout type
   * 
   * @param layoutType - Reagraph layout type
   * @returns Network store layout type
   */
  static fromReagraph(layoutType: ReagraphLayoutType): NetworkLayoutType {
    // Map known Reagraph types back to simplified network types
    switch (layoutType) {
      case 'forceDirected2d':
      case 'forceDirected3d':
      case 'forceAtlas2':
        return 'forceDirected';
      case 'concentric2d':
        return 'concentric';
      case 'radialOut2d':
      case 'radial':
        return 'radial';
      case 'hierarchical':
        return 'hierarchical';
      default:
        return 'forceDirected';
    }
  }

  /**
   * Get a human-readable description of a layout type
   * 
   * @param layoutType - Network layout type
   * @returns Human-readable description
   */
  static getDescription(layoutType: NetworkLayoutType): string {
    const descriptions: Record<NetworkLayoutType, string> = {
      forceDirected: 'Show me everything and how it relates - Uses physics simulation for natural spacing',
      concentric: 'Show me by importance level - Arranges nodes in concentric circles',
      radial: 'Show me everything related to THIS topic - Arranges nodes radiating outward from central points',
      hierarchical: 'Show me the hierarchy - Arranges nodes in a tree-like structure',
    };
    
    return descriptions[layoutType] || 'Unknown layout';
  }

  /**
   * Check if a layout supports clustering
   * Clustering is only supported in force-directed layouts
   * 
   * @param layoutType - Reagraph layout type
   * @returns True if clustering is supported
   */
  static supportsCluster(layoutType: ReagraphLayoutType): boolean {
    return layoutType === 'forceDirected2d' || layoutType === 'forceDirected3d' || layoutType === 'forceAtlas2';
  }

  /**
   * Get recommended settings for a layout type
   * 
   * @param layoutType - Network layout type
   * @returns Recommended settings object
   */
  static getRecommendedSettings(layoutType: NetworkLayoutType): {
    animated: boolean;
    nodeStrength?: number;
    linkDistance?: number;
  } {
    switch (layoutType) {
      case 'forceDirected':
        return {
          animated: true,
          nodeStrength: -120,
          linkDistance: 60,
        };
      case 'concentric':
        return {
          animated: true,
        };
      case 'radial':
        return {
          animated: true,
        };
      case 'hierarchical':
        return {
          animated: false, // Hierarchical typically doesn't need animation
        };
      default:
        return {
          animated: true,
        };
    }
  }
}

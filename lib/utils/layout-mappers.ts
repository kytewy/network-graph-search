/**
 * Layout Type Mapping Utilities
 * 
 * Extracted from network-graph-context.tsx for better testability and maintainability.
 * Handles mapping between network store layout types and Reagraph layout types.
 */

/**
 * Network store layout types (simplified, user-facing names)
 */
export type NetworkLayoutType = 
  | 'forceDirected2d'
  | 'circular2d'
  | 'treeTd2d'
  | 'treeLr2d'
  | 'radialOut2d'
  | 'forceatlas2';

/**
 * Reagraph layout types (technical implementation names)
 * All supported layouts from Reagraph library
 */
export type ReagraphLayoutType =
  | 'forceDirected2d'
  | 'circular2d'
  | 'treeTd2d'
  | 'treeLr2d'
  | 'radialOut2d'
  | 'forceatlas2';

/**
 * LayoutMapper
 * 
 * Utility class for mapping between different layout type representations.
 * Provides bidirectional conversion between network store and Reagraph types.
 */
export class LayoutMapper {
  /**
   * Map from network store layout type to Reagraph layout type
   * Since we now use the same values, this is a passthrough
   * 
   * @param layoutType - Network store layout type
   * @returns Reagraph layout type
   */
  static toReagraph(layoutType: NetworkLayoutType): ReagraphLayoutType {
    return layoutType as ReagraphLayoutType;
  }

  /**
   * Map from Reagraph layout type to network store layout type
   * Since we now use the same values, this is a passthrough
   * 
   * @param layoutType - Reagraph layout type
   * @returns Network store layout type
   */
  static fromReagraph(layoutType: ReagraphLayoutType): NetworkLayoutType {
    return layoutType as NetworkLayoutType;
  }

  /**
   * Get a human-readable description of a layout type
   * 
   * @param layoutType - Network layout type
   * @returns Human-readable description
   */
  static getDescription(layoutType: NetworkLayoutType): string {
    const descriptions: Partial<Record<NetworkLayoutType, string>> = {
      forceDirected2d: 'Force Directed 2D - Physics-based natural spacing',
      circular2d: 'Circular 2D - Nodes arranged in a circle',
      treeTd2d: 'Tree Top-Down 2D - Hierarchical tree from top',
      treeLr2d: 'Tree Left-Right 2D - Hierarchical tree from left',
      radialOut2d: 'Radial Out 2D - Radiating from center',
      forceatlas2: 'ForceAtlas2 - Optimized for large graphs',
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
    return layoutType === 'forceDirected2d' || 
           layoutType === 'forceatlas2';
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
    // Force-directed layouts benefit from custom physics settings
    if (layoutType === 'forceDirected2d' || layoutType === 'forceatlas2') {
      return {
        animated: true,
        nodeStrength: -120,
        linkDistance: 60,
      };
    }
    
    // Most other layouts just need animation
    return {
      animated: true,
    };
  }
}

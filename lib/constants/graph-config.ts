/**
 * Graph Configuration Constants
 * Centralized configuration for network graph visualization
 */

/**
 * Reagraph Layout Configuration
 * These values control the physics simulation and layout behavior
 */
export const GRAPH_LAYOUT_CONFIG = {
	/** Distance between connected nodes (default: 80) */
	linkDistance: 80,
	/** Strength of node repulsion - negative values push nodes apart (default: -250) */
	nodeStrength: -250,
	/** Gravitational pull toward center - keeps graph from spreading too far (default: 0.5) */
	gravity: 0.5,
} as const;

/**
 * Z-Index Scale
 * Centralized z-index values to prevent conflicts
 */
export const Z_INDEX = {
	/** Base layer for normal content */
	base: 1,
	/** Instructions and overlays on the graph */
	graphOverlay: 9,
	/** Dropdown menus and tooltips */
	dropdown: 10,
	/** Floating panels and controls */
	floatingPanel: 50,
	/** Context menus */
	contextMenu: 1000,
	/** Modal dialogs */
	modal: 10001,
	/** Full-screen overlays */
	overlay: 9999,
} as const;

/**
 * Node Size Configuration
 */
export const NODE_SIZE = {
	min: 5,
	max: 18,
	default: 10,
} as const;

/**
 * Animation and Performance Settings
 */
export const PERFORMANCE_CONFIG = {
	/** Enable animations for small/medium graphs */
	animated: true,
	/** Default camera mode for graph interaction */
	cameraMode: 'pan' as const,
	/** Label display type */
	labelType: 'auto' as const,
	/** Edge curve style */
	edgeStyle: 'curved' as const,
} as const;

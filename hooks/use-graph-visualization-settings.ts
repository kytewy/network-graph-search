'use client';

import { useAppStore } from '@/lib/stores/app-state';
import type { ColorMode, NodeSizeMode } from './use-graph-data';

/**
 * useGraphVisualizationSettings Hook
 * 
 * Provides access to graph visualization settings from the app store.
 * Manages visual appearance: labels, colors, node sizes, and clustering.
 * 
 * This hook encapsulates store access for visual settings, making it:
 * - Easy to change store implementation later
 * - Clear what settings affect visualization
 * - Centralized visual configuration
 * 
 * @example
 * ```tsx
 * const {
 *   showLabels,
 *   colorMode,
 *   nodeSizeMode,
 *   clusterMode,
 *   setShowLabels,
 *   setColorMode
 * } = useGraphVisualizationSettings();
 * 
 * // Toggle labels
 * <button onClick={() => setShowLabels(!showLabels)}>
 *   {showLabels ? 'Hide' : 'Show'} Labels
 * </button>
 * 
 * // Change color mode
 * <select onChange={(e) => setColorMode(e.target.value)}>
 *   <option value="sourceType">By Source Type</option>
 *   <option value="continent">By Continent</option>
 * </select>
 * ```
 */

export type ClusterMode = 'none' | 'type' | 'continent' | 'country' | 'sourceType';

interface UseGraphVisualizationSettingsReturn {
	// Visual state
	/** Whether node labels are visible */
	showLabels: boolean;
	/** Current color scheme for nodes */
	colorMode: ColorMode;
	/** Current sizing strategy for nodes */
	nodeSizeMode: NodeSizeMode;
	/** Current clustering mode (none or attribute-based) */
	clusterMode: ClusterMode;

	// Setters
	/** Toggle label visibility */
	setShowLabels: (show: boolean) => void;
	/** Change node color scheme */
	setColorMode: (mode: ColorMode) => void;
	/** Change node sizing strategy */
	setNodeSizeMode: (mode: NodeSizeMode) => void;
	/** Change clustering mode */
	setClusterMode: (mode: ClusterMode) => void;
}

/**
 * Hook for managing graph visualization settings
 * 
 * @returns Visualization settings and their setters
 */
export function useGraphVisualizationSettings(): UseGraphVisualizationSettingsReturn {
	// Read visual settings from app store
	const showLabels = useAppStore((state) => state.showLabels);
	const colorMode = useAppStore((state) => state.colorMode);
	const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);
	const clusterMode = useAppStore((state) => state.clusterMode);

	// Get setters from app store
	const setShowLabels = useAppStore((state) => state.setShowLabels);
	const setColorMode = useAppStore((state) => state.setColorMode);
	const setNodeSizeMode = useAppStore((state) => state.setNodeSizeMode);
	const setClusterMode = useAppStore((state) => state.setClusterMode);

	return {
		// Visual state
		showLabels,
		colorMode,
		nodeSizeMode,
		clusterMode,

		// Setters
		setShowLabels,
		setColorMode,
		setNodeSizeMode,
		setClusterMode,
	};
}

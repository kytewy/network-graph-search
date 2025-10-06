'use client';

import { useState, useCallback, useEffect } from 'react';
import { useNetworkStore } from '@/lib/stores/network-store';
import { useAppStore } from '@/lib/stores/app-state';
import {
	LayoutMapper,
	type ReagraphLayoutType,
} from '@/lib/utils/layout-mappers';
import type { ClusterMode } from './use-graph-visualization-settings';

/**
 * useGraphLayout Hook
 * 
 * Manages graph layout type with cluster mode validation.
 * Handles conversion between app layout types and Reagraph layout types.
 * 
 * This hook encapsulates layout management logic, making it:
 * - Independent of the graph context
 * - Testable layout change scenarios
 * - Responsible for cluster compatibility validation
 * 
 * Key features:
 * - Syncs with network store
 * - Validates cluster mode compatibility with layouts
 * - Auto-resets cluster mode for non-force-directed layouts
 * - Converts between app and Reagraph layout formats
 * 
 * @example
 * ```tsx
 * const { layoutType, handleLayoutChange } = useGraphLayout();
 * 
 * <GraphCanvas layoutType={layoutType} />
 * 
 * <select onChange={(e) => handleLayoutChange(e.target.value)}>
 *   <option value="forceDirected2d">Force Directed</option>
 *   <option value="concentric2d">Concentric</option>
 *   <option value="radialOut2d">Radial</option>
 * </select>
 * ```
 */

interface UseGraphLayoutReturn {
	/** Current Reagraph-compatible layout type */
	layoutType: ReagraphLayoutType;
	/** Change layout with validation and side effects */
	handleLayoutChange: (layout: string) => void;
}

/**
 * Hook for managing graph layout type
 * 
 * Coordinates between network store layout and Reagraph layout types.
 * Ensures cluster mode is compatible with the selected layout.
 * 
 * @returns Layout state and change handler
 */
export function useGraphLayout(): UseGraphLayoutReturn {
	// Get layout from network store
	const networkLayoutType = useNetworkStore((state) => state.layoutType);
	
	// Get cluster mode for validation
	const clusterMode = useAppStore((state) => state.clusterMode);
	const setClusterModeStore = useAppStore((state) => state.setClusterMode);

	// Local state for Reagraph layout type
	const [layoutType, setLayoutType] = useState<ReagraphLayoutType>(
		LayoutMapper.toReagraph(networkLayoutType)
	);

	// Sync with network store when it changes
	useEffect(() => {
		setLayoutType(LayoutMapper.toReagraph(networkLayoutType));
	}, [networkLayoutType]);

	/**
	 * Handle layout change with cluster validation
	 * 
	 * When changing layouts:
	 * 1. Updates local Reagraph layout state
	 * 2. Converts to network store format
	 * 3. Validates cluster mode compatibility
	 * 4. Auto-resets cluster if incompatible
	 * 5. Updates network store
	 */
	const handleLayoutChange = useCallback(
		(layout: string) => {
			const reagraphLayout = layout as ReagraphLayoutType;
			// Map Reagraph layout type to network store layout type
			const networkLayout = LayoutMapper.fromReagraph(reagraphLayout);

			// Only force-directed layouts support clustering
			if (
				!LayoutMapper.supportsCluster(reagraphLayout) &&
				clusterMode !== 'none'
			) {
				setClusterModeStore('none');
			}

			// Update network store with new layout
			useNetworkStore.getState().setLayoutType(networkLayout);
		},
		[clusterMode, setClusterModeStore]
	);

	return {
		layoutType,
		handleLayoutChange,
	};
}

'use client';

import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/lib/stores/app-state';
import { useGraphData } from './use-graph-data';
import { useGraphLayout } from './use-graph-layout';

/**
 * Everything the graph canvas draws: the filtered documents turned into
 * graph nodes and edges, coloured, sized and clustered by the current
 * settings. Reads the store directly (it used to come from the graph context).
 */
export function useGraphView() {
	const { filteredResults, filteredLinks, aiClusters, showLabels, colorMode, nodeSizeMode, clusterMode } = useAppStore(
		useShallow((s) => ({
			filteredResults: s.filteredResults,
			filteredLinks: s.filteredLinks,
			aiClusters: s.aiClusters,
			showLabels: s.showLabels,
			colorMode: s.colorMode,
			nodeSizeMode: s.nodeSizeMode,
			clusterMode: s.clusterMode,
		}))
	);
	const { layoutType } = useGraphLayout();
	const { graphNodes, graphEdges, getNodeColor } = useGraphData(filteredResults, filteredLinks, {
		colorMode,
		nodeSizeMode,
		clusterMode,
		aiClusters,
	});

	return { graphNodes, graphEdges, getNodeColor, layoutType, showLabels, colorMode, nodeSizeMode, clusterMode };
}

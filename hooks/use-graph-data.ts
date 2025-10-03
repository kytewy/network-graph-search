'use client';

import { useMemo, useCallback } from 'react';
import type { GraphNode, GraphEdge } from 'reagraph';
import type { Node, Link } from '@/lib/stores/app-state';
import { NodeColorCalculator } from '@/lib/utils/node-colors';
import { NodeSizeCalculator } from '@/lib/utils/node-sizing';

export type ColorMode =
	| 'sourceType'
	| 'continent'
	| 'similarityRange'
	| 'documentType'
	| 'country';

export type NodeSizeMode =
	| 'none'
	| 'contentLength'
	| 'summaryLength'
	| 'similarity';

interface UseGraphDataOptions {
	colorMode: ColorMode;
	nodeSizeMode: NodeSizeMode;
	clusterAssignments?: Record<string, string>; // nodeId -> clusterId (AI clusters)
	clusterMode?: string; // Manual cluster mode
}

interface UseGraphDataReturn {
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	getNodeColor: (node: Node) => string;
	getNodeSize: (node: Node) => number;
}

/**
 * useGraphData Hook
 *
 * Transforms application nodes and links into Reagraph-compatible format.
 * Handles color and size calculations based on visualization mode settings.
 *
 * This hook encapsulates all data transformation logic, making it:
 * - Testable in isolation
 * - Reusable across different graph implementations
 * - Independent of Context API
 *
 * @param nodes - Array of application nodes to transform
 * @param links - Array of application links to transform
 * @param options - Visualization settings (color mode, size mode)
 *
 * @example
 * ```tsx
 * const { graphNodes, graphEdges, getNodeColor } = useGraphData(
 *   filteredResults,
 *   filteredLinks,
 *   { colorMode: 'continent', nodeSizeMode: 'contentLength' }
 * );
 *
 * <GraphCanvas nodes={graphNodes} edges={graphEdges} />
 * ```
 */
export function useGraphData(
	nodes: Node[],
	links: Link[],
	{ colorMode, nodeSizeMode, clusterAssignments, clusterMode }: UseGraphDataOptions
): UseGraphDataReturn {
	const getNodeColor = useCallback(
		(node: Node) => {
			return NodeColorCalculator.getColor(node, colorMode);
		},
		[colorMode]
	);

	// Memoized size calculation function
	const getNodeSize = useCallback(
		(node: Node) => {
			return NodeSizeCalculator.getSize(node, nodeSizeMode);
		},
		[nodeSizeMode]
	);

	// Smart cluster assignment with priority logic
	const getClusterValue = useCallback((node: Node) => {
		// Priority 1: AI clusters if they exist
		if (clusterAssignments && clusterAssignments[node.id]) {
			console.log('[useGraphData] Using AI cluster for node:', node.id, '→', clusterAssignments[node.id]);
			return clusterAssignments[node.id];
		}
		// Priority 2: Manual clusters if clusterMode is set
		if (clusterMode && clusterMode !== 'none') {
			const manualCluster = (node as any)[clusterMode];
			if (manualCluster) {
				console.log('[useGraphData] Using manual cluster for node:', node.id, '→', manualCluster);
				return manualCluster;
			}
		}
		return undefined;
	}, [clusterAssignments, clusterMode]);

	// Transform nodes to Reagraph format
	const graphNodes = useMemo(() => {
		if (!nodes || nodes.length === 0) return [];

		const transformed = nodes.map((node) => {
			const graphNode = {
				id: node.id,
				label: node.label || node.id,
				fill: getNodeColor(node),
				size: getNodeSize(node),
				score: node.score || 0.5,
				category: node.category || '',
				cluster: getClusterValue(node), // Smart cluster assignment with priority
				data: node as any, // Store original node data for context menu and interactions
			};
			return graphNode;
		});

		// Log cluster assignments for debugging
		const clusteredNodes = transformed.filter(n => n.cluster);
		if (clusteredNodes.length > 0) {
			console.log('[useGraphData] Nodes with cluster assignments:', clusteredNodes.length, '/', transformed.length);
			console.log('[useGraphData] Cluster distribution:', 
				Object.entries(
					clusteredNodes.reduce((acc, node) => {
						acc[node.cluster!] = (acc[node.cluster!] || 0) + 1;
						return acc;
					}, {} as Record<string, number>)
				)
			);
		}

		return transformed;
	}, [nodes, getNodeColor, getNodeSize, clusterAssignments]);

	// Transform links to Reagraph edges
	const graphEdges = useMemo(() => {
		if (!links || links.length === 0) return [];

		return links.map((link) => ({
			id: link.id || `${link.source}-${link.target}`,
			source: link.source,
			target: link.target,
			label: link.label || '',
			type: link.type || 'default',
			data: link as any,
		}));
	}, [links]);

	return {
		graphNodes,
		graphEdges,
		getNodeColor,
		getNodeSize,
	};
}

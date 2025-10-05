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
	clusterMode?: string; // Cluster mode
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
	{ colorMode, nodeSizeMode, clusterMode }: UseGraphDataOptions
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

	const graphNodes = useMemo(() => {
		const transformed = nodes.map((node) => {
			const nodeData = node as any;
			
			const graphNode = {
				id: node.id,
				label: node.label || node.id,
				fill: getNodeColor(node),
				score: node.score || 0.5,
				category: node.category || '',
				data: node as any, // Store original node data for context menu and interactions
				
				// Attach all possible cluster properties to the node
				// Reagraph will use the one specified by clusterAttribute
				type: nodeData.type,
				continent: nodeData.continent,
				country: nodeData.country,
				sourceType: nodeData.sourceType,
				ai_clusters: nodeData.ai_clusters, // AI cluster assignment (e.g., "cluster_0") - stored directly on node
				
				// Include fields needed by UI components
				summary: nodeData.summary,
				content: nodeData.content,
				url: nodeData.url, // URL for "Open Link" button
			};
			return graphNode;
		});

		// Log AI cluster assignments for debugging
		const aiClusteredNodes = transformed.filter(n => n.ai_clusters);
		if (aiClusteredNodes.length > 0) {
			console.log('[useGraphData] Nodes with AI cluster assignments:', aiClusteredNodes.length, '/', transformed.length);
			console.log('[useGraphData] AI Cluster distribution:', 
				Object.entries(
					aiClusteredNodes.reduce((acc, node) => {
						const cluster = node.ai_clusters!;
						acc[cluster] = (acc[cluster] || 0) + 1;
						return acc;
					}, {} as Record<string, number>)
				)
			);
		}

		return transformed;
	}, [nodes, getNodeColor, getNodeSize]);

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

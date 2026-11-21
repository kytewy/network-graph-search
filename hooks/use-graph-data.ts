'use client';

import { useMemo, useCallback } from 'react';
import type { GraphNode, GraphEdge } from 'reagraph';
import type { Node, Link } from '@/lib/stores/app-state';
import { NodeColorCalculator } from '@/lib/utils/node-colors';
import { NodeSizeCalculator } from '@/lib/utils/node-sizing';
import { NO_CLUSTERS, type ClusterAssignments } from '@/lib/clustering/assignments';

export type ColorMode =
	| 'publisher'
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
	aiClusters?: ClusterAssignments; // AI cluster per node id
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
	{ colorMode, nodeSizeMode, clusterMode, aiClusters = NO_CLUSTERS }: UseGraphDataOptions
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
				size: getNodeSize(node), // Actually use the size calculation
				score: node.score || 0.5,
				// Original node data for menus and interactions. Reagraph groups by
				// data[clusterAttribute], so the AI cluster goes here too (a copy,
				// never written onto the search result)
				data: { ...node, ai_clusters: aiClusters[node.id] } as any,
				
				// Attach all possible cluster properties to the node
				// Reagraph will use the one specified by clusterAttribute
				documentType: nodeData.documentType,
				continent: nodeData.continent,
				country: nodeData.country,
				publisher: nodeData.publisher,
				ai_clusters: aiClusters[node.id], // AI cluster from the assignments map (e.g., "cluster_0")
				
				// Include fields needed by UI components
				summary: nodeData.summary,
				content: nodeData.content,
				url: nodeData.url, // URL for "Open Link" button
			};
			return graphNode;
		});

		return transformed;
	}, [nodes, getNodeColor, getNodeSize, aiClusters]);

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

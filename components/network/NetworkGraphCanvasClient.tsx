'use client';

import dynamic from 'next/dynamic';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/network/VisualizationControls';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { useGraphView } from '@/hooks/use-graph-view';
import { NodeContextMenu } from './NodeContextMenu';
import type { Node as DocNode } from '@/lib/config/types';
import { PERFORMANCE_CONFIG, NODE_SIZE } from '@/lib/config/graph-config';
import { Z_INDEX } from '@/lib/config/graph-config';
import { useAppStore } from '@/lib/stores/app-state';
import { useLayoutOverrides } from '@/hooks/use-layout-overrides';
import { useToggleContextOnClick } from '@/hooks/use-toggle-context-on-click';
import { useContextStore } from '@/lib/stores/context-store';
import {
	clusterContextLevels,
	clusterDisplayName,
	namesFromSuggestions,
} from '@/lib/clustering/cluster-display';
import { useCallback, useMemo } from 'react';
import type { ClusterRendererProps, NodeRendererProps } from 'reagraph';
import { ClusterRing } from './ClusterRing';
import { NodeWithRing } from './NodeWithRing';
import { GRAPH_THEME } from './graph-theme';
import { purpleNodeIds } from '@/lib/config/graph-colors';

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
	() => import('reagraph').then((m) => m.GraphCanvas),
	{ ssr: false }
);

/**
 * NetworkGraphCanvasClient component
 * The actual implementation that uses Reagraph - only rendered on client side
 */
export function NetworkGraphCanvasClient() {
	// What to draw, straight from the store; the context only holds the graph's ref
	const { graphNodes, graphEdges, getNodeColor, layoutType, showLabels, colorMode, nodeSizeMode, clusterMode } = useGraphView();
	const { graphRef } = useNetworkGraph();
	const lassoSelectedNodes = useAppStore((state) => state.lassoNodes);
	const setLassoNodes = useAppStore((state) => state.setLassoNodes);
	const finishLasso = useAppStore((state) => state.finishLasso);

	// Nodes hovered in the side panels (search results, context, cluster cards).
	// Read straight from the store so hovering doesn't rebuild the graph data.
	const highlightedNodes = useAppStore((state) => state.highlightedNodes);
	// New AI clusters re-run the layout even when "Cluster: AI clusters" was already picked
	const aiClustersVersion = useAppStore((state) => state.aiClustersVersion);
	// Same for "Cluster: Search" when a search is added or removed
	const searchCount = useAppStore((state) => state.rounds.length);
	const clusterVersion = clusterMode === 'ai_clusters' ? aiClustersVersion : clusterMode === 'search' ? searchCount : 0;
	const setHighlightedNodes = useAppStore((state) => state.setHighlightedNodes);
	// Lassoed nodes stay purple too, until they're sent or the lasso menu closes
	const highlightedSet = useMemo(
		() => purpleNodeIds(highlightedNodes, lassoSelectedNodes ?? []),
		[highlightedNodes, lassoSelectedNodes]
	);
	const actives = useMemo(() => [...highlightedSet], [highlightedSet]);
	// Hovering a node on the graph highlights it the same way hovering a card does
	const onNodePointerOver = useCallback((node: { id: string }) => setHighlightedNodes([node.id]), [setHighlightedNodes]);
	const onNodePointerOut = useCallback(
		(node: { id: string }) => {
			const current = useAppStore.getState().highlightedNodes;
			if (current.length === 1 && current[0] === node.id) setHighlightedNodes([]);
		},
		[setHighlightedNodes]
	);

	// Determine which cluster attribute to use
	// Simply use the clusterMode as the attribute name since all properties are attached to nodes
	const activeClusterAttribute =
		clusterMode !== 'none' ? clusterMode : undefined;
	const layoutOverrides = useLayoutOverrides(Boolean(activeClusterAttribute));

	// Clicking a node adds it to (or takes it out of) the context
	const toggleContext = useToggleContextOnClick();
	const contextNodes = useContextStore((s) => s.contextNodes);
	const contextIds = useMemo(() => contextNodes.map((n) => n.id), [contextNodes]);
	const contextIdSet = useMemo(() => new Set(contextIds), [contextIds]);

	// Each node's ring is black when it's in context, grey otherwise; its ball
	// keeps its own colour and turns purple only while hovered
	const renderNode = useCallback(
		(props: NodeRendererProps) => (
			<NodeWithRing {...props} inContext={contextIdSet.has(props.id)} hovered={highlightedSet.has(props.id)} />
		),
		[contextIdSet, highlightedSet]
	);

	// Each cluster ring's colour and name. Drawn separately from the nodes so a
	// new name or a context click never re-runs the layout.
	const clusterResults = useContextStore((s) => s.clusterResults);
	const clusterSuggestions = useContextStore((s) => s.clusterSuggestions);
	const clusterNames = useMemo(
		() => namesFromSuggestions(clusterResults?.clusters ?? [], clusterSuggestions),
		[clusterResults, clusterSuggestions]
	);
	const clusterLevels = useMemo(
		() => clusterContextLevels(graphNodes, activeClusterAttribute, contextIdSet),
		[graphNodes, activeClusterAttribute, contextIdSet]
	);
	const renderCluster = useCallback(
		(props: ClusterRendererProps) => {
			const id = props.label?.text ?? '';
			return (
				<ClusterRing
					{...props}
					name={clusterDisplayName(id, clusterNames)}
					level={clusterLevels[id] ?? 'none'}
				/>
			);
		},
		[clusterNames, clusterLevels]
	);

	const safeGraphNodes = Array.isArray(graphNodes) ? graphNodes : [];

	// The cluster a document sits in on the graph (for "Analyze the cluster in a new chat")
	const clusterOf = (nodeData: Record<string, unknown>) => {
		if (!activeClusterAttribute) return undefined;
		const key = nodeData[activeClusterAttribute];
		if (key === undefined || key === null || key === '') return undefined;
		const nodes = safeGraphNodes.filter((g) => (g.data as Record<string, unknown> | undefined)?.[activeClusterAttribute] === key).map((g) => g.data as DocNode);
		// The same name the cluster ring shows
		return { name: clusterDisplayName(String(key), clusterNames), nodes };
	};
	const safeGraphEdges = Array.isArray(graphEdges) ? graphEdges : [];


	return (
		<div className="flex flex-col h-full">
			{/* A container: on a narrow graph the settings show icons only, so they clear the legend */}
			<div className="@container absolute top-4 right-4 left-4 z-10 flex justify-end pointer-events-none">
				<VisualizationControls />
			</div>

			{/* data-node-count: how many nodes are drawn, for the browser tests (e2e/) */}
			<div
				data-testid="graph"
				data-node-count={safeGraphNodes.length}
				className="flex-1 w-full border rounded bg-gray-50 overflow-hidden relative">
				{/* Instruction for lasso selection */}
				<div
					style={{
						zIndex: Z_INDEX.graphOverlay,
						userSelect: 'none',
						position: 'absolute',
						bottom: 10,
						left: 10,
						background: 'rgba(0, 0, 0, .5)',
						color: 'white',
						padding: '5px 10px',
						borderRadius: '4px',
						fontSize: '12px',
					}}>
					<span>Click a node to add or remove it from this chat · Right-click for more · Shift + drag to lasso</span>
				</div>

				{safeGraphNodes.length > 0 ? (
					<GraphCanvas
						key={`graph-${nodeSizeMode}-${colorMode}-${clusterMode}-${clusterVersion}`}
						ref={graphRef}
						nodes={safeGraphNodes}
						edges={safeGraphEdges}
						layoutType={layoutType}
						// Same object between renders, or reagraph re-runs the layout
						layoutOverrides={layoutOverrides}
						// Recolours hovered and lassoed nodes purple without moving the layout
						actives={actives}
						renderNode={renderNode}
						onNodePointerOver={onNodePointerOver}
						onNodePointerOut={onNodePointerOut}
						theme={GRAPH_THEME}
						onRenderCluster={renderCluster}
						onNodeClick={toggleContext}
						// Lasso selection for multi-node selection (hold Shift + drag)
						lassoType="node"
						onLasso={setLassoNodes}
						onLassoEnd={finishLasso}
						// Node size comes from each node's own `size` (set in use-graph-data),
						// which reagraph's default sizing uses
						// Use 'cluster' for API assignments, or clusterMode for manual clustering
						clusterAttribute={activeClusterAttribute}
						// Enable node dragging
						draggable={true}
						labelType={showLabels ? PERFORMANCE_CONFIG.labelType : 'none'}
						animated={PERFORMANCE_CONFIG.animated}
						cameraMode={PERFORMANCE_CONFIG.cameraMode}
						contextMenu={({
							data,
							onClose,
						}: {
							data: any;
							onClose: () => void;
						}) => {
							// Only show context menu for nodes, not edges
							// Get the node data from the graph node
							const nodeData = data.data;

							/**
							 * ✅ BEST PRACTICE: Pass the full node data using spread operator
							 * This automatically includes all fields (including url, score, category, etc.)
							 * and prevents bugs from missing fields.
							 *
							 * See lib/types/node.ts for the complete Node interface definition.
							 */
							return (
								<div className="custom-context-menu-wrapper">
									<NodeContextMenu
										className="node-context-menu"
										node={{
											...nodeData,
											// Override only necessary computed values
											color: getNodeColor(nodeData),
											size: nodeData.size || NODE_SIZE.default,
										}}
										onClose={onClose}
										cluster={clusterOf(nodeData)}
									/>
								</div>
							);
						}}
					/>
				) : (
					<div className="flex items-center justify-center h-full text-gray-500">
						No graph data available. Try a different search query.
					</div>
				)}

				{/* Lasso Selection Menu - Gets data from context */}
				<LassoSelectionMenu className="lasso-menu" />
			</div>
		</div>
	);
}

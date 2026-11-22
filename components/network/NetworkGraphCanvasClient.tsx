'use client';
import { debugLog } from '@/lib/utils/debug';

import dynamic from 'next/dynamic';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/network/VisualizationControls';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { NodeContextMenu } from './NodeContextMenu';
import { PERFORMANCE_CONFIG, NODE_SIZE } from '@/lib/config/graph-config';
import { Z_INDEX } from '@/lib/config/graph-config';
import { logArrayOperation } from '@/lib/utils/error-tracker';
import { useNetworkStore } from '@/lib/stores/network-store';
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
	// Get all the data and functions from the context
	const {
		graphNodes,
		graphEdges,
		layoutType,
		showLabels,
		colorMode,
		nodeSizeMode,
		clusterMode,
		selections,
		graphRef,
		handleLasso,
		handleLassoEnd,
		onCanvasClick,
		getNodeColor,
		lassoSelectedNodes,
		showLassoMenu,
		lassoMenuPosition,
		closeLassoMenu,
		handleSendToContext,
		filteredResults,
	} = useNetworkGraph();

	// Nodes hovered in the side panels (search results, context, cluster cards).
	// Read straight from the store so hovering doesn't rebuild the graph data.
	const highlightedNodes = useNetworkStore((state) => state.highlightedNodes);
	const setHighlightedNodes = useNetworkStore((state) => state.setHighlightedNodes);
	const highlightedSet = useMemo(() => new Set(highlightedNodes), [highlightedNodes]);
	// Hovering a node on the graph highlights it the same way hovering a card does
	const onNodePointerOver = useCallback((node: { id: string }) => setHighlightedNodes([node.id]), [setHighlightedNodes]);
	const onNodePointerOut = useCallback(
		(node: { id: string }) => {
			const current = useNetworkStore.getState().highlightedNodes;
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

	// Log the selections prop being passed to GraphCanvas
	debugLog('🔍 [NetworkGraphCanvasClient] About to render GraphCanvas with:', {
		selectionsType: typeof selections,
		selections: selections,
		selectionsNodes: selections?.nodes,
		selectionsEdges: selections?.edges,
		selectionsNodesLength: Array.isArray(selections?.nodes) ? selections.nodes.length : 'Not array',
		selectionsEdgesLength: Array.isArray(selections?.edges) ? selections.edges.length : 'Not array',
		graphNodesLength: graphNodes.length,
		graphEdgesLength: graphEdges.length
	});

	if (selections?.nodes) {
		logArrayOperation('selections.nodes check', selections.nodes, 'NetworkGraphCanvasClient before GraphCanvas');
	}
	if (selections?.edges) {
		logArrayOperation('selections.edges check', selections.edges, 'NetworkGraphCanvasClient before GraphCanvas');
	}

	// Create safe props for Reagraph to prevent internal array errors
	const safeSelections = {
		nodes: Array.isArray(selections?.nodes) ? selections.nodes : [],
		edges: Array.isArray(selections?.edges) ? selections.edges : []
	};

	const safeGraphNodes = Array.isArray(graphNodes) ? graphNodes : [];
	const safeGraphEdges = Array.isArray(graphEdges) ? graphEdges : [];

	debugLog('🔍 [NetworkGraphCanvasClient] Safe props created:', {
		safeSelections,
		safeGraphNodesLength: safeGraphNodes.length,
		safeGraphEdgesLength: safeGraphEdges.length
	});

	return (
		<div className="flex flex-col h-full">
			<div className="absolute top-4 right-4 z-10">
				<VisualizationControls />
			</div>

			<div className="flex-1 w-full border rounded bg-gray-50 overflow-hidden relative">
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
					<span>Click a node to add or remove it from context · Shift + drag to lasso</span>
				</div>

				{safeGraphNodes.length > 0 ? (
					<GraphCanvas
						key={`graph-${nodeSizeMode}-${colorMode}-${clusterMode}`}
						ref={graphRef}
						nodes={safeGraphNodes}
						edges={safeGraphEdges}
						layoutType={layoutType}
						// Same object between renders, or reagraph re-runs the layout
						layoutOverrides={layoutOverrides}
						// Temporarily disable selections to isolate the error
						// selections={safeSelections}
						// Recolours hovered nodes purple without moving the layout
						actives={highlightedNodes}
						renderNode={renderNode}
						onNodePointerOver={onNodePointerOver}
						onNodePointerOut={onNodePointerOut}
						theme={GRAPH_THEME}
						onRenderCluster={renderCluster}
						onNodeClick={toggleContext}
						onCanvasClick={(event?: MouseEvent) => event && onCanvasClick(event)}
						// Lasso selection for multi-node selection (hold Shift + drag)
						lassoType="node"
						onLasso={(ids: string[]) => handleLasso(ids)}
						onLassoEnd={(ids: string[]) => handleLassoEnd(ids)}
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

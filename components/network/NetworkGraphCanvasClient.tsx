'use client';
import { debugLog } from '@/lib/utils/debug';

import dynamic from 'next/dynamic';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/network/VisualizationControls';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { NodeContextMenu } from './NodeContextMenu';
import { GRAPH_LAYOUT_CONFIG, PERFORMANCE_CONFIG, NODE_SIZE } from '@/lib/config/graph-config';
import { Z_INDEX } from '@/lib/config/graph-config';
import { logArrayOperation } from '@/lib/utils/error-tracker';

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
		handleCustomNodeClick,
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

	// Determine which cluster attribute to use
	// Simply use the clusterMode as the attribute name since all properties are attached to nodes
	const activeClusterAttribute =
		clusterMode !== 'none' ? clusterMode : undefined;

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
					<span>Hold Shift and Drag to Lasso Select</span>
				</div>

				{safeGraphNodes.length > 0 ? (
					<GraphCanvas
						key={`graph-${nodeSizeMode}-${colorMode}-${clusterMode}`}
						ref={graphRef}
						nodes={safeGraphNodes}
						edges={safeGraphEdges}
						layoutType={layoutType}
						layoutOverrides={{
							clusterStrength: activeClusterAttribute ? GRAPH_LAYOUT_CONFIG.clusterStrength : 0,
							linkDistance: GRAPH_LAYOUT_CONFIG.linkDistance,
							nodeStrength: GRAPH_LAYOUT_CONFIG.nodeStrength,
						}}
						// Temporarily disable selections to isolate the error
						// selections={safeSelections}
						onNodeClick={handleCustomNodeClick}
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

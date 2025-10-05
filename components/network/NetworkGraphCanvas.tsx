'use client';

import dynamic from 'next/dynamic';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/network/VisualizationControls';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { NodeContextMenu } from './NodeContextMenu';
import {
	GRAPH_LAYOUT_CONFIG,
	Z_INDEX,
	PERFORMANCE_CONFIG,
	NODE_SIZE,
} from '@/lib/constants/graph-config';

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
	() => import('reagraph').then((m) => m.GraphCanvas),
	{ ssr: false }
);

/**
 * NetworkGraphCanvas component
 * Visualizes search results as a network graph using Reagraph and the NetworkGraphProvider context
 */
export function NetworkGraphCanvas() {
	// Get all the data and functions from the context
	const {
		graphNodes,
		graphEdges,
		layoutType,
		showLabels,
		colorMode,
		nodeSizeMode,
		clusterMode,
		clusterAssignments,
		selections,
		graphRef,
		nodePositionsRef,
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
	const activeClusterAttribute = clusterMode !== 'none' ? clusterMode : undefined;

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

				{graphNodes.length > 0 ? (
					<GraphCanvas
						key={`graph-${nodeSizeMode}-${colorMode}-${clusterMode}`}
						ref={graphRef}
						nodes={graphNodes}
						edges={graphEdges}
						layoutType={layoutType as any}
						layoutOverrides={{
							clusterStrength: activeClusterAttribute ? 0.8 : 0,
							linkDistance: 100,
							nodeStrength: -150,
						}}
						selections={selections}
						onNodeClick={handleCustomNodeClick}
						onCanvasClick={onCanvasClick}
						// Lasso selection for multi-node selection (hold Shift + drag)
						lassoType="node"
						onLasso={(selection: any) =>
							handleLasso(selection?.nodes || selection || [])
						}
						onLassoEnd={(selection: any, event?: MouseEvent) =>
							handleLassoEnd(selection?.nodes || selection || [], event)
						}
						// Use direct node size property
						nodeSize={(node) => (node.size as number) || NODE_SIZE.default}
						// Use 'cluster' for API assignments, or clusterMode for manual clustering
						clusterAttribute={activeClusterAttribute}
						// Enable node dragging
						labelType={showLabels ? PERFORMANCE_CONFIG.labelType : 'none'}
						edgeStyle={PERFORMANCE_CONFIG.edgeStyle}
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
						getNodePosition={(
							id: string,
							context?: {
								drags?: Record<
									string,
									{ position: { x: number; y: number; z: number } }
								>;
							}
						) => {
							// Respect active drags first (Reagraph Playbook Rule #3)
							if (context?.drags?.[id]?.position) {
								return context.drags[id].position;
							}
							// Otherwise use stored position
							return nodePositionsRef.current.get(id) || null;
						}}
						onNodeDragEnd={(
							node: any,
							position: { x: number; y: number; z: number }
						) => {
							nodePositionsRef.current.set(node.id, position);
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

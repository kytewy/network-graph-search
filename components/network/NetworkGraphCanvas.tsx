'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/ui/VisualizationControls';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { NodeContextMenu, Node as NodeType } from './NodeComponents';
import { GRAPH_LAYOUT_CONFIG, Z_INDEX, PERFORMANCE_CONFIG, NODE_SIZE } from '@/lib/constants/graph-config';

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
					<div className="absolute inset-0">
						{/* @ts-expect-error - Reagraph types are incomplete. These props exist but aren't in the type definitions:
					    - lassoType, onLasso, onLassoEnd: Documented lasso selection API
					    - contextMenu: Documented context menu API
					    See: https://reagraph.dev/docs/advanced/Selection */}
						<GraphCanvas
							key={`graph-${nodeSizeMode}-${colorMode}`}
							ref={graphRef}
							nodes={graphNodes}
							edges={graphEdges}
							layoutType={layoutType as any}
							layoutOverrides={GRAPH_LAYOUT_CONFIG}
							selections={selections}
							onNodeClick={handleCustomNodeClick}
							// Custom canvas click handler that clears selections
							onCanvasClick={onCanvasClick}
							// Lasso selection for multi-node selection (hold Shift + drag)
							lassoType="node"
							onLasso={(selection: any) => handleLasso(selection?.nodes || selection || [])}
							onLassoEnd={(selection: any) => handleLassoEnd(selection?.nodes || selection || [])}
							// Use direct node size property
							nodeSize={(node) => node.size || NODE_SIZE.default}
							// Use clusterAttribute if clusterMode is not 'none'
							clusterAttribute={
								clusterMode !== 'none' ? clusterMode : undefined
							}
							// Enable node dragging
							draggable={true}
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
								if (!data || !data.data) return null;

								// Get the node data from the graph node
								const nodeData = data.data;

								return (
									<div className="custom-context-menu-wrapper">
										<NodeContextMenu
											className="node-context-menu"
											node={{
												id: nodeData.id,
												label: nodeData.label,
												type: nodeData.type || 'document',
												size: nodeData.size || NODE_SIZE.default,
												color: getNodeColor(nodeData),
												summary: nodeData.summary || '',
												content: nodeData.content || nodeData.text || '',
												similarity: nodeData.similarity || nodeData.score,
												sourceType: nodeData.category || '',
												continent: nodeData.continent || '',
												country: nodeData.country || '',
											}}
											onClose={onClose}
										/>
									</div>
								);
							}}
							getNodePosition={(id: string, context?: { drags?: Record<string, { position: { x: number; y: number; z: number } }> }) => {
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
					</div>
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

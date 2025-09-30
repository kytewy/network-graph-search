'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/ui/VisualizationControls';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { NodeContextMenu, Node as NodeType } from './NodeComponents';

// Extend GraphCanvasRef to include the methods we need
interface ExtendedGraphCanvasRef extends GraphCanvasRef {
	reorganize?: () => void;
	arrangeAsTree?: () => void;
}

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
	() => import('reagraph').then((m) => m.GraphCanvas),
	{ ssr: false }
);

/**
 * NetworkGraphWithContext component
 * Visualizes search results as a network graph using Reagraph and the NetworkGraphProvider context
 */
export function NetworkGraphWithContext() {
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
		reorganizeLayoutRef,
		arrangeAsTreeRef,
		handleCustomNodeClick,
		handleLasso,
		handleLassoEnd,
		onCanvasClick,
		getNodeSize,
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
						zIndex: 9,
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
						<GraphCanvas
							ref={graphRef as React.RefObject<GraphCanvasRef>}
							nodes={graphNodes}
							edges={graphEdges}
							layoutType={layoutType as any}
							layoutOverrides={{
								linkDistance: 80,
								nodeStrength: -250,
								gravity: 0.5,
							}}
							selections={selections}
							onNodeClick={handleCustomNodeClick}
							// Use our custom handler that clears selections
							// @ts-ignore - Type mismatch with onCanvasClick handler
							onCanvasClick={onCanvasClick}
							// @ts-ignore - lassoType is available in reagraph but not in the types
							lassoType="node"
							// @ts-ignore - onLasso is available in reagraph but not in the types
							onLasso={handleLasso}
							onLassoEnd={handleLassoEnd}
							// Use direct nodeSize prop to set custom sizes
							nodeSize={(node) => getNodeSize(node.data)}
							// Use clusterAttribute if clusterMode is not 'none'
							clusterAttribute={
								clusterMode !== 'none' ? clusterMode : undefined
							}
							labelType={showLabels ? 'auto' : 'none'}
							edgeStyle="curved"
							animated={true} // Enable animation for better visualization
							cameraMode="pan"
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
												size: getNodeSize(nodeData),
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
							getNodePosition={(id: string) => {
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

				{/* Lasso Selection Menu */}
				{showLassoMenu && lassoSelectedNodes.length > 0 && (
					<LassoSelectionMenu
						position={lassoMenuPosition}
						selectedNodes={
							filteredResults.filter((node) =>
								lassoSelectedNodes.includes(node.id)
							) as any
						}
						onClose={closeLassoMenu}
						onSendToContext={handleSendToContext}
						className="lasso-menu"
					/>
				)}
			</div>
		</div>
	);
}

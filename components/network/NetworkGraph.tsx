'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
// import './NetworkGraph.css'; // Temporarily commented out to see what it looks like without these styles
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';
import { NodeContextMenu, Node as NodeType } from './NewNodeComponents';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/ui/VisualizationControls';
import { useNetworkStore } from '@/lib/stores/network-store';
import { useContextStore } from '@/lib/stores/context-store';
import { toast } from 'sonner';

// Extend GraphCanvasRef to include the methods we need
interface ExtendedGraphCanvasRef extends GraphCanvasRef {
	reorganize?: () => void;
	arrangeAsTree?: () => void;
}

// Define extended types for reagraph's useSelection hook to support lasso selection
interface ExtendedUseSelectionResult {
	selections: any;
	onNodeClick: (node: GraphNode) => void;
	onCanvasClick: (event: MouseEvent) => void;
	onLasso?: (selections: string[]) => void;
	onLassoEnd?: (selections: string[]) => void;
}

interface ExtendedUseSelectionOptions {
	ref: React.RefObject<GraphCanvasRef | null>;
	nodes: GraphNode[];
	edges: GraphEdge[];
	type?: 'single' | 'multi';
}

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
	() => import('reagraph').then((m) => m.GraphCanvas),
	{ ssr: false }
);

// Define the allowed layout types for Reagraph
type LayoutType =
	| 'forceDirected2d'
	| 'forceDirected3d'
	| 'hierarchical'
	| 'radial'
	| 'forceAtlas2'
	| 'noOverlap'
	| 'concentric2d'
	| 'radialOut2d';

/**
 * NetworkGraph component
 * Visualizes search results as a network graph using Reagraph
 * Supports different layout types and node selection
 */
export function NetworkGraph() {
	const filteredResults = useAppStore((state) => state.filteredResults);
	const filteredLinks = useAppStore((state) => state.filteredLinks);
	const networkLayoutType = useNetworkStore((state) => state.layoutType);

	// Map network store layout type to Reagraph layout type
	const getReagraphLayoutType = (): LayoutType => {
		switch (networkLayoutType) {
			case 'forceDirected':
				return 'forceDirected2d';
			case 'concentric':
				return 'concentric2d';
			case 'radial':
				return 'radialOut2d';
			default:
				return 'forceDirected2d';
		}
	};

	const [layoutType, setLayoutType] = useState<LayoutType>(
		getReagraphLayoutType()
	);
	// Get visualization settings from app store
	const showLabels = useAppStore((state) => state.showLabels);
	const colorMode = useAppStore((state) => state.colorMode);
	const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);
	const clusterMode = useAppStore((state) => state.clusterMode);

	// Get setters from app store
	const setShowLabels = useAppStore((state) => state.setShowLabels);
	const setColorMode = useAppStore((state) => state.setColorMode);
	const setNodeSizeMode = useAppStore((state) => state.setNodeSizeMode);
	const setClusterMode = useAppStore((state) => state.setClusterMode);
	const graphRef = useRef<ExtendedGraphCanvasRef | null>(null);

	// Update layout when network store changes
	useMemo(() => {
		setLayoutType(getReagraphLayoutType());
	}, [networkLayoutType]);

	// State for context menu
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);

	// State for lasso selection
	const [lassoSelectedNodes, setLassoSelectedNodes] = useState<string[]>([]);
	const [showLassoMenu, setShowLassoMenu] = useState(false);
	const [lassoMenuPosition, setLassoMenuPosition] = useState({ x: 0, y: 0 });

	// Node positions reference for maintaining positions during updates
	const nodePositionsRef = useRef<
		Map<string, { x: number; y: number; z: number }>
	>(new Map());

	// Get color based on node property and colorMode
	const getNodeColor = (node: Node) => {
		switch (colorMode) {
			case 'sourceType':
				return node.type === 'article'
					? '#4f46e5'
					: node.type === 'document'
					? '#10b981'
					: node.type === 'webpage'
					? '#f59e0b'
					: node.type === 'pdf'
					? '#ef4444'
					: '#a855f7';
			case 'continent':
				return node.continent === 'North America'
					? '#4f46e5'
					: node.continent === 'Europe'
					? '#10b981'
					: node.continent === 'Asia'
					? '#f59e0b'
					: node.continent === 'Africa'
					? '#ef4444'
					: node.continent === 'South America'
					? '#a855f7'
					: '#6b7280'; // Unknown/Other
			case 'country':
				// Specific colors for important countries, gray for others
				return node.country === 'USA'
					? '#1e40af' // Dark blue
					: node.country === 'Canada'
					? '#ef4444' // Red
					: node.country === 'European Union'
					? '#60a5fa' // Light blue
					: '#6b7280'; // Gray for other countries
			case 'similarityRange':
				// Color by similarity percentage (using score) matching the histogram ranges
				if (node.score !== undefined) {
					// Convert score to percentage (0-1 to 0-100)
					const similarityPercent = Math.round(node.score * 100);

					if (similarityPercent >= 81) return '#22c55e'; // Green for 81-100%
					if (similarityPercent >= 61) return '#84cc16'; // Light green for 61-80%
					if (similarityPercent >= 41) return '#eab308'; // Yellow for 41-60%
					if (similarityPercent >= 20) return '#f97316'; // Orange for 20-40%
					return '#ef4444'; // Red for <20%
				}
				return '#6b7280'; // Default gray if no score
			case 'documentType':
				return node.type === 'article'
					? '#4f46e5'
					: node.type === 'document'
					? '#10b981'
					: node.type === 'webpage'
					? '#f59e0b'
					: node.type === 'pdf'
					? '#ef4444'
					: '#a855f7';
			default:
				return node.category === 'article' ? '#4f46e5' : '#10b981';
		}
	};

	// Force refresh when nodeSizeMode changes
	const [refreshKey, setRefreshKey] = useState(0);

	// Update refresh key when nodeSizeMode changes to force re-render
	useEffect(() => {
		setRefreshKey((prev) => prev + 1);
	}, [nodeSizeMode]);

	// Get node size based on nodeSizeMode
	const getNodeSize = (node: Node) => {
		switch (nodeSizeMode) {
			case 'similarity':
				// Use score for similarity (0-1 value)
				if (node.score !== undefined) {
					const similarityPercent = Math.round(node.score * 100);

					// 5 different size buckets based on similarity
					if (similarityPercent >= 81) return 20; // Largest
					if (similarityPercent >= 61) return 16;
					if (similarityPercent >= 41) return 12;
					if (similarityPercent >= 20) return 8;
					return 4; // Smallest
				}
				return 10; // Default size

			case 'contentLength':
				// Size based on content length
				const contentLength = (node.content || '').length;

				if (contentLength > 1000) return 20; // 1000+ chars
				if (contentLength > 500) return 12; // 501-1000 chars
				return 6; // Under 500 chars

			default:
				return 10; // Default size
		}
	};

	// Convert nodes to Reagraph nodes
	const graphNodes = useMemo(() => {
		if (!filteredResults || filteredResults.length === 0) return [];

		return filteredResults.map((node) => ({
			id: node.id,
			label: node.label || node.id,
			fill: getNodeColor(node),
			size: getNodeSize(node), // Size is still used for the node object, even though we use nodeSize prop
			score: node.score || 0.5,
			category: node.category || '',
			data: node,
		}));
	}, [filteredResults, colorMode, nodeSizeMode]);

	// Convert links to Reagraph edges
	const graphEdges = useMemo(() => {
		if (!filteredLinks || filteredLinks.length === 0) return [];

		return filteredLinks.map((link) => ({
			id: link.id || `${link.source}-${link.target}`,
			source: link.source,
			target: link.target,
			label: link.label || '',
			type: link.type || 'default',
			data: link,
		}));
	}, [filteredLinks]);

	// Selection configuration
	const selectionConfig = useMemo(() => {
		if (graphNodes.length === 0) {
			// Return a dummy config that won't be used
			return {
				ref: graphRef as React.RefObject<GraphCanvasRef>,
				nodes: [],
				edges: [],
			};
		}

		return {
			ref: graphRef as React.RefObject<GraphCanvasRef>,
			nodes: graphNodes,
			edges: graphEdges,
		};
	}, [graphNodes, graphEdges, graphRef]);

	// Selection handling with extended types for lasso support
	const {
		selections,
		onNodeClick: handleNodeClick,
		onCanvasClick,
		onLasso,
		onLassoEnd,
	} = useSelection(selectionConfig) as ExtendedUseSelectionResult;

	// Custom node click handler
	const handleCustomNodeClick = (node: GraphNode) => {
		// Call the built-in handler
		if (graphRef.current) {
			handleNodeClick(node);
		}

		// Update selected node if data exists
		if (node.data) {
			setSelectedNode(node.data as Node);
		}
	};

	// Handle lasso selection
	const handleLasso = (selectedIds: string[]) => {
		setLassoSelectedNodes(selectedIds);
	};

	// Handle lasso end event
	const handleLassoEnd = (selectedIds: string[], event?: MouseEvent) => {
		// If nodes were selected, show the lasso menu
		if (selectedIds.length > 0) {
			setLassoSelectedNodes(selectedIds);

			// Get mouse position for the menu or use center of screen
			const mousePosition = {
				x: window.innerWidth / 2 - 200, // Center horizontally, offset by half the menu width
				y: 100, // Position near the top of the screen
			};
			setLassoMenuPosition(mousePosition);
			setShowLassoMenu(true);
		}
	};

	// Access the context store
	const addNodesToContext = useContextStore((state) => state.addNodesToContext);

	// Handler for sending selected nodes to context
	const handleSendToContext = (nodes: Node[]) => {
		console.log('Sending nodes to context:', nodes.length);
		console.log(
			'Node content example:',
			nodes[0]?.content?.substring(0, 50) + '...'
		);

		// Show toast notification
		toast.success(
			`Added ${nodes.length} node${nodes.length > 1 ? 's' : ''} to context`,
			{
				description:
					'Node content is now available in the Context Management panel',
				duration: 3000,
			}
		);

		addNodesToContext(nodes);
	};

	// Close lasso menu
	const closeLassoMenu = () => {
		setShowLassoMenu(false);
		setLassoSelectedNodes([]);
	};

	// Create refs for advanced layout functions
	const reorganizeLayoutRef = useRef<(() => void) | null>(null);
	const arrangeAsTreeRef = useRef<(() => void) | null>(null);

	// Handle layout change
	const handleLayoutChange = (layout: string) => {
		setLayoutType(layout as LayoutType);

		// Map Reagraph layout type to network store layout type
		let networkLayout: 'forceDirected' | 'concentric' | 'radial';
		if (layout === 'forceDirected2d') {
			networkLayout = 'forceDirected';
		} else if (layout === 'concentric2d') {
			networkLayout = 'concentric';
			// Reset cluster mode when switching to a non-force-directed layout
			if (clusterMode !== 'none') {
				setClusterMode('none');
			}
		} else if (layout === 'radialOut2d') {
			networkLayout = 'radial';
			// Reset cluster mode when switching to a non-force-directed layout
			if (clusterMode !== 'none') {
				setClusterMode('none');
			}
		} else {
			networkLayout = 'forceDirected';
		}

		useNetworkStore.getState().setLayoutType(networkLayout);
	};

	// Set up reorganize layout function
	useEffect(() => {
		reorganizeLayoutRef.current = () => {
			if (graphRef.current && graphRef.current.reorganize) {
				graphRef.current.reorganize();
			}
		};

		arrangeAsTreeRef.current = () => {
			if (graphRef.current && graphRef.current.arrangeAsTree) {
				graphRef.current.arrangeAsTree();
			}
		};
	}, [graphRef]);

	return (
		<div className="flex flex-col h-full">
			<div className="absolute top-4 right-4 z-10">
				<VisualizationControls
					currentLayout={layoutType}
					onLayoutChange={handleLayoutChange}
					currentColorBy={colorMode}
					onColorByChange={(colorBy: string) => {
						setColorMode(
							colorBy as
								| 'sourceType'
								| 'continent'
								| 'similarityRange'
								| 'documentType'
								| 'country'
						);
					}}
					currentSizeBy={nodeSizeMode}
					onSizeByChange={(sizeBy: string) => {
						setNodeSizeMode(
							sizeBy as
								| 'none'
								| 'contentLength'
								| 'summaryLength'
								| 'similarity'
						);
					}}
					currentClusterBy={clusterMode}
					onClusterByChange={(clusterBy: string) => {
						setClusterMode(
							clusterBy as
								| 'none'
								| 'type'
								| 'continent'
								| 'country'
								| 'sourceType'
						);
					}}
					showLabels={showLabels}
					onShowLabelsChange={setShowLabels}
					reorganizeLayoutRef={reorganizeLayoutRef}
					arrangeAsTreeRef={arrangeAsTreeRef}
					hasApiKey={true}
				/>
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
							key={`graph-${refreshKey}`} // Force re-render when nodeSizeMode changes
							ref={graphRef}
							nodes={graphNodes}
							edges={graphEdges}
							layoutType={layoutType as any}
							layoutOverrides={{
								linkDistance: 80,
								nodeStrength: -250,
								gravity: 0.5,
							}}
							selections={selections || []}
							onNodeClick={handleCustomNodeClick}
							// @ts-ignore - onCanvasClick expects a MouseEvent parameter
							onCanvasClick={onCanvasClick}
							// @ts-ignore - lassoType is available in reagraph but not in the types
							lassoType="node"
							// @ts-ignore - onLasso is available in reagraph but not in the types
							onLasso={handleLasso}
							// @ts-ignore - onLassoEnd is available in reagraph but not in the types
							onLassoEnd={handleLassoEnd}
							// Use direct nodeSize prop to set custom sizes
							nodeSize={(node) => getNodeSize(node.data)}
							// Use clusterAttribute if clusterMode is not 'none'
							clusterAttribute={clusterMode !== 'none' ? clusterMode : undefined}
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
								const nodeData = data.data as Node;

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
								node: GraphNode,
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

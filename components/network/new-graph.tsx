'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import { nodeColors } from '@/lib/theme/colors';
import { NodeContextMenu, Node as NodeType } from './NewNodeComponents';
import { LassoSelectionMenu } from './LassoSelectionMenu';

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
	() =>
		import('reagraph').then((m) => {
			// Log the module to inspect available layouts
			console.log('Reagraph module:', m);
			return m.GraphCanvas;
		}),
	{ ssr: false }
) as any; // Use type assertion to avoid TypeScript errors with contextMenu prop

interface Node {
	id: string;
	label: string;
	type: string;
	size: number;
	color: string;
	summary: string; // Brief description for tooltip
	content: string; // Full article content for modal
	similarity?: number;
	url?: string;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
	sourceType?: string;
}

interface Link {
	source: string;
	target: string;
	type: string;
	strength: number;
}

interface NetworkGraphProps {
	nodes: Node[];
	links: Link[];
	highlightedNodes: string[];
	highlightedLinks: string[];
	showLabels: boolean;
	onNodeClick?: (node: Node) => void;
	onNodeSelection?: (nodeIds: string[]) => void;
	selectedNodes?: string[];
	expandedNodes?: string[];
	onNodeExpand?: (nodeId: string) => void;
	layoutType?: 'forceDirected' | 'concentric' | 'radial';
	onReorganizeLayout?: React.MutableRefObject<(() => void) | null>;
	onArrangeAsTree?: React.MutableRefObject<(() => void) | null>;
	onSendToContext?: (nodes: Node[]) => void;
}

export default function NetworkGraph({
	nodes,
	links,
	highlightedNodes,
	highlightedLinks,
	showLabels,
	onNodeClick,
	onNodeSelection,
	selectedNodes = [],
	expandedNodes = [],
	onNodeExpand,
	layoutType = 'forceDirected',
	onReorganizeLayout,
	onArrangeAsTree,
	onSendToContext,
}: NetworkGraphProps) {
	// Reference to the GraphCanvas component
	const ref = useRef<GraphCanvasRef | null>(null);

	// State for dimensions and layout
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
	const [currentLayout, setCurrentLayout] = useState(layoutType);

	// State for context menu type
	const [useRadialMenu, setUseRadialMenu] = useState(true);
	
	// State for node selection
	const [selectedArticle, setSelectedArticle] = useState<Node | null>(null);
	
	// State for lasso selection
	const [lassoSelectedNodes, setLassoSelectedNodes] = useState<string[]>([]);
	const [showLassoMenu, setShowLassoMenu] = useState(false);
	const [lassoMenuPosition, setLassoMenuPosition] = useState({ x: 0, y: 0 });

	// Node positions reference for maintaining positions during updates
	const nodePositionsRef = useRef<
		Map<string, { x: number; y: number; z: number }>
	>(new Map());

	// Convert nodes and links to Reagraph format
	const graphNodes: GraphNode[] = nodes.map((node) => ({
		id: node.id,
		label: node.label,
		fill: node.color, // Add fill property for node coloring
		data: {
			...node,
			// Store original node data for tooltips and other functionality
		},
	}));

	const graphEdges: GraphEdge[] = links.map((link, index) => ({
		id: `${link.source}-${link.target}`,
		source: link.source,
		target: link.target,
		label: link.type,
		data: {
			...link,
			strength: link.strength,
			highlighted: highlightedLinks.includes(`${link.source}-${link.target}`),
		},
	}));

	// Selection hook from Reagraph
	const {
		selections,
		onNodeClick: handleNodeClick,
		onCanvasClick,
		// Cast to access the lasso methods that aren't in the TypeScript definition
	} = useSelection({
		ref,
		nodes: graphNodes,
		edges: graphEdges,
		// @ts-ignore - type is available in reagraph but not in the types
		type: 'multi'
	}) as ExtendedUseSelectionResult;

	// Update dimensions on resize
	useEffect(() => {
		const updateDimensions = () => {
			const container = document.querySelector('.network-graph-container');
			if (container) {
				const rect = container.getBoundingClientRect();
				setDimensions({ width: rect.width, height: rect.height });
			}
		};

		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		return () => window.removeEventListener('resize', updateDimensions);
	}, []);

	// Handle layout changes
	useEffect(() => {
		// Update current layout when prop changes
		setCurrentLayout(layoutType);
	}, [layoutType]);

	// Handle layout reorganization
	useEffect(() => {
		if (onReorganizeLayout) {
			onReorganizeLayout.current = () => {
				nodePositionsRef.current.clear();
				if (ref.current) {
					ref.current.resetCamera();
					ref.current.forceUpdate();
				}
			};
		}

		if (onArrangeAsTree) {
			onArrangeAsTree.current = () => {
				nodePositionsRef.current.clear();
				if (ref.current) {
					ref.current.resetCamera();
					ref.current.forceUpdate();
				}
			};
		}
	}, [onReorganizeLayout, onArrangeAsTree]);

	// Custom node click handler to work with existing code
	const handleCustomNodeClick = (node: GraphNode) => {
		// Only call the built-in handler if the ref exists
		if (ref.current) {
			handleNodeClick(node);
		}

		// Call the custom handler if provided
		if (onNodeClick && node.data) {
			onNodeClick(node.data as Node);
		}

		// Update selected nodes if handler is provided
		if (onNodeSelection) {
			// Get current selections from the Reagraph selection hook
			const newSelections = selections.nodes.map((n: GraphNode) => n.id);

			// If the clicked node isn't already in the selections, add it
			if (!newSelections.includes(node.id)) {
				newSelections.push(node.id);
			}

			// Update the selected nodes in the parent component
			onNodeSelection(newSelections);
		}
	};
	
	// Handle lasso selection
	const handleLasso = (selectedIds: string[]) => {
		setLassoSelectedNodes(selectedIds);
	};
	
	// Handle lasso selection end
	const handleLassoEnd = (selectedIds: string[]) => {
		if (selectedIds.length > 0) {
			// Get mouse position for the menu
			// Position in the center of the screen for better visibility
			const mousePosition = { 
				x: Math.max(100, Math.min(window.innerWidth / 2, window.innerWidth - 400)), 
				y: Math.max(100, Math.min(window.innerHeight / 3, window.innerHeight - 400)) 
			};
			setLassoMenuPosition(mousePosition);
			setShowLassoMenu(true);
			
			// Update selected nodes if handler is provided
			if (onNodeSelection) {
				onNodeSelection(selectedIds);
			}
		}
	};
	
	// Get the selected nodes as Node objects
	const getSelectedNodesData = (): Node[] => {
		return nodes.filter(node => lassoSelectedNodes.includes(node.id));
	};
	
	// Handle sending selected nodes to context
	const handleSendToContext = (selectedNodes: Node[]) => {
		if (onSendToContext) {
			onSendToContext(selectedNodes);
		}
	};
	
	// Close the lasso menu
	const closeLassoMenu = () => {
		setShowLassoMenu(false);
	};


	// Determine layout type based on current layout
	const reagraphLayoutType =
		currentLayout === 'forceDirected'
			? 'forceDirected2d'
			: currentLayout === 'concentric'
			? 'concentric2d'
			: 'radialOut2d'; // Default to radialOut2d for radial layout

	// Layout overrides for different layouts
	const layoutOverrides =
		currentLayout === 'forceDirected'
			? {
					linkDistance: 100, // Standard distance for force-directed
					nodeStrength: -300, // Standard repulsion
					clusterStrength: 0.8,
					linkStrengthIntraCluster: 0.8,
					linkStrengthInterCluster: 0.3,
					centerInertia: 1,
					dimensions: 2,
			  }
			: currentLayout === 'concentric'
			? {
					radius: 150, // Base radius for concentric layout
					concentricSpacing: 120, // Distance between concentric circles
					// Note: Nodes should ideally have a 'level' property for best results
			  }
			: {
					// Radial layout parameters
					linkDistance: 80,
					nodeStrength: -200,
					centerInertia: 1,
					dimensions: 2,
			  };

	return (
		<div
			className="network-graph-container relative w-full h-full">
			{showLassoMenu && lassoSelectedNodes.length > 0 && (
				<LassoSelectionMenu
					selectedNodes={getSelectedNodesData()}
					onClose={closeLassoMenu}
					onNodeSelection={onNodeSelection}
					onSendToContext={handleSendToContext}
					position={lassoMenuPosition}
				/>
			)}
			
			<div style={{
				zIndex: 9,
				userSelect: 'none',
				position: 'absolute',
				top: 10,
				right: 10,
				background: 'rgba(0, 0, 0, .5)',
				color: 'white',
				padding: '5px 10px',
				borderRadius: '4px',
				fontSize: '12px'
			}}>
				<span>Hold Shift and Drag to Lasso Select</span>
			</div>
			
			<GraphCanvas
				ref={ref}
				nodes={graphNodes}
				edges={graphEdges}
				layoutType={reagraphLayoutType as any}
				layoutOverrides={layoutOverrides}
				draggable={true}
				selections={selections}
				onNodeClick={handleCustomNodeClick}
				onCanvasClick={onCanvasClick}
				// @ts-ignore - lassoType is available in reagraph but not in the types
				lassoType="node"
				// @ts-ignore - onLasso is available in reagraph but not in the types
				onLasso={handleLasso}
				// @ts-ignore - onLassoEnd is available in reagraph but not in the types
				onLassoEnd={handleLassoEnd}
				animated={true} // Enable animation for all layouts
				labelType={showLabels ? 'all' : 'none'}
				edgeStyle="curved"
				sizingType="attribute"
				sizingAttribute="size"
				minNodeSize={5}
				maxNodeSize={25}
				contextMenu={(props: any) => {
					const { data, onClose } = props;
					// Only show context menu for nodes, not edges
					if (!data || !data.data) return null;
					
					// Get the node data from the graph node
					const nodeData = data.data as NodeType;
					
					return (
						<NodeContextMenu
							node={nodeData}
							onClose={onClose}
							onNodeSelection={onNodeSelection}
							selectedNodes={selectedNodes}
							expandedNodes={expandedNodes}
							onNodeExpand={onNodeExpand}
						/>
					);
				}}
				nodeColor={(node: GraphNode) => {
					const isHighlighted = highlightedNodes.includes(node.id);
					const isSelected = selectedNodes.includes(node.id);
					const isExpanded = expandedNodes.includes(node.id);

					if (isSelected) return nodeColors.primary; // Selected color (blue)
					if (isExpanded) return nodeColors.secondary; // Expanded color (green)
					if (isHighlighted) return nodeColors.neutral; // Highlighted color (gray)

					return node.fill || (node.data as Node).color; // Use fill property with fallback to node data
				}}
				nodeOutline={(node: GraphNode) => {
					const isHighlighted = highlightedNodes.includes(node.id);
					const isSelected = selectedNodes.includes(node.id);
					const isExpanded = expandedNodes.includes(node.id);

					if (isSelected) return { color: nodeColors.primary, width: 3 };
					if (isExpanded) return { color: nodeColors.secondary, width: 3 };
					if (isHighlighted) return { color: nodeColors.neutral, width: 2 };

					return { color: 'transparent', width: 0 };
				}}
				edgeColor={(edge: GraphEdge) => {
					const isHighlighted = highlightedLinks.includes(edge.id);
					const isNodeHighlighted =
						highlightedNodes.includes(edge.source) ||
						highlightedNodes.includes(edge.target);

					return isHighlighted || isNodeHighlighted
						? nodeColors.neutral
						: '#d1d5db';
				}}
				edgeWidth={(edge: GraphEdge) => {
					const isHighlighted = highlightedLinks.includes(edge.id);
					const isNodeHighlighted =
						highlightedNodes.includes(edge.source) ||
						highlightedNodes.includes(edge.target);

					return isHighlighted || isNodeHighlighted
						? 2
						: Math.max(1, (edge.data as Link).strength);
				}}
				getNodePosition={(id: string) => {
					return nodePositionsRef.current.get(id) || null;
				}}
				onNodeDragEnd={(node: GraphNode, position: { x: number; y: number; z: number }) => {
					nodePositionsRef.current.set(node.id, position);
				}}
			/>


		</div>
	);
}

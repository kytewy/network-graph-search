'use client';

import React, {
	createContext,
	useContext,
	useRef,
	useState,
	useMemo,
	useCallback,
	useEffect,
} from 'react';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';
import { useNetworkStore } from '@/lib/stores/network-store';
import { useContextStore } from '@/lib/stores/context-store';
import { toast } from 'sonner';
import {
	LayoutMapper,
	type ReagraphLayoutType,
} from '@/lib/utils/layout-mappers';

// Import our new hooks
import { useGraphData, type ColorMode, type NodeSizeMode } from '@/hooks/use-graph-data';
import { useLassoSelection } from '@/hooks/use-lasso-selection';
import { useGraphVisualizationSettings } from '@/hooks/use-graph-visualization-settings';
import { useGraphLayout } from '@/hooks/use-graph-layout';
import { useGraphSelection } from '@/hooks/use-graph-selection';
import { useGraphCoordination } from '@/hooks/use-graph-coordination';

// Use the ReagraphLayoutType from layout-mappers
type LayoutType = ReagraphLayoutType;

// Define extended types for reagraph's useSelection hook to support lasso selection
interface ExtendedUseSelectionResult {
	selections: { nodes: GraphNode[]; edges: GraphEdge[] };
	clearSelections: (value?: string[]) => void;
	onNodeClick: (node: GraphNode) => void;
	onCanvasClick: (event: MouseEvent) => void;
	onLasso?: (selections: string[]) => void;
	onLassoEnd?: (selections: string[], event?: MouseEvent) => void;
}

// Define the context interface
interface NetworkGraphContextType {
	// Graph data
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	filteredResults: Node[];
	filteredLinks: Link[];

	// Graph state
	layoutType: LayoutType;
	showLabels: boolean;
	colorMode: ColorMode;
	nodeSizeMode: NodeSizeMode;
	clusterMode: 'none' | 'type' | 'continent' | 'country' | 'sourceType';

	// Selection state
	selections: { nodes: GraphNode[]; edges: GraphEdge[] };
	selectedNode: Node | null;

	// Lasso selection state
	lassoSelectedNodes: string[];
	showLassoMenu: boolean;
	lassoMenuPosition: { x: number; y: number };

	// Refs
	graphRef: React.RefObject<GraphCanvasRef>;
	nodePositionsRef: React.MutableRefObject<
		Map<string, { x: number; y: number; z: number }>
	>;

	// Actions
	handleLayoutChange: (layout: string) => void;
	setShowLabels: (show: boolean) => void;
	setColorMode: (mode: ColorMode) => void;
	setNodeSizeMode: (mode: NodeSizeMode) => void;
	setClusterMode: (
		mode: 'none' | 'type' | 'continent' | 'country' | 'sourceType'
	) => void;
	handleCustomNodeClick: (node: GraphNode) => void;
	handleLasso: (selectedIds: string[]) => void;
	handleLassoEnd: (selectedIds: string[], event?: MouseEvent) => void;
	closeLassoMenu: () => void;
	handleSendToContext: (nodes: Node[]) => void;

	// Computed properties
	getNodeColor: (node: Node) => string;
	getNodeSize: (node: Node) => number;

	// Selection handlers
	onNodeClick: (node: GraphNode) => void;
	onCanvasClick: (event: MouseEvent) => void;
	onLasso?: (selections: string[]) => void;
	onLassoEnd?: (selections: string[], event?: MouseEvent) => void;
	clearSelections: (value?: string[]) => void;
}

// Create the context
const NetworkGraphContext = createContext<NetworkGraphContextType | undefined>(
	undefined
);

// Provider component
export function NetworkGraphProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// Get data from Zustand stores
	const filteredResults = useAppStore((state) => state.filteredResults);
	const filteredLinks = useAppStore((state) => state.filteredLinks);

	// Hook: Visualization settings (replaces direct store access)
	const {
		showLabels,
		colorMode,
		nodeSizeMode,
		clusterMode,
		setShowLabels,
		setColorMode,
		setNodeSizeMode,
		setClusterMode,
	} = useGraphVisualizationSettings();

	// Hook: Layout management with cluster validation
	const { layoutType, handleLayoutChange } = useGraphLayout();

	// ============= CUSTOM HOOKS =============
	// Hook 1: Graph data transformation
	const { graphNodes, graphEdges, getNodeColor, getNodeSize } = useGraphData(
		filteredResults,
		filteredLinks,
		{ colorMode, nodeSizeMode }
	);

	// Hook 2: Lasso selection state management
	const {
		lassoSelectedNodes,
		showLassoMenu,
		lassoMenuPosition,
		handleLasso,
		handleLassoEnd: handleLassoEndFromHook,
		closeLassoMenu: closeLassoMenuFromHook,
	} = useLassoSelection();

	// Hook 4: Coordination - provides refs first
	const {
		graphRef,
		nodePositionsRef,
	} = useGraphCoordination({
		closeLassoMenuFromHook,
	});

	// Hook 3: Selection state management (needs graphRef from coordination hook)
	const {
		selections,
		selectedNode,
		onNodeClick: handleCustomNodeClick,
		onCanvasClick,
		clearSelections,
	} = useGraphSelection({ graphNodes, graphEdges, graphRef });

	// Hook 4 continued: Coordination handlers (now with clearSelections available)
	const {
		handleSendToContext,
		handleCloseLassoMenu: closeLassoMenu,
	} = useGraphCoordination({
		closeLassoMenuFromHook,
		clearSelections,
	});

	// Create the context value
	const contextValue = useMemo(
		() => ({
			// Graph data
			graphNodes,
			graphEdges,
			filteredResults,
			filteredLinks,

			// Graph state
			layoutType,
			showLabels,
			colorMode,
			nodeSizeMode,
			clusterMode,

			// Selection state
			selections,
			selectedNode,

			// Lasso selection state
			lassoSelectedNodes,
			showLassoMenu,
			lassoMenuPosition,

			// Refs
			graphRef,
			nodePositionsRef,

			// Actions
			handleLayoutChange,
			setShowLabels,
			setColorMode,
			setNodeSizeMode,
			setClusterMode,
			handleCustomNodeClick,
			handleLasso,
			handleLassoEnd: (ids: string[], event?: MouseEvent) => {
				handleLassoEndFromHook(ids, event);
			},
			closeLassoMenu,
			handleSendToContext,

			// Computed properties
			getNodeColor,
			getNodeSize,

			// Selection handlers (from useGraphSelection hook)
			onNodeClick: handleCustomNodeClick,
			onCanvasClick,
			clearSelections,
		}),
		[
			graphNodes,
			graphEdges,
			filteredResults,
			filteredLinks,
			layoutType,
			showLabels,
			colorMode,
			nodeSizeMode,
			clusterMode,
			selections,
			selectedNode,
			lassoSelectedNodes,
			showLassoMenu,
			lassoMenuPosition,
			handleLayoutChange,
			setShowLabels,
			setColorMode,
			setNodeSizeMode,
			setClusterMode,
			handleCustomNodeClick,
			handleLasso,
			handleLassoEndFromHook,
			closeLassoMenu,
			handleSendToContext,
			getNodeColor,
			getNodeSize,
			onCanvasClick,
			clearSelections,
		]
	);

	return (
		<NetworkGraphContext.Provider value={contextValue}>
			{children}
		</NetworkGraphContext.Provider>
	);
}

// Custom hook to use the context
export function useNetworkGraph() {
	const context = useContext(NetworkGraphContext);
	if (context === undefined) {
		throw new Error(
			'useNetworkGraph must be used within a NetworkGraphProvider'
		);
	}
	return context;
}

// Error boundary component
export class NetworkGraphErrorBoundary extends React.Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	{ hasError: boolean }
> {
	constructor(props: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_: Error) {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('NetworkGraph error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center h-full bg-gray-50 border rounded p-4">
						<div className="text-center">
							<h3 className="text-lg font-semibold text-red-600 mb-2">
								Network Graph Error
							</h3>
							<p className="text-gray-600">
								There was an error rendering the network graph.
							</p>
							<button
								className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
								onClick={() => this.setState({ hasError: false })}>
								Try Again
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

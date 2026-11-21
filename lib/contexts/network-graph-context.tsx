'use client';

import React, {
	createContext,
	useContext,
	useMemo,
	useState,
	useCallback,
} from 'react';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';

// Import our new hooks
import {
	useGraphData,
	type ColorMode,
	type NodeSizeMode,
} from '@/hooks/use-graph-data';
import { useLassoSelection } from '@/hooks/use-lasso-selection';
import { useGraphVisualizationSettings } from '@/hooks/use-graph-visualization-settings';
import { useGraphLayout } from '@/hooks/use-graph-layout';
import { useGraphSelectionReagraph } from '@/hooks/use-graph-selection-reagraph';
import { useGraphCoordination } from '@/hooks/use-graph-coordination';
import {
	NO_CLUSTERS,
	hasClustersFor,
	toAssignments,
	type ClusterAssignments,
} from '@/lib/clustering/assignments';
import { reportError } from '@/lib/observability/capture-client';

// Define the context interface
interface NetworkGraphContextType {
	// Graph data
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	filteredResults: Node[];
	filteredLinks: Link[];

	// Graph state
	layoutType: string;
	showLabels: boolean;
	colorMode: ColorMode;
	nodeSizeMode: NodeSizeMode;
	clusterMode:
		| 'none'
		| 'type'
		| 'continent'
		| 'country'
		| 'sourceType'
		| 'ai_clusters';

	// AI Cluster analysis state
	hasAiClusters: boolean;
	applyAiClusters: (assignments: Record<string, string>) => void;
	clearAiClusters: () => void;

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
		mode:
			| 'none'
			| 'type'
			| 'continent'
			| 'country'
			| 'sourceType'
			| 'ai_clusters'
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

	// AI cluster assignments, kept apart from the nodes (never written onto them)
	const [aiClusters, setAiClusters] = useState<ClusterAssignments>(NO_CLUSTERS);
	const hasAiClusters = useMemo(
		() => hasClustersFor(filteredResults, aiClusters),
		[filteredResults, aiClusters]
	);

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

	const applyAiClusters = useCallback(
		(assignments: Record<string, string>) => {
			const next = toAssignments(assignments);
			setAiClusters(next);

			// Automatically switch to AI clusters mode when user runs clustering
			if (Object.keys(next).length > 0) {
				setClusterMode('ai_clusters');
			}
		},
		[setClusterMode]
	);

	const clearAiClusters = useCallback(() => {
		setAiClusters(NO_CLUSTERS);
		setClusterMode('none');
	}, [setClusterMode]);

	// Hook: Layout management with cluster validation
	const { layoutType, handleLayoutChange } = useGraphLayout();

	// ============= CUSTOM HOOKS =============
	// Hook 1: Graph data transformation
	const { graphNodes, graphEdges, getNodeColor, getNodeSize } = useGraphData(
		filteredResults,
		filteredLinks,
		{ colorMode, nodeSizeMode, clusterMode, aiClusters }
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

	// Hook 3: Coordination - provides refs and handlers in one call
	const { 
		graphRef, 
		nodePositionsRef, 
		handleSendToContext, 
		handleCloseLassoMenu: closeLassoMenu 
	} = useGraphCoordination({
		closeLassoMenuFromHook,
	});

	// Hook 4: Selection state management (needs graphRef from coordination hook)
	const {
		selections,
		selectedNode,
		onNodeClick: handleCustomNodeClick,
		onCanvasClick,
		clearSelections,
	} = useGraphSelectionReagraph({ graphNodes, graphEdges, graphRef });

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

			// AI Clustering functions
			hasAiClusters,
			applyAiClusters,
			clearAiClusters,
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
			hasAiClusters,
			applyAiClusters,
			clearAiClusters,
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
		reportError('graph-boundary', error, { componentStack: errorInfo.componentStack });
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

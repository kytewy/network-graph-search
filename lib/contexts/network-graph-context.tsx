'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';
import type { ClusterMode, ColorMode, NodeSizeMode } from '@/lib/config/view-modes';
import { useGraphData } from '@/hooks/use-graph-data';
import { useLassoSelection } from '@/hooks/use-lasso-selection';
import { useGraphLayout } from '@/hooks/use-graph-layout';
import type { ReagraphLayoutType } from '@/lib/utils/layout-mappers';
import { useGraphSelectionReagraph } from '@/hooks/use-graph-selection-reagraph';
import { useGraphCoordination } from '@/hooks/use-graph-coordination';
import { reportError } from '@/lib/observability/capture-client';

// What the graph canvas and the lasso menu still read from the context.
// The rest of the app reads the store directly (P1-10a); P1-10b moves these too.
interface NetworkGraphContextType {
	// Graph data
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	filteredResults: Node[];
	filteredLinks: Link[];

	// Graph settings (read-only here; change them through the store)
	layoutType: ReagraphLayoutType;
	showLabels: boolean;
	colorMode: ColorMode;
	nodeSizeMode: NodeSizeMode;
	clusterMode: ClusterMode;

	// Selection state
	selections: { nodes: GraphNode[]; edges: GraphEdge[] };

	// Lasso selection state
	lassoSelectedNodes: string[];
	showLassoMenu: boolean;
	lassoMenuPosition: { x: number; y: number };

	// Refs
	graphRef: React.RefObject<GraphCanvasRef>;

	// Actions
	handleLasso: (selectedIds: string[]) => void;
	handleLassoEnd: (selectedIds: string[], event?: MouseEvent) => void;
	closeLassoMenu: () => void;
	handleSendToContext: (nodes: Node[]) => void;
	getNodeColor: (node: Node) => string;
	onCanvasClick: (event: MouseEvent) => void;
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
	// AI cluster assignments live in the store (selection slice)
	const aiClusters = useAppStore((state) => state.aiClusters);
	const { showLabels, colorMode, nodeSizeMode, clusterMode } = useAppStore(
		useShallow((s) => ({
			showLabels: s.showLabels,
			colorMode: s.colorMode,
			nodeSizeMode: s.nodeSizeMode,
			clusterMode: s.clusterMode,
		}))
	);
	const { layoutType } = useGraphLayout();

	// Graph data transformation
	const { graphNodes, graphEdges, getNodeColor } = useGraphData(filteredResults, filteredLinks, {
		colorMode,
		nodeSizeMode,
		clusterMode,
		aiClusters,
	});

	// Lasso selection state management
	const {
		lassoSelectedNodes,
		showLassoMenu,
		lassoMenuPosition,
		handleLasso,
		handleLassoEnd,
		closeLassoMenu: closeLassoMenuFromHook,
	} = useLassoSelection();

	// Coordination - provides refs and handlers in one call
	const { graphRef, handleSendToContext, handleCloseLassoMenu: closeLassoMenu } = useGraphCoordination({
		closeLassoMenuFromHook,
	});

	// Selection state management (needs graphRef from coordination hook)
	const { selections, onCanvasClick } = useGraphSelectionReagraph({ graphNodes, graphEdges, graphRef });

	const contextValue = useMemo(
		() => ({
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
			lassoSelectedNodes,
			showLassoMenu,
			lassoMenuPosition,
			graphRef,
			handleLasso,
			handleLassoEnd,
			closeLassoMenu,
			handleSendToContext,
			getNodeColor,
			onCanvasClick,
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
			lassoSelectedNodes,
			showLassoMenu,
			lassoMenuPosition,
			graphRef,
			handleLasso,
			handleLassoEnd,
			closeLassoMenu,
			handleSendToContext,
			getNodeColor,
			onCanvasClick,
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

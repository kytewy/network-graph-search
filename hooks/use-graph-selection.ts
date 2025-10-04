'use client';

import { useState, useCallback, useMemo } from 'react';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import type { Node } from '@/lib/stores/app-state';

/**
 * useGraphSelection Hook
 * 
 * Manages Reagraph selection state and user interaction with graph nodes.
 * Configures the Reagraph useSelection hook with hotkeys and custom click handling.
 * 
 * This hook encapsulates selection logic, making it:
 * - Independent from context complexity
 * - Testable selection scenarios
 * - Reusable across different graph implementations
 * 
 * Key features:
 * - Configures Reagraph's useSelection with hotkeys (Ctrl+A, Esc)
 * - Tracks currently selected node for detail views
 * - Handles custom node click logic
 * - Provides selection clearing functionality
 * 
 * @example
 * ```tsx
 * const {
 *   selections,
 *   selectedNode,
 *   onNodeClick,
 *   onCanvasClick,
 *   clearSelections
 * } = useGraphSelection(graphNodes, graphEdges, graphRef);
 * 
 * <GraphCanvas
 *   nodes={graphNodes}
 *   edges={graphEdges}
 *   selections={selections}
 *   onNodeClick={onNodeClick}
 *   onCanvasClick={onCanvasClick}
 * />
 * ```
 */

// Extended type to handle Reagraph's useSelection return
interface ExtendedUseSelectionResult {
	selections: { nodes: GraphNode[]; edges: GraphEdge[] };
	clearSelections: (value?: string[]) => void;
	onNodeClick: (node: GraphNode) => void;
	onCanvasClick: (event: MouseEvent) => void;
	onLasso?: (selections: string[]) => void;
	onLassoEnd?: (selections: string[], event?: MouseEvent) => void;
}

interface UseGraphSelectionOptions {
	/** Graph nodes to track selections for */
	graphNodes: GraphNode[];
	/** Graph edges for selection context */
	graphEdges: GraphEdge[];
	/** Ref to the graph canvas for selection management */
	graphRef: React.RefObject<GraphCanvasRef>;
}

interface UseGraphSelectionReturn {
	/** Currently selected nodes and edges */
	selections: { nodes: GraphNode[]; edges: GraphEdge[] };
	/** Currently active single node for detail view */
	selectedNode: Node | null;
	/** Handler for node click events */
	onNodeClick: (node: GraphNode) => void;
	/** Handler for canvas background click */
	onCanvasClick: (event?: MouseEvent) => void;
	/** Function to clear all selections */
	clearSelections: (value?: string[]) => void;
}

/**
 * Hook for managing graph node selection state
 * 
 * Wraps Reagraph's useSelection with custom logic for tracking
 * the active node and providing a clean interface.
 * 
 * @param options - Configuration for selection management
 * @returns Selection state and handlers
 */
export function useGraphSelection(
	options: UseGraphSelectionOptions
): UseGraphSelectionReturn {
	const { graphNodes, graphEdges, graphRef } = options;

	// Track currently selected node for detail views
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);

	// Configure Reagraph's selection with hotkeys
	const selectionConfig = useMemo(() => {
		if (graphNodes.length === 0) {
			// Return minimal config for empty graphs
			return {
				ref: graphRef,
				nodes: [],
				edges: [],
			};
		}

		return {
			ref: graphRef,
			nodes: graphNodes,
			edges: graphEdges,
			hotkeys: ['selectAll', 'deselect'], // Enable Ctrl+A and Esc
			focusOnSelect: true, // Camera focuses on selected nodes
			type: 'multi', // Allow multi-node selection
		};
	}, [graphNodes, graphEdges, graphRef]);

	// Get Reagraph's selection hook result
	const selectionResult = useSelection(
		selectionConfig
	) as unknown as ExtendedUseSelectionResult;

	const {
		selections,
		clearSelections,
		onNodeClick: reagraphOnNodeClick,
		onCanvasClick,
	} = selectionResult;

	/**
	 * Custom node click handler
	 * Calls Reagraph's handler and updates our selected node state
	 */
	const handleCustomNodeClick = useCallback(
		(node: GraphNode) => {
			// Call Reagraph's built-in handler first
			if (graphRef.current) {
				reagraphOnNodeClick(node);
			}

			// Update our selected node if data exists
			if (node.data) {
				setSelectedNode(node.data as Node);
			}
		},
		[reagraphOnNodeClick, graphRef]
	);

	return {
		selections,
		selectedNode,
		onNodeClick: handleCustomNodeClick,
		onCanvasClick: (event?: MouseEvent) => {
			if (event) onCanvasClick(event);
		},
		clearSelections,
	};
}

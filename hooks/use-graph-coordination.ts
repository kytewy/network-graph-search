'use client';

import { useCallback, useRef } from 'react';
import type { GraphCanvasRef } from 'reagraph';
import { useContextStore } from '@/lib/stores/context-store';
import { useNetworkStore } from '@/lib/stores/network-store';
import { toast } from 'sonner';
import type { Node } from '@/lib/stores/app-state';

/**
 * useGraphCoordination Hook
 * 
 * Handles complex coordination between multiple graph systems:
 * - Lasso selection → Context operations
 * - Selection cleanup across multiple state systems
 * - Toast notifications for user feedback
 * - Ref management for graph canvas and node positions
 * 
 * This hook encapsulates coordination logic that touches multiple systems,
 * keeping the context focused on composition rather than implementation.
 * 
 * @example
 * ```tsx
 * const {
 *   graphRef,
 *   nodePositionsRef,
 *   handleSendToContext,
 *   handleCloseLassoMenu
 * } = useGraphCoordination({
 *   closeLassoMenuFromHook: lassoHook.closeLassoMenu,
 *   clearSelections: selectionHook.clearSelections
 * });
 * ```
 */

interface UseGraphCoordinationOptions {
	/** Function to close lasso menu from lasso selection hook */
	closeLassoMenuFromHook: () => void;
	/** Function to clear Reagraph selections (optional, can be set later) */
	clearSelections?: (value?: string[]) => void;
}

interface UseGraphCoordinationReturn {
	/** Ref for the Reagraph canvas */
	graphRef: React.RefObject<GraphCanvasRef>;
	/** Ref for storing node positions */
	nodePositionsRef: React.MutableRefObject<Map<string, { x: number; y: number; z: number }>>;
	/** Send selected nodes to context with toast notification */
	handleSendToContext: (nodes: Node[]) => void;
	/** Close lasso menu and clean up all selection state */
	handleCloseLassoMenu: () => void;
	/** Wrapper for lasso end event */
	handleLassoEnd: (selectedIds: string[], event?: MouseEvent) => void;
}

/**
 * Hook for coordinating complex interactions between graph systems
 * 
 * @param options - Coordination dependencies
 * @returns Refs and coordination handlers
 */
export function useGraphCoordination(
	options: UseGraphCoordinationOptions
): UseGraphCoordinationReturn {
	const { closeLassoMenuFromHook, clearSelections } = options;

	// Get store actions
	const addNodesToContext = useContextStore((state) => state.addNodesToContext);

	// Refs for graph canvas and node positions
	const graphRef = useRef<GraphCanvasRef | null>(null);
	const nodePositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(
		new Map()
	);

	/**
	 * Send selected nodes to context
	 * - Adds nodes to context store
	 * - Shows success toast notification
	 * - Closes lasso menu (which clears selections)
	 */
	const handleSendToContext = useCallback(
		(nodes: Node[]) => {
			if (!nodes || nodes.length === 0) return;

			// Show toast notification
			toast.success(
				`Added ${nodes.length} node${nodes.length > 1 ? 's' : ''} to context`,
				{
					description:
						'Node content is now available in the Context Management panel',
					duration: 3000,
				}
			);

			// Add to context store
			addNodesToContext(nodes);

			// Clear selections after sending to context
			handleCloseLassoMenu();
		},
		[addNodesToContext]
	);

	/**
	 * Close lasso menu and clear all selection state
	 * Coordinates cleanup across 3 different systems:
	 * 1. Lasso selection hook state
	 * 2. Reagraph selection state
	 * 3. Network store selection state
	 */
	const handleCloseLassoMenu = useCallback(() => {
		// 1. Close lasso menu (from hook)
		closeLassoMenuFromHook();

		// 2. Clear Reagraph selections
		if (clearSelections) {
			clearSelections();
		}

		// 3. Clear network store selections (if available)
		const networkStore = useNetworkStore.getState();
		if (networkStore.setSelectedNodes) {
			networkStore.setSelectedNodes([]);
		}
	}, [closeLassoMenuFromHook, clearSelections]);

	/**
	 * Wrapper for lasso end event
	 * Currently just passes through to the hook
	 * Kept separate for future extension possibilities
	 */
	const handleLassoEnd = useCallback(
		(selectedIds: string[], event?: MouseEvent) => {
			// For now, lasso hook handles this internally
			// This wrapper exists for potential future coordination logic
		},
		[]
	);

	return {
		graphRef,
		nodePositionsRef,
		handleSendToContext,
		handleCloseLassoMenu,
		handleLassoEnd,
	};
}

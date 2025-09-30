'use client';

import { useState, useCallback } from 'react';

interface LassoMenuPosition {
	x: number;
	y: number;
}

interface UseLassoSelectionOptions {
	/** Callback to clear external selections when menu closes */
	onClearSelections?: () => void;
}

interface UseLassoSelectionReturn {
	/** Array of selected node IDs */
	lassoSelectedNodes: string[];
	/** Whether the lasso menu should be visible */
	showLassoMenu: boolean;
	/** Position for the lasso menu */
	lassoMenuPosition: LassoMenuPosition;
	/** Handler for ongoing lasso selection (while dragging) */
	handleLasso: (selectedIds: string[]) => void;
	/** Handler for lasso selection completion (on mouse release) */
	handleLassoEnd: (selectedIds: string[], event?: MouseEvent) => void;
	/** Close the menu and clear selections */
	closeLassoMenu: () => void;
}

/**
 * useLassoSelection Hook
 * 
 * Manages lasso selection state for multi-node selection in graph visualizations.
 * Handles selection tracking, menu visibility, and positioning.
 * 
 * This hook encapsulates all lasso-related state and logic, making it:
 * - Testable independently from the graph context
 * - Reusable in different graph implementations
 * - Easy to extend with new lasso features
 * 
 * @param options - Optional configuration
 * @param options.onClearSelections - Callback to clear external selections (e.g., Reagraph)
 * 
 * @example
 * ```tsx
 * const { 
 *   lassoSelectedNodes, 
 *   showLassoMenu,
 *   handleLasso,
 *   closeLassoMenu 
 * } = useLassoSelection({
 *   onClearSelections: () => clearReagraphSelections()
 * });
 * 
 * <GraphCanvas
 *   onLasso={handleLasso}
 *   onLassoEnd={handleLassoEnd}
 * />
 * 
 * {showLassoMenu && (
 *   <LassoMenu 
 *     selectedNodes={lassoSelectedNodes}
 *     onClose={closeLassoMenu}
 *   />
 * )}
 * ```
 */
export function useLassoSelection(
	options?: UseLassoSelectionOptions
): UseLassoSelectionReturn {
	const [lassoSelectedNodes, setLassoSelectedNodes] = useState<string[]>([]);
	const [showLassoMenu, setShowLassoMenu] = useState(false);
	const [lassoMenuPosition, setLassoMenuPosition] = useState<LassoMenuPosition>({
		x: 0,
		y: 0,
	});

	/**
	 * Handle ongoing lasso selection (called continuously while dragging)
	 * Updates the selected nodes array as the user drags the lasso
	 */
	const handleLasso = useCallback((selectedIds: string[]) => {
		// Guard against invalid input
		if (!selectedIds || !Array.isArray(selectedIds)) {
			return;
		}

		setLassoSelectedNodes(selectedIds);
		// Let Reagraph handle the selection state internally during dragging
	}, []);

	/**
	 * Handle lasso selection completion (called on mouse release)
	 * If nodes were selected, show the menu; otherwise clear state
	 */
	const handleLassoEnd = useCallback((selectedIds: string[], event?: MouseEvent) => {
		// Guard against invalid input
		if (!selectedIds || !Array.isArray(selectedIds)) {
			setLassoSelectedNodes([]);
			return;
		}

		// Show menu if nodes were selected
		if (selectedIds.length > 0) {
			setLassoSelectedNodes(selectedIds);

			// Position menu at center-top of screen for easy access
			// Using fixed positioning ensures visibility regardless of scroll position
			const menuPosition = {
				x: window.innerWidth / 2 - 200, // Center horizontally (minus half menu width ~400px)
				y: 100, // Near top of screen for visibility
			};

			setLassoMenuPosition(menuPosition);
			setShowLassoMenu(true);
		} else {
			// No nodes selected, just clear state
			setLassoSelectedNodes([]);
		}
	}, []);

	/**
	 * Close the lasso menu and clear all selection state
	 * Also triggers external selection clearing if callback is provided
	 */
	const closeLassoMenu = useCallback(() => {
		console.log('Closing lasso menu and clearing selections');

		// Clear local state
		setShowLassoMenu(false);
		setLassoSelectedNodes([]);

		// Clear external selections (e.g., Reagraph selection state)
		if (options?.onClearSelections) {
			options.onClearSelections();
		}
	}, [options]);

	return {
		lassoSelectedNodes,
		showLassoMenu,
		lassoMenuPosition,
		handleLasso,
		handleLassoEnd,
		closeLassoMenu,
	};
}

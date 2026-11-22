import type { StateCreator } from 'zustand';

/** What is picked out on the graph right now. */
export interface SelectionSlice {
	/** Nodes highlighted because a card, row or chip is hovered */
	highlightedNodes: string[];
	setHighlightedNodes: (ids: string[]) => void;
}

export const createSelectionSlice: StateCreator<SelectionSlice, [['zustand/devtools', never]], [], SelectionSlice> = (
	set
) => ({
	highlightedNodes: [],
	setHighlightedNodes: (highlightedNodes) => set({ highlightedNodes }),
});

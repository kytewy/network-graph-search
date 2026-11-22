import type { StateCreator } from 'zustand';
import type { ClusterMode } from '@/lib/config/view-modes';
import { NO_CLUSTERS, toAssignments, type ClusterAssignments } from '@/lib/clustering/assignments';

/** What is picked out on the graph right now. */
export interface SelectionSlice {
	/** Nodes highlighted because a card, row or chip is hovered */
	highlightedNodes: string[];
	setHighlightedNodes: (ids: string[]) => void;

	/** AI cluster per node id, kept apart from the nodes (never written onto them) */
	aiClusters: ClusterAssignments;
	/** Stores clustering's result and switches the graph to cluster by it */
	applyAiClusters: (assignments: Record<string, string>) => void;
	clearAiClusters: () => void;

	/** Nodes caught in a lasso (shown purple), and whether its menu is open */
	lassoNodes: string[];
	lassoMenuOpen: boolean;
	/** While dragging */
	setLassoNodes: (ids: string[]) => void;
	/** On release: open the menu if anything was caught, otherwise clear */
	finishLasso: (ids: string[]) => void;
	closeLasso: () => void;
}

type Needs = SelectionSlice & { setClusterMode: (mode: ClusterMode) => void };

export const createSelectionSlice: StateCreator<Needs, [['zustand/devtools', never]], [], SelectionSlice> = (
	set,
	get
) => ({
	highlightedNodes: [],
	setHighlightedNodes: (highlightedNodes) => set({ highlightedNodes }),

	aiClusters: NO_CLUSTERS,
	applyAiClusters: (assignments) => {
		const aiClusters = toAssignments(assignments);
		set({ aiClusters });
		if (Object.keys(aiClusters).length > 0) get().setClusterMode('ai_clusters');
	},
	clearAiClusters: () => {
		set({ aiClusters: NO_CLUSTERS });
		get().setClusterMode('none');
	},

	lassoNodes: [],
	lassoMenuOpen: false,
	setLassoNodes: (ids) => set({ lassoNodes: Array.isArray(ids) ? ids : [] }),
	finishLasso: (ids) => {
		const caught = Array.isArray(ids) ? ids : [];
		set({ lassoNodes: caught, lassoMenuOpen: caught.length > 0 });
	},
	closeLasso: () => set({ lassoNodes: [], lassoMenuOpen: false }),
});

import type { StateCreator } from 'zustand';
import type { AppState } from '@/lib/stores/app-state';
import type { ClusterMode, ColorMode, NetworkLayout, NodeSizeMode } from '@/lib/config/view-modes';

/** How the graph and panels look. The modes are listed in lib/config/view-modes.ts. */
export interface ViewSlice {
	colorMode: ColorMode;
	nodeSizeMode: NodeSizeMode;
	clusterMode: ClusterMode;
	layoutType: NetworkLayout;
	showLabels: boolean;
	rightPanelExpanded: boolean;
	/** The search panel opened wide; only one side panel is wide at a time */
	searchPanelExpanded: boolean;
	/** A side panel folded to a thin rail on its edge */
	searchPanelCollapsed: boolean;
	rightPanelCollapsed: boolean;
	/** Context table: show only the documents still on the graph */
	showActiveNodes: boolean;
	/** Search results as cards or as a table */
	resultsView: 'cards' | 'table';

	setColorMode: (mode: ColorMode) => void;
	setNodeSizeMode: (mode: NodeSizeMode) => void;
	setClusterMode: (mode: ClusterMode) => void;
	setLayoutType: (layout: NetworkLayout) => void;
	setShowLabels: (show: boolean) => void;
	setRightPanelExpanded: (expanded: boolean) => void;
	setSearchPanelExpanded: (expanded: boolean) => void;
	setSearchPanelCollapsed: (collapsed: boolean) => void;
	setRightPanelCollapsed: (collapsed: boolean) => void;
	setShowActiveNodes: (show: boolean) => void;
	setResultsView: (view: 'cards' | 'table') => void;
}

export const createViewSlice: StateCreator<AppState, [['zustand/devtools', never], ['zustand/persist', unknown]], [], ViewSlice> = (set) => ({
	colorMode: 'continent',
	nodeSizeMode: 'none',
	clusterMode: 'none',
	layoutType: 'forceDirected2d',
	showLabels: true,
	rightPanelExpanded: false,
	searchPanelExpanded: false,
	searchPanelCollapsed: false,
	rightPanelCollapsed: false,
	showActiveNodes: false,
	resultsView: 'table', // a table is quicker to scan; cards are one click away

	setColorMode: (colorMode) => set({ colorMode }),
	setNodeSizeMode: (nodeSizeMode) => set({ nodeSizeMode }),
	setClusterMode: (clusterMode) => set({ clusterMode }),
	setLayoutType: (layoutType) => set({ layoutType }),
	setShowLabels: (showLabels) => set({ showLabels }),
	// Opening one wide panel folds the other, so they never overlap
	setRightPanelExpanded: (rightPanelExpanded) =>
		set(rightPanelExpanded ? { rightPanelExpanded, searchPanelExpanded: false } : { rightPanelExpanded }),
	setSearchPanelExpanded: (searchPanelExpanded) =>
		set(searchPanelExpanded ? { searchPanelExpanded, rightPanelExpanded: false } : { searchPanelExpanded }),
	// Closing a panel also takes it out of its wide view
	setSearchPanelCollapsed: (searchPanelCollapsed) =>
		set(searchPanelCollapsed ? { searchPanelCollapsed, searchPanelExpanded: false } : { searchPanelCollapsed }),
	setRightPanelCollapsed: (rightPanelCollapsed) =>
		set(rightPanelCollapsed ? { rightPanelCollapsed, rightPanelExpanded: false } : { rightPanelCollapsed }),
	setShowActiveNodes: (showActiveNodes) => set({ showActiveNodes }),
	setResultsView: (resultsView) => set({ resultsView }),
});

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
	/** Context table: show only the documents still on the graph */
	showActiveNodes: boolean;

	setColorMode: (mode: ColorMode) => void;
	setNodeSizeMode: (mode: NodeSizeMode) => void;
	setClusterMode: (mode: ClusterMode) => void;
	setLayoutType: (layout: NetworkLayout) => void;
	setShowLabels: (show: boolean) => void;
	setRightPanelExpanded: (expanded: boolean) => void;
	setShowActiveNodes: (show: boolean) => void;
}

export const createViewSlice: StateCreator<AppState, [['zustand/devtools', never], ['zustand/persist', unknown]], [], ViewSlice> = (set) => ({
	colorMode: 'continent',
	nodeSizeMode: 'none',
	clusterMode: 'none',
	layoutType: 'forceDirected2d',
	showLabels: true,
	rightPanelExpanded: false,
	showActiveNodes: false,

	setColorMode: (colorMode) => set({ colorMode }),
	setNodeSizeMode: (nodeSizeMode) => set({ nodeSizeMode }),
	setClusterMode: (clusterMode) => set({ clusterMode }),
	setLayoutType: (layoutType) => set({ layoutType }),
	setShowLabels: (showLabels) => set({ showLabels }),
	setRightPanelExpanded: (rightPanelExpanded) => set({ rightPanelExpanded }),
	setShowActiveNodes: (showActiveNodes) => set({ showActiveNodes }),
});

import { create } from 'zustand';
import type { NetworkLayout } from '@/lib/config/view-modes';
import { type Node, type Link } from '@/lib/stores/app-state';
// Using Node and Link types from app-state instead of sample-data

interface NetworkState {
	nodes: Node[];
	links: Link[];
	selectedNodes: string[];
	expandedNodes: string[];
	highlightedNodes: string[];
	highlightedLinks: string[];
	layoutType: NetworkLayout; // The layouts are listed in lib/config/view-modes.ts

	// Actions
	setNodes: (nodes: Node[]) => void;
	setLinks: (links: Link[]) => void;
	setSelectedNodes: (nodes: string[]) => void;
	addSelectedNode: (nodeId: string) => void;
	removeSelectedNode: (nodeId: string) => void;
	toggleNodeExpansion: (nodeId: string) => void;
	setHighlightedNodes: (nodes: string[]) => void;
	setHighlightedLinks: (links: string[]) => void;
	setLayoutType: (type: NetworkLayout) => void;
	clearSelections: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
	nodes: [], // Initialize with empty array instead of sample data
	links: [], // Initialize with empty array instead of sample data
	selectedNodes: [],
	expandedNodes: [],
	highlightedNodes: [],
	highlightedLinks: [],
	layoutType: 'forceDirected2d',

	setNodes: (nodes) => set({ nodes }),
	setLinks: (links) => set({ links }),
	setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
	addSelectedNode: (nodeId) =>
		set((state) => ({
			selectedNodes: Array.isArray(state.selectedNodes) && state.selectedNodes.includes(nodeId)
				? state.selectedNodes
				: [...(Array.isArray(state.selectedNodes) ? state.selectedNodes : []), nodeId],
		})),
	removeSelectedNode: (nodeId) =>
		set((state) => ({
			selectedNodes: state.selectedNodes.filter((id) => id !== nodeId),
		})),
	toggleNodeExpansion: (nodeId) =>
		set((state) => ({
			expandedNodes: Array.isArray(state.expandedNodes) && state.expandedNodes.includes(nodeId)
				? state.expandedNodes.filter((id) => id !== nodeId)
				: [...(Array.isArray(state.expandedNodes) ? state.expandedNodes : []), nodeId],
		})),
	setHighlightedNodes: (nodes) => set({ highlightedNodes: nodes }),
	setHighlightedLinks: (links) => set({ highlightedLinks: links }),
	setLayoutType: (type) => set({ layoutType: type }),
	clearSelections: () => set({ selectedNodes: [], expandedNodes: [] }),
}));

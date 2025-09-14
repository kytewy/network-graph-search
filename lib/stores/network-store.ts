import { create } from 'zustand';
import { type Node, type Link } from '@/lib/sample-data';
import { euNodes, euLinks } from '@/lib/sample-eu-data';

interface NetworkState {
	nodes: Node[];
	links: Link[];
	selectedNodes: string[];
	expandedNodes: string[];
	highlightedNodes: string[];
	highlightedLinks: string[];
	layoutType: 'forceDirected' | 'concentric' | 'radial' | 'hierarchical';

	// Actions
	setNodes: (nodes: Node[]) => void;
	setLinks: (links: Link[]) => void;
	setSelectedNodes: (nodes: string[]) => void;
	addSelectedNode: (nodeId: string) => void;
	removeSelectedNode: (nodeId: string) => void;
	toggleNodeExpansion: (nodeId: string) => void;
	setHighlightedNodes: (nodes: string[]) => void;
	setHighlightedLinks: (links: string[]) => void;
	setLayoutType: (type: 'forceDirected' | 'concentric' | 'radial' | 'hierarchical') => void;
	clearSelections: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
	nodes: euNodes,
	links: euLinks,
	selectedNodes: [],
	expandedNodes: [],
	highlightedNodes: [],
	highlightedLinks: [],
	layoutType: 'forceDirected',

	setNodes: (nodes) => set({ nodes }),
	setLinks: (links) => set({ links }),
	setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
	addSelectedNode: (nodeId) =>
		set((state) => ({
			selectedNodes: state.selectedNodes.includes(nodeId)
				? state.selectedNodes
				: [...state.selectedNodes, nodeId],
		})),
	removeSelectedNode: (nodeId) =>
		set((state) => ({
			selectedNodes: state.selectedNodes.filter((id) => id !== nodeId),
		})),
	toggleNodeExpansion: (nodeId) =>
		set((state) => ({
			expandedNodes: state.expandedNodes.includes(nodeId)
				? state.expandedNodes.filter((id) => id !== nodeId)
				: [...state.expandedNodes, nodeId],
		})),
	setHighlightedNodes: (nodes) => set({ highlightedNodes: nodes }),
	setHighlightedLinks: (links) => set({ highlightedLinks: links }),
	setLayoutType: (type) => set({ layoutType: type }),
	clearSelections: () => set({ selectedNodes: [], expandedNodes: [] }),
}));

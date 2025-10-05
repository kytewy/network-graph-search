import { create } from 'zustand';
import { type Node } from '@/lib/stores/app-state';

interface ClusterResult {
	cluster_id: string;
	size: number;
	top_terms?: string[];
	node_ids?: string[];
}

interface ClusterAnalysisResponse {
	clusters: ClusterResult[];
	cluster_assignments: Record<string, string>;
	executive_summary?: string;
}

interface ContextState {
	// Selected nodes for context
	contextNodes: Node[];
	
	// Clustering results
	clusterResults: ClusterAnalysisResponse | null;
	expandedClusters: Set<string>;

	// Actions
	addNodesToContext: (nodes: Node[]) => void;
	removeNodeFromContext: (nodeId: string) => void;
	clearContext: () => void;
	
	// Clustering actions
	setClusterResults: (results: ClusterAnalysisResponse | null) => void;
	toggleClusterExpansion: (clusterId: string) => void;
	clearClusterResults: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
	contextNodes: [],
	clusterResults: null,
	expandedClusters: new Set<string>(),

	addNodesToContext: (nodes) =>
		set((state) => {
			// Filter out duplicates by creating a map of existing nodes by ID
			const existingNodesMap = new Map(
				state.contextNodes.map((node) => [node.id, node])
			);

			// Add new nodes that don't already exist
			nodes.forEach((node) => {
				if (!existingNodesMap.has(node.id)) {
					existingNodesMap.set(node.id, node);
				}
			});

			return { contextNodes: Array.from(existingNodesMap.values()) };
		}),

	removeNodeFromContext: (nodeId) =>
		set((state) => ({
			contextNodes: state.contextNodes.filter((node) => node.id !== nodeId),
		})),

	clearContext: () => set({ 
		contextNodes: [],
		clusterResults: null,
		expandedClusters: new Set<string>()
	}),

	setClusterResults: (results) =>
		set({ clusterResults: results }),

	toggleClusterExpansion: (clusterId) =>
		set((state) => {
			const newExpandedClusters = new Set(state.expandedClusters);
			if (newExpandedClusters.has(clusterId)) {
				newExpandedClusters.delete(clusterId);
			} else {
				newExpandedClusters.add(clusterId);
			}
			return { expandedClusters: newExpandedClusters };
		}),

	clearClusterResults: () =>
		set({ 
			clusterResults: null,
			expandedClusters: new Set<string>()
		}),
}));

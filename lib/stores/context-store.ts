import type { ChatAction } from '@/lib/contracts/analysis';
import type { Receipt } from '@/lib/chat/receipt';
import { create } from 'zustand';
import { type Node } from '@/lib/stores/app-state';

export interface ClusterResult {
	cluster_id: string;
	/** "Cluster 0" and a keyword line from the clustering service, before the AI names it */
	label?: string;
	description?: string;
	size: number;
	top_terms?: string[];
	node_ids?: string[];
}

export interface ClusterAnalysisResponse {
	clusters: ClusterResult[];
	cluster_assignments: Record<string, string>;
	executive_summary?: string;
}

interface ClusterSuggestion {
	clusterName: string;
	description: string;
	tags?: string[]; // Optional, for future use
}

export interface ChatConversation {
	id: string;
	prompt: string;
	response: string;
	timestamp: Date;
	feedback?: 'up' | 'down';
	/** Waiting, stopped or failed turns are shown but not remembered for follow-ups */
	status?: 'thinking' | 'done' | 'stopped' | 'failed';
	/** Buttons the answer suggests ("Filter to Europe"); nothing changes until clicked */
	actions?: ChatAction[];
	/** Exactly what went to the AI for this answer */
	receipt?: Receipt;
	/** Documents the AI is opening to read in full, while it thinks */
	reading?: { title: string; round: number }[];
}

interface ContextState {
	// Selected nodes for context
	contextNodes: Node[];
	
	// Clustering results
	clusterResults: ClusterAnalysisResponse | null;
	expandedClusters: Set<string>;
	
	// LLM cluster suggestions
	clusterSuggestions: Map<number, ClusterSuggestion>;
	/** The Clusters tab's quick summary, with the clusters it was written for (kept with the workspace) */
	clusterOverview: { key: string; summary: string } | null;
	
	// Chat conversations
	chatConversations: ChatConversation[];

	// Actions
	addNodesToContext: (nodes: Node[]) => void;
	removeNodeFromContext: (nodeId: string) => void;
	clearContext: () => void;
	
	// Clustering actions
	setClusterResults: (results: ClusterAnalysisResponse | null) => void;
	toggleClusterExpansion: (clusterId: string) => void;
	clearClusterResults: () => void;
	
	// LLM cluster suggestion actions
	setClusterSuggestions: (suggestions: Map<number, ClusterSuggestion>) => void;
	clearClusterSuggestions: () => void;
	
	// Chat actions
	addChatConversation: (conversation: ChatConversation) => void;
	updateChatConversation: (id: string, updates: Partial<ChatConversation>) => void;
	clearChatConversations: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
	contextNodes: [],
	clusterResults: null,
	expandedClusters: new Set<string>(),
	clusterSuggestions: new Map(),
	clusterOverview: null,
	chatConversations: [],

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
			expandedClusters: new Set<string>(),
			clusterSuggestions: new Map()
		}),
	
	setClusterSuggestions: (suggestions) =>
		set({ clusterSuggestions: suggestions }),
	
	clearClusterSuggestions: () =>
		set({ clusterSuggestions: new Map() }),
	
	addChatConversation: (conversation) =>
		set((state) => ({
			chatConversations: [...state.chatConversations, conversation],
		})),
	
	updateChatConversation: (id, updates) =>
		set((state) => ({
			chatConversations: state.chatConversations.map((conv) =>
				conv.id === id ? { ...conv, ...updates } : conv
			),
		})),
	
	clearChatConversations: () =>
		set({ chatConversations: [] }),
}));

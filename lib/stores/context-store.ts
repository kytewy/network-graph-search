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
	/** Which chat this question belongs to (none = the main chat, as before) */
	chatId?: string;
}

/** One conversation; the workspace can have several and flip between them */
export interface Chat {
	id: string;
	name: string;
	createdAt: number;
	/** Named by the app (from the first question, then by the AI), not by you */
	autoName?: boolean;
	/** This chat's documents while another chat is open (the open chat's are contextNodes) */
	nodes?: Node[];
}

const NEW_CHAT_NAME = 'New chat';
/** The first chat; like any new chat it is named from its first question */
export const MAIN_CHAT: Chat = { id: 'main', name: NEW_CHAT_NAME, createdAt: 0 };
const NAME_FROM_QUESTION = 40;

/** The questions of one chat, oldest first */
export const chatTurns = (turns: readonly ChatConversation[], chatId: string) => turns.filter((t) => (t.chatId ?? MAIN_CHAT.id) === chatId);

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
	
	// Chat conversations (every chat's questions; each knows its chat)
	chatConversations: ChatConversation[];
	chats: Chat[];
	activeChatId: string;

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
	/** Starts an empty chat and opens it, with these documents (default: a copy of the open chat's); returns its id */
	newChat: (name?: string, nodes?: Node[]) => string;
	selectChat: (id: string) => void;
	/** Removes a chat and its questions; the main chat can only be emptied */
	deleteChat: (id: string) => void;
	/** Gives a chat a better name, unless it was named by hand */
	nameChatAuto: (id: string, name: string) => void;
}

export const useContextStore = create<ContextState>((set) => ({
	contextNodes: [],
	clusterResults: null,
	expandedClusters: new Set<string>(),
	clusterSuggestions: new Map(),
	clusterOverview: null,
	chatConversations: [],
	chats: [MAIN_CHAT],
	activeChatId: MAIN_CHAT.id,

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
		set((state) => {
			const chatId = conversation.chatId ?? state.activeChatId;
			// A new chat takes its name from its first question
			const first = chatTurns(state.chatConversations, chatId).length === 0;
			const named = conversation.prompt.trim().replace(/\s+/g, ' ');
			const name = named.length > NAME_FROM_QUESTION ? `${named.slice(0, NAME_FROM_QUESTION - 1)}…` : named;
			return {
				chatConversations: [...state.chatConversations, { ...conversation, chatId }],
				chats: state.chats.map((c) => (c.id === chatId && first && c.name === NEW_CHAT_NAME && name ? { ...c, name, autoName: true } : c)),
			};
		}),
	
	updateChatConversation: (id, updates) =>
		set((state) => ({
			chatConversations: state.chatConversations.map((conv) =>
				conv.id === id ? { ...conv, ...updates } : conv
			),
		})),
	
	clearChatConversations: () =>
		set({ chatConversations: [], chats: [MAIN_CHAT], activeChatId: MAIN_CHAT.id }),

	newChat: (name = NEW_CHAT_NAME, nodes) => {
		const chat: Chat = { id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, name, createdAt: Date.now() };
		set((state) => ({
			// The open chat keeps its documents; the new one starts with its own copy
			chats: [...state.chats.map((c) => (c.id === state.activeChatId ? { ...c, nodes: state.contextNodes } : c)), chat],
			activeChatId: chat.id,
			contextNodes: [...(nodes ?? state.contextNodes)],
		}));
		return chat.id;
	},

	nameChatAuto: (id, name) =>
		set((state) => ({ chats: state.chats.map((c) => (c.id === id && c.autoName && name ? { ...c, name } : c)) })),

	// Each chat has its own documents: switching puts the open chat's away and brings the other's out
	selectChat: (id) =>
		set((state) => {
			const target = state.chats.find((c) => c.id === id);
			if (!target || id === state.activeChatId) return {};
			return {
				chats: state.chats.map((c) => (c.id === state.activeChatId ? { ...c, nodes: state.contextNodes } : c.id === id ? { ...c, nodes: undefined } : c)),
				activeChatId: id,
				contextNodes: target.nodes ?? [],
			};
		}),

	deleteChat: (id) =>
		set((state) => {
			const chatConversations = state.chatConversations.filter((t) => (t.chatId ?? MAIN_CHAT.id) !== id);
			// The main chat is emptied and starts over as a new chat
			if (id === MAIN_CHAT.id) return { chatConversations, chats: state.chats.map((c) => (c.id === id ? MAIN_CHAT : c)) };
			const index = state.chats.findIndex((c) => c.id === id);
			const chats = state.chats.filter((c) => c.id !== id);
			if (state.activeChatId !== id) return { chatConversations, chats };
			// Open the chat before it (or the main chat), with its documents
			const next = chats[Math.max(0, index - 1)] ?? MAIN_CHAT;
			return {
				chatConversations,
				chats: chats.map((c) => (c.id === next.id ? { ...c, nodes: undefined } : c)),
				activeChatId: next.id,
				contextNodes: next.nodes ?? [],
			};
		}),
}));

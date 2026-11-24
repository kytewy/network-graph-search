/**
 * Keeping the workspace: its goal, searches, results, context and chat are
 * saved in this browser and come back after a refresh. (Later they move to
 * the database, as workstreams.) AI clusters aren't kept: run them again.
 */
import { create } from 'zustand';
import { useAppStore } from '@/lib/stores/app-state';
import { MAIN_CHAT, useContextStore, type Chat, type ChatConversation } from '@/lib/stores/context-store';
import type { Link, Node } from '@/lib/config/types';
import type { SearchRound } from './collect';
import type { ClusterAssignments } from '@/lib/clustering/assignments';

export const WORKSPACE_KEY = 'network-graph-search:workspace';
export const MAX_GOAL = 300;

/** The workspace's goal: "What are you trying to answer?" Sent with every chat question. */
export const useWorkspaceGoal = create<{ goal: string; setGoal: (goal: string) => void }>()((set) => ({
	goal: '',
	setGoal: (goal) => set({ goal: goal.slice(0, MAX_GOAL) }),
}));

export interface Snapshot {
	v: 1;
	goal: string;
	rounds: SearchRound[];
	results: Node[];
	links: Link[];
	selectedSearches: string[];
	context: Node[];
	chat: ChatConversation[];
	/** The chats and which one is open (older saves have only the main chat) */
	chats?: Chat[];
	activeChatId?: string;
	/** AI clusters: which cluster each document is in, the results, names and quick summary */
	clusters?: {
		assignments: ClusterAssignments;
		results: ContextState['clusterResults'];
		suggestions: [number, unknown][];
		overview: ContextState['clusterOverview'];
	};
}

type ContextState = ReturnType<typeof useContextStore.getState>;

/** What's on screen now, ready to save (unfinished chat answers left out) */
export function takeSnapshot(): Snapshot {
	const app = useAppStore.getState();
	const ctx = useContextStore.getState();
	return {
		v: 1,
		goal: useWorkspaceGoal.getState().goal,
		rounds: app.rounds,
		results: app.searchResults,
		links: app.links,
		selectedSearches: app.selectedSearches,
		context: ctx.contextNodes,
		chat: ctx.chatConversations.filter((c) => c.status !== 'thinking'),
		chats: ctx.chats,
		activeChatId: ctx.activeChatId,
		clusters: ctx.clusterResults
			? { assignments: app.aiClusters, results: ctx.clusterResults, suggestions: [...ctx.clusterSuggestions], overview: ctx.clusterOverview }
			: undefined,
	};
}

export function readSnapshot(): Snapshot | null {
	try {
		const saved = JSON.parse(localStorage.getItem(WORKSPACE_KEY) ?? 'null');
		return saved?.v === 1 && Array.isArray(saved.rounds) ? saved : null;
	} catch {
		return null;
	}
}

/**
 * Whether the saved workspace is the one this address asks for: it started
 * from the same search (or the address has no search). A link to a different
 * search starts fresh.
 */
export function snapshotMatches(snapshot: Snapshot | null, query: string | undefined, topK: number): boolean {
	if (!snapshot || snapshot.rounds.length === 0) return false;
	if (!query) return true;
	const first = snapshot.rounds[0];
	return first.query.trim().toLowerCase() === query.trim().toLowerCase() && first.topK === topK;
}

/** Puts a saved workspace back on screen */
export function restoreSnapshot(s: Snapshot) {
	const first = s.rounds[0];
	useWorkspaceGoal.setState({ goal: s.goal ?? '' });
	useAppStore.setState({ rounds: s.rounds, links: s.links, selectedSearches: s.selectedSearches, query: first.query, topK: first.topK, hasSearched: true });
	useAppStore.getState().setSearchResults(s.results);
	useContextStore.setState({
		contextNodes: s.context,
		chatConversations: s.chat.map((c) => ({ ...c, timestamp: new Date(c.timestamp) })),
		chats: s.chats?.length ? s.chats : [MAIN_CHAT],
		activeChatId: s.chats?.some((c) => c.id === s.activeChatId) ? s.activeChatId! : MAIN_CHAT.id,
	});
	if (s.clusters) {
		// The graph re-groups (a new version re-runs its layout); the Clusters tab shows its cards
		useAppStore.setState((app) => ({ aiClusters: s.clusters!.assignments, aiClustersVersion: app.aiClustersVersion + 1 }));
		useContextStore.setState({
			clusterResults: s.clusters.results,
			clusterSuggestions: new Map(s.clusters.suggestions) as ContextState['clusterSuggestions'],
			clusterOverview: s.clusters.overview,
		});
	}
}

/** Empties the workspace: searches, context, chat, goal, and the saved copy */
export function clearWorkspace() {
	try {
		localStorage.removeItem(WORKSPACE_KEY);
	} catch {
		// storage unavailable: nothing to remove
	}
	useWorkspaceGoal.setState({ goal: '' });
	useAppStore.setState({ rounds: [], links: [], selectedSearches: [], query: '', hasSearched: false });
	useAppStore.getState().setSearchResults([]);
	useAppStore.getState().clearAiClusters();
	useContextStore.getState().clearContext();
	useContextStore.setState({ clusterSuggestions: new Map(), clusterOverview: null });
	useContextStore.getState().clearChatConversations();
}

/** Saves the workspace whenever it changes (a moment after, so typing doesn't save every key) */
export function keepSaving(delayMs = 400): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const save = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const snapshot = takeSnapshot();
			try {
				if (snapshot.rounds.length > 0) localStorage.setItem(WORKSPACE_KEY, JSON.stringify(snapshot));
			} catch {
				// full or unavailable storage: keep working, just not saved
			}
		}, delayMs);
	};
	const stops = [useAppStore.subscribe(save), useContextStore.subscribe(save), useWorkspaceGoal.subscribe(save)];
	return () => {
		clearTimeout(timer);
		stops.forEach((stop) => stop());
	};
}

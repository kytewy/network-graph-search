/**
 * Keeping the workspace: its goal, searches, results, context and chat are
 * saved in this browser and come back after a refresh. (Later they move to
 * the database, as workstreams.) AI clusters aren't kept: run them again.
 */
import { create } from 'zustand';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore, type ChatConversation } from '@/lib/stores/context-store';
import type { Link, Node } from '@/lib/config/types';
import type { SearchRound } from './collect';

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
}

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
	});
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
	useContextStore.getState().clearContext();
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

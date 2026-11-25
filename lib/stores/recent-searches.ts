/**
 * Searches you've run, newest first, kept in the browser so they're there
 * next time. The workspace's own searches (the ones with results on screen)
 * are shown apart, first.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MAX_RECENT = 12;

export interface RecentSearch {
	query: string;
	topK: number;
	at: number;
}

interface RecentSearchesState {
	recent: RecentSearch[];
	remember: (query: string, topK: number) => void;
	forget: (query: string) => void;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const useRecentSearches = create<RecentSearchesState>()(
	persist(
		(set) => ({
			recent: [],
			remember: (query, topK) =>
				set((s) => {
					const q = query.trim();
					if (!q) return s;
					return { recent: [{ query: q, topK, at: Date.now() }, ...s.recent.filter((r) => !same(r.query, q))].slice(0, MAX_RECENT) };
				}),
			forget: (query) => set((s) => ({ recent: s.recent.filter((r) => !same(r.query, query)) })),
		}),
		{ name: 'network-graph-search:recent-searches' }
	)
);

/** Recent searches that aren't already in the workspace */
export function olderSearches(recent: readonly RecentSearch[], inWorkspace: readonly string[]): RecentSearch[] {
	return recent.filter((r) => !inWorkspace.some((q) => same(q, r.query)));
}

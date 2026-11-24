'use client';

import { useCallback, useEffect } from 'react';
import { useQueryStates } from 'nuqs';
import { clampTopK, searchUrlParams } from '@/lib/url/search-params';
import { useAppStore } from '@/lib/stores/app-state';
import { keepSaving, readSnapshot, restoreSnapshot, snapshotMatches } from '@/lib/workspace/keep';

/**
 * Runs the search in the web address: when the page opens (a refresh or a
 * shared link) and when Back or Forward changes it. Repeats come from the
 * search memory, so they are instant. Use once, on the graph page.
 */
export function useSearchFromUrl() {
	const [{ q, k }] = useQueryStates(searchUrlParams);

	// The workspace is saved as it changes (lib/workspace/keep.ts)
	useEffect(() => keepSaving(), []);

	useEffect(() => {
		const query = q?.trim();
		const topK = clampTopK(k);
		// The saved workspace started from this search (or there's none in the
		// address): bring it back instead of searching again, once per page open
		if (useAppStore.getState().rounds.length === 0) {
			const saved = readSnapshot();
			if (snapshotMatches(saved, query, topK)) return restoreSnapshot(saved!);
		}
		if (!query) return;
		const { setQuery, setTopK, performSearch } = useAppStore.getState();
		setQuery(query);
		setTopK(topK);
		performSearch(query, topK);
	}, [q, k]);
}

/** For the search box: a new search goes into the address (and Back undoes it). */
export function useUrlSearch() {
	const [url, setUrl] = useQueryStates(searchUrlParams, { history: 'push' });

	const submit = useCallback(
		async (query: string, topK: number) => {
			const trimmed = query.trim();
			if (!trimmed) return;
			if (trimmed === url.q && topK === url.k) {
				// Same address, so nothing would change: search again directly
				useAppStore.getState().performSearch(trimmed, topK);
				return;
			}
			await setUrl({ q: trimmed, k: topK }); // useSearchFromUrl runs it
		},
		[url.q, url.k, setUrl]
	);

	const clear = useCallback(() => setUrl({ q: null, k: null }), [setUrl]);

	return { submit, clear };
}

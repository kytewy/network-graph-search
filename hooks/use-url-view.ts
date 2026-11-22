'use client';

import { useEffect, useRef } from 'react';
import { useQueryStates } from 'nuqs';
import { cleanView, viewUrlParams, type UrlView } from '@/lib/url/view-params';
import { FILTERS } from '@/lib/config/filters';

type FilterUrlKey = (typeof FILTERS)[number]['urlKey'];
import { useAppStore } from '@/lib/stores/app-state';
import { useNetworkStore } from '@/lib/stores/network-store';

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** The current filters and settings, as the address shows them. */
function viewFromStores(): UrlView {
	const app = useAppStore.getState();
	const store = app as unknown as Record<string, string[]>;
	return {
		...(Object.fromEntries(FILTERS.map((f) => [f.urlKey, store[f.storeKey]])) as Pick<UrlView, FilterUrlKey>),
		color: app.colorMode,
		size: app.nodeSizeMode,
		cluster: app.clusterMode,
		layout: useNetworkStore.getState().layoutType,
	};
}

/** Puts the address's filters and settings into the stores (only what differs). */
function applyView(view: UrlView) {
	const app = useAppStore.getState();
	const store = app as unknown as Record<string, string[]>;
	const filters = Object.fromEntries(FILTERS.map((f) => [f.storeKey, view[f.urlKey]]));
	const changed = FILTERS.some((f) => !sameList(store[f.storeKey] ?? [], view[f.urlKey]));
	if (changed) {
		useAppStore.setState(filters);
		useAppStore.getState().applyFilters();
	}
	if (app.colorMode !== view.color) app.setColorMode(view.color);
	if (app.nodeSizeMode !== view.size) app.setNodeSizeMode(view.size);
	if (app.clusterMode !== view.cluster) app.setClusterMode(view.cluster);
	if (useNetworkStore.getState().layoutType !== view.layout) useNetworkStore.getState().setLayoutType(view.layout);
}

/**
 * Keeps the filters and graph settings in the web address, so a refresh or
 * a shared link shows the same view. Changes replace the current history
 * entry, so Back still steps between searches. Use once, on the graph page.
 */
export function useViewInUrl() {
	const [url, setUrl] = useQueryStates(viewUrlParams, { history: 'replace', clearOnDefault: true });
	const lastWritten = useRef('');

	// Address → stores: when the page opens, and on Back/Forward.
	// (Runs before the subscription below, so opening a link never overwrites it.)
	const urlKey = JSON.stringify(url);
	useEffect(() => {
		applyView(cleanView(url));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [urlKey]);

	// Stores → address: whenever a filter or setting changes
	useEffect(() => {
		const write = () => {
			const view = viewFromStores();
			const key = JSON.stringify(view);
			if (key === lastWritten.current) return;
			lastWritten.current = key;
			setUrl(view);
		};
		const stopApp = useAppStore.subscribe(write);
		const stopNetwork = useNetworkStore.subscribe(write);
		return () => {
			stopApp();
			stopNetwork();
		};
	}, [setUrl]);
}

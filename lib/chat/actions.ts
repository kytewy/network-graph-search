/**
 * Chat actions in the browser: what's available to suggest, and applying
 * a suggestion (with its undo). The rules for what's valid are in
 * lib/contracts/analysis.ts.
 */
import { FILTERS, FOUND_BY_MANY } from '@/lib/config/filters';
import { CLUSTER_MODES, COLOR_MODES } from '@/lib/config/view-modes';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import { matchCitation } from './citations';
import type { ActionOptions, ChatAction } from '@/lib/contracts/analysis';

const unique = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))].sort();

/** Everything an answer may suggest right now: values in the results, searches, view modes */
export function actionOptionsFromStore(): ActionOptions {
	const { searchResults, rounds, aiClusters } = useAppStore.getState();
	const collected = rounds.length > 1;
	const clustered = Object.keys(aiClusters).length > 0;
	return {
		continents: unique(searchResults.map((d) => d.continent)),
		countries: unique(searchResults.map((d) => d.country)),
		publishers: unique(searchResults.map((d) => d.publisher)),
		searches: collected ? [...rounds.map((r) => ({ value: String(r.n), query: r.query })), { value: FOUND_BY_MANY, query: 'found by 2+ searches' }] : [],
		colorModes: COLOR_MODES.map((m) => m.id as string).filter((id) => id !== 'search' || collected),
		clusterModes: CLUSTER_MODES.map((m) => m.id as string).filter((id) => (id !== 'search' || collected) && (id !== 'ai_clusters' || clustered)),
		titles: searchResults.map((d) => d.label),
	};
}

/** Applies a suggested action; returns how to undo it */
export function applyAction(action: ChatAction): () => void {
	const app = useAppStore.getState();
	switch (action.type) {
		case 'filter': {
			const def = FILTERS.find((f) => f.id === action.filter)!;
			const before = (app as unknown as Record<string, string[]>)[def.storeKey] ?? [];
			const set = (values: string[]) => {
				useAppStore.setState({ [def.storeKey]: values } as never);
				useAppStore.getState().applyFilters();
			};
			set(action.values);
			return () => set(before);
		}
		case 'color': {
			const before = app.colorMode;
			app.setColorMode(action.mode as typeof before);
			return () => useAppStore.getState().setColorMode(before);
		}
		case 'cluster': {
			const before = app.clusterMode;
			app.setClusterMode(action.mode as typeof before);
			return () => useAppStore.getState().setClusterMode(before);
		}
		case 'context': {
			const ctx = useContextStore.getState();
			const inContext = new Set(ctx.contextNodes.map((n) => n.id));
			const docs = app.searchResults.map((d) => ({ id: d.id, label: d.label }));
			const ids = new Set(action.titles.map((t) => matchCitation(t, docs)?.id).filter((id): id is string => Boolean(id) && !inContext.has(id!)));
			ctx.addNodesToContext(app.searchResults.filter((d) => ids.has(d.id)));
			return () => ids.forEach((id) => useContextStore.getState().removeNodeFromContext(id));
		}
	}
}

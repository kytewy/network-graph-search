/**
 * Chat actions in the browser: what's available to suggest, and applying
 * a suggestion (with its undo). The rules for what's valid are in
 * lib/contracts/analysis.ts.
 */
import { FILTERS, FOUND_BY_MANY, selectionsFromStore } from '@/lib/config/filters';
import { filterNodes } from '@/lib/filters/filter-nodes';
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

/*
 * What a suggestion shows: the app writes the button text from the action
 * itself (so it always says exactly what will happen), counts what a filter
 * would leave, and offers close alternatives ("Europe" vs "European Union").
 */
const FILTER_NAMES: Record<string, string> = { continents: 'Continent', countries: 'Country', publishers: 'Publisher', searches: 'Search' };

function valueName(filter: string, value: string): string {
	if (filter !== 'searches') return value;
	if (value === FOUND_BY_MANY) return 'Found by 2+ searches';
	const round = useAppStore.getState().rounds.find((r) => String(r.n) === value);
	return round ? `#${round.n} ${round.query}` : `#${value}`;
}

/** The documents an action's context titles point to, in the results */
function citedDocs(titles: readonly string[]) {
	const { searchResults } = useAppStore.getState();
	const docs = searchResults.map((d) => ({ id: d.id, label: d.label }));
	const ids = new Set(titles.map((t) => matchCitation(t, docs)?.id).filter(Boolean));
	return searchResults.filter((d) => ids.has(d.id));
}

/** The button text: exactly what the action does */
export function describeAction(action: ChatAction): string {
	switch (action.type) {
		case 'filter':
			return `${FILTER_NAMES[action.filter]}: ${action.values.map((v) => valueName(action.filter, v)).join(', ')}`;
		case 'color':
			return `Colour by ${COLOR_MODES.find((m) => m.id === action.mode)?.label ?? action.mode}`;
		case 'cluster':
			return `Cluster by ${CLUSTER_MODES.find((m) => m.id === action.mode)?.label ?? action.mode}`;
		case 'context': {
			const docs = citedDocs(action.titles);
			return docs.length === 1 ? `Add ${docs[0].label}` : `Add ${docs.length} documents`;
		}
	}
}

/** How many documents a filter would leave (with the other filters as they are); null for other actions */
export function previewCount(action: ChatAction): number | null {
	if (action.type === 'context') return citedDocs(action.titles).length;
	if (action.type !== 'filter') return null;
	const app = useAppStore.getState();
	return filterNodes(app.searchResults, { ...selectionsFromStore(app), [action.filter]: action.values }).length;
}

/** Close alternatives to a suggestion, for its ▾ menu (only ones that would show something) */
export function alternatives(action: ChatAction): ChatAction[] {
	const o = actionOptionsFromStore();
	const { searchResults } = useAppStore.getState();
	const filter = (f: 'continents' | 'countries' | 'publishers' | 'searches', value: string): ChatAction => ({ type: 'filter', filter: f, values: [value], label: '' });
	let options: ChatAction[] = [];
	if (action.type === 'filter') {
		const value = action.values[0];
		if (action.filter === 'continents' || action.filter === 'countries') {
			// Location: the continent and its countries, either way round
			const continent = action.filter === 'continents' ? value : searchResults.find((d) => d.country === value)?.continent;
			const countries = [...new Set(searchResults.filter((d) => d.continent === continent && d.country).map((d) => d.country!))].sort();
			options = [...(continent ? [filter('continents', continent)] : []), ...countries.map((c) => filter('countries', c))];
		} else if (action.filter === 'publishers') {
			options = o.publishers.map((p) => filter('publishers', p));
		} else {
			options = o.searches.map((s) => filter('searches', s.value));
		}
	} else if (action.type === 'color') {
		options = o.colorModes.map((mode) => ({ type: 'color', mode, label: '' }));
	} else if (action.type === 'cluster') {
		options = o.clusterModes.filter((m) => m !== 'none').map((mode) => ({ type: 'cluster', mode, label: '' }));
	}
	const same = (a: ChatAction) => describeAction(a) === describeAction(action);
	return options.filter((a) => !same(a) && (previewCount(a) ?? 1) > 0).slice(0, 6);
}

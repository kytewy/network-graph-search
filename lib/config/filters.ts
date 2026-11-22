/**
 * The one list of filters. The filter panel's narrowing (filterNodes), the
 * Pinecone search filter (buildPineconeFilter) and the web address all read
 * from here, so adding a filter means editing this file (plus its panel UI).
 *
 * Filters in the same `group` are combined with OR (a document in a ticked
 * continent OR a ticked country); different groups combine with AND.
 */
import type { Node } from '@/lib/config/types';
import { PUBLISHERS } from '@/lib/config/document-taxonomy';
import { SEARCH_CONFIG } from '@/lib/config/search-config';
import { CONTINENT_COUNTRY_MAP, COUNTRY_CONTINENT_MAP } from '@/lib/stores/country_map';

interface FilterDef {
	/** Name in filter selections and in the search request */
	id: string;
	/** Name in the web address */
	urlKey: string;
	/** Where the app store keeps the ticked values */
	storeKey: string;
	group: string;
	matches: (node: Node, selected: readonly string[]) => boolean;
	/** Can Pinecone apply this before searching? Then: the metadata field */
	inPinecone: boolean;
	pineconeField?: string;
	/** Values a link may contain; anything else is dropped (none = free text) */
	knownValues?: () => readonly string[];
}

const percentOf = (node: Node) => Math.round((node.score || 0) * 100);

export const FILTERS = [
	{
		id: 'continents',
		urlKey: 'continent',
		storeKey: 'selectedContinents',
		group: 'location',
		matches: (n, s) => s.includes(n.continent ?? ''),
		inPinecone: true,
		pineconeField: 'continent',
		knownValues: () => Object.keys(CONTINENT_COUNTRY_MAP),
	},
	{
		id: 'countries',
		urlKey: 'country',
		storeKey: 'selectedCountries',
		group: 'location',
		matches: (n, s) => s.includes(n.country ?? ''),
		inPinecone: true,
		pineconeField: 'country',
		knownValues: () => Object.keys(COUNTRY_CONTINENT_MAP),
	},
	{
		id: 'tags',
		urlKey: 'tag',
		storeKey: 'selectedTags',
		group: 'tags',
		matches: (n, s) => (n.tags ?? []).some((tag) => s.includes(tag)),
		inPinecone: true,
		pineconeField: 'tags',
	},
	{
		id: 'publishers',
		urlKey: 'publisher',
		storeKey: 'selectedPublishers',
		group: 'publishers',
		matches: (n, s) => s.includes(n.publisher),
		inPinecone: true,
		pineconeField: 'publisher',
		knownValues: () => PUBLISHERS.map((p) => p.value),
	},
	{
		// The score is worked out per search, so only the page can filter by it
		id: 'similarityRanges',
		urlKey: 'similarity',
		storeKey: 'selectedSimilarityRanges',
		group: 'similarity',
		matches: (n, s) =>
			SEARCH_CONFIG.SIMILARITY_RANGES.some((r) => s.includes(r.range) && percentOf(n) >= r.min && percentOf(n) <= r.max),
		inPinecone: false,
		knownValues: () => SEARCH_CONFIG.SIMILARITY_RANGES.map((r) => r.range),
	},
] as const satisfies readonly FilterDef[];

export type FilterId = (typeof FILTERS)[number]['id'];
export type FilterSelections = Record<FilterId, string[]>;

export function emptySelections(): FilterSelections {
	return Object.fromEntries(FILTERS.map((f) => [f.id, []])) as unknown as FilterSelections;
}

export function selectionsFromStore(state: object): FilterSelections {
	const store = state as Record<string, unknown>;
	return Object.fromEntries(
		FILTERS.map((f) => [f.id, Array.isArray(store[f.storeKey]) ? (store[f.storeKey] as string[]) : []])
	) as unknown as FilterSelections;
}

/** Keeps only lists of text for known filters (e.g. from a search request). */
export function cleanSelections(input: Record<string, unknown> = {}): FilterSelections {
	return Object.fromEntries(
		FILTERS.map((f) => {
			const value = input[f.id];
			return [f.id, Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []];
		})
	) as unknown as FilterSelections;
}

/** Groups of ticked filters: within a group OR, between groups AND. */
export function activeGroups(selections: Partial<FilterSelections>, only?: (f: FilterDef) => boolean) {
	const groups = new Map<string, { def: FilterDef; selected: string[] }[]>();
	for (const def of FILTERS as readonly FilterDef[]) {
		const selected = selections[def.id as FilterId] ?? [];
		if (selected.length === 0 || (only && !only(def))) continue;
		groups.set(def.group, [...(groups.get(def.group) ?? []), { def, selected }]);
	}
	return [...groups.values()];
}

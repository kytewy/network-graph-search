/**
 * Filters and graph settings in the web address, next to the search:
 * /graph?q=AI&k=20&continent=Europe,Asia&publisher=Regulator&color=publisher
 * Only settings changed from their defaults appear.
 */
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, type inferParserType } from 'nuqs';
import { PUBLISHERS } from '@/lib/config/document-taxonomy';
import { SEARCH_CONFIG } from '@/lib/config/search-config';
import { CONTINENT_COUNTRY_MAP, COUNTRY_CONTINENT_MAP } from '@/lib/stores/country_map';

const COLOR_MODES = ['continent', 'publisher', 'similarityRange', 'documentType', 'country'] as const;
const SIZE_MODES = ['none', 'contentLength', 'summaryLength', 'similarity'] as const;
const CLUSTER_MODES = ['none', 'documentType', 'continent', 'country', 'publisher', 'ai_clusters'] as const;
const LAYOUTS = ['forceDirected2d', 'circular2d', 'treeTd2d', 'treeLr2d', 'radialOut2d', 'forceatlas2'] as const;

const list = parseAsArrayOf(parseAsString).withDefault([]);

export const viewUrlParams = {
	continent: list,
	country: list,
	publisher: list,
	tag: list,
	similarity: list,
	// An unknown value in a link falls back to the default
	color: parseAsStringLiteral(COLOR_MODES).withDefault('continent'),
	size: parseAsStringLiteral(SIZE_MODES).withDefault('none'),
	cluster: parseAsStringLiteral(CLUSTER_MODES).withDefault('none'),
	layout: parseAsStringLiteral(LAYOUTS).withDefault('forceDirected2d'),
};

export type UrlView = inferParserType<typeof viewUrlParams>;

const known = (allowed: Iterable<string>) => {
	const set = new Set(allowed);
	return (values: string[]) => values.filter((v) => set.has(v));
};
const knownContinents = known(Object.keys(CONTINENT_COUNTRY_MAP));
const knownCountries = known(Object.keys(COUNTRY_CONTINENT_MAP));
const knownPublishers = known(PUBLISHERS.map((p) => p.value));
const knownRanges = known(SEARCH_CONFIG.SIMILARITY_RANGES.map((r) => r.range));

/** Drops filter values a link might contain that the app doesn't know. Tags are free text. */
export function cleanView(view: UrlView): UrlView {
	return {
		...view,
		continent: knownContinents(view.continent),
		country: knownCountries(view.country),
		publisher: knownPublishers(view.publisher),
		similarity: knownRanges(view.similarity),
	};
}

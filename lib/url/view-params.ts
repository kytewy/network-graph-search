/**
 * Filters and graph settings in the web address, next to the search:
 * /graph?q=AI&k=20&continent=Europe,Asia&publisher=Regulator&color=publisher
 * Only settings changed from their defaults appear.
 */
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, type inferParserType } from 'nuqs';
import { URL_FILTERS } from '@/lib/config/filters';
import { CLUSTER_MODES, COLOR_MODES, LAYOUT_IDS, SIZE_MODES, ids } from '@/lib/config/view-modes';

const list = parseAsArrayOf(parseAsString).withDefault([]);

// One list per filter, named by its urlKey (lib/config/filters.ts)
const filterParams = Object.fromEntries(URL_FILTERS.map((f) => [f.urlKey, list])) as Record<
	(typeof URL_FILTERS)[number]['urlKey'],
	typeof list
>;

export const viewUrlParams = {
	...filterParams,
	// An unknown value in a link falls back to the default
	color: parseAsStringLiteral(ids(COLOR_MODES)).withDefault('continent'),
	size: parseAsStringLiteral(ids(SIZE_MODES)).withDefault('none'),
	cluster: parseAsStringLiteral(ids(CLUSTER_MODES)).withDefault('none'),
	layout: parseAsStringLiteral(LAYOUT_IDS).withDefault('forceDirected2d'),
};

export type UrlView = inferParserType<typeof viewUrlParams>;

/** Drops filter values a link might contain that the app doesn't know. Tags are free text. */
export function cleanView(view: UrlView): UrlView {
	const cleaned = { ...view };
	for (const f of URL_FILTERS) {
		const known = 'knownValues' in f ? new Set<string>(f.knownValues()) : null;
		if (known) cleaned[f.urlKey] = view[f.urlKey].filter((v) => known.has(v));
	}
	return cleaned;
}

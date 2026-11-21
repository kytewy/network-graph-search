import type { Node } from '@/lib/config/types';

export interface NodeFilters {
	continents: string[];
	countries: string[];
	tags: string[];
	publishers: string[];
	similarityRanges: string[];
}

// Similarity range ids used by the histogram, in percent
const SIMILARITY_RANGES: Record<string, [number, number]> = {
	'<20': [0, 19],
	'21-40': [20, 40],
	'41-60': [41, 60],
	'61-80': [61, 80],
	'81-100': [81, 100],
};

/**
 * Narrows the loaded search results to what the filter panel selects.
 * Always starts from the full results, so unticking a filter brings
 * documents straight back. Location matches a selected continent OR a
 * selected country; different filters combine with AND.
 */
export function filterNodes(nodes: readonly Node[], filters: NodeFilters): Node[] {
	const { continents, countries, tags, publishers, similarityRanges } = filters;
	const hasLocation = continents.length > 0 || countries.length > 0;

	return nodes.filter((node) => {
		if (
			hasLocation &&
			!continents.includes(node.continent ?? '') &&
			!countries.includes(node.country ?? '')
		) {
			return false;
		}
		if (tags.length > 0 && !(node.tags ?? []).some((tag) => tags.includes(tag))) return false;
		if (publishers.length > 0 && !publishers.includes(node.publisher)) return false;
		if (similarityRanges.length > 0) {
			const percent = Math.round((node.score || 0) * 100);
			const inRange = similarityRanges.some((id) => {
				const range = SIMILARITY_RANGES[id];
				return range ? percent >= range[0] && percent <= range[1] : false;
			});
			if (!inRange) return false;
		}
		return true;
	});
}

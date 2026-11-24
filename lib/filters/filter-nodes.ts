import type { Node } from '@/lib/config/types';
import { activeGroups, type FilterSelections } from '@/lib/config/filters';

/** What the filter panel has ticked, by filter (see lib/config/filters.ts). */
export type NodeFilters = FilterSelections;

/**
 * Narrows the loaded search results to what the filter panel selects.
 * Always starts from the full results, so unticking a filter brings
 * documents straight back. Location matches a selected continent OR a
 * selected country; different filters combine with AND.
 */
/**
 * What one filter group counts from: the results narrowed by every *other*
 * group's ticks. So ticking "#2 compliance" recounts Location, while the
 * Searches section still shows what ticking #1 too would add.
 */
export function facetNodes(nodes: readonly Node[], filters: Partial<NodeFilters>, group: string): Node[] {
	return nodes.filter((node) =>
		activeGroups(filters)
			.filter((g) => g[0].def.group !== group)
			.every((g) => g.some(({ def, selected }) => def.matches(node, selected)))
	);
}

export function filterNodes(nodes: readonly Node[], filters: Partial<NodeFilters>): Node[] {
	const groups = activeGroups(filters);
	return nodes.filter((node) => groups.every((group) => group.some(({ def, selected }) => def.matches(node, selected))));
}

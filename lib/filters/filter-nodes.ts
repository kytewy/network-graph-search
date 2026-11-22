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
export function filterNodes(nodes: readonly Node[], filters: Partial<NodeFilters>): Node[] {
	const groups = activeGroups(filters);
	return nodes.filter((node) => groups.every((group) => group.some(({ def, selected }) => def.matches(node, selected))));
}

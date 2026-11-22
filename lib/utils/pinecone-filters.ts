import { debugLog } from '@/lib/utils/debug';
import { activeGroups, cleanSelections, type FilterSelections } from '@/lib/config/filters';
/**
 * Utility functions for building Pinecone metadata filter expressions
 * 
 * Converts user filter selections into Pinecone's filter query format
 * https://docs.pinecone.io/guides/data/filter-with-metadata
 */

/** Filters a search may send; any extra or malformed values are dropped. */
export type FilterMetadata = Partial<FilterSelections>;

/**
 * Builds Pinecone's metadata filter from the ticked filters, for the ones
 * Pinecone can apply (lib/config/filters.ts marks them). Similarity is left
 * out: the score is worked out per search, not stored.
 *
 * @returns The filter expression, or undefined when nothing is ticked
 */
export function buildPineconeFilter(filters: FilterMetadata | Record<string, unknown>): Record<string, any> | undefined {
	const groups = activeGroups(cleanSelections(filters as Record<string, unknown>), (f) => f.inPinecone);
	const conditions = groups.map((group) => {
		const parts = group.map(({ def, selected }) => ({ [def.pineconeField as string]: { $in: selected } }));
		// Same group (continent or country): either may match
		return parts.length === 1 ? parts[0] : { $or: parts };
	});
	if (conditions.length === 0) return undefined;
	return conditions.length === 1 ? conditions[0] : { $and: conditions };
}

/**
 * Log the filter expression in a readable format for debugging
 */
export function logFilterExpression(filters: FilterMetadata, expression: Record<string, any> | undefined) {
	debugLog('[Pinecone Filter] Input filters:', JSON.stringify(filters, null, 2));
	
	if (expression) {
		debugLog('[Pinecone Filter] Generated expression:', JSON.stringify(expression, null, 2));
	} else {
		debugLog('[Pinecone Filter] No filters applied');
	}
}

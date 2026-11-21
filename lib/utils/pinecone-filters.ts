import { debugLog } from '@/lib/utils/debug';
/**
 * Utility functions for building Pinecone metadata filter expressions
 * 
 * Converts user filter selections into Pinecone's filter query format
 * https://docs.pinecone.io/guides/data/filter-with-metadata
 */

export interface FilterMetadata {
	continents?: string[];
	countries?: string[];
	tags?: string[];
	publishers?: string[];
}

/**
 * Build Pinecone metadata filter expression from user filter selections
 * 
 * Similarity ranges are not included: score is computed per search, not stored
 * as metadata, so they are applied in the browser as a display filter.
 *
 * @param filters User filter selections (continents, countries, tags, publishers)
 * @returns Pinecone filter expression object or undefined if no filters
 */
export function buildPineconeFilter(filters: FilterMetadata): Record<string, any> | undefined {
	const conditions: any[] = [];

	// Geography filters - use $or to match either continent or country
	const geoConditions: any[] = [];
	
	if (filters.continents && filters.continents.length > 0) {
		geoConditions.push({
			continent: { $in: filters.continents }
		});
	}
	
	if (filters.countries && filters.countries.length > 0) {
		geoConditions.push({
			country: { $in: filters.countries }
		});
	}
	
	// If we have geography filters, combine them with $or
	if (geoConditions.length > 0) {
		if (geoConditions.length === 1) {
			conditions.push(geoConditions[0]);
		} else {
			conditions.push({ $or: geoConditions });
		}
	}

	// Tags filter - match any of the selected tags
	if (filters.tags && filters.tags.length > 0) {
		// Assuming tags field is an array in Pinecone metadata
		// Use $in to match if any selected tag is in the document's tags array
		conditions.push({
			tags: { $in: filters.tags }
		});
	}

	// Publisher filter - who published the document
	if (filters.publishers && filters.publishers.length > 0) {
		conditions.push({ publisher: { $in: filters.publishers } });
	}

	// If no conditions, return undefined (no filtering)
	if (conditions.length === 0) {
		return undefined;
	}

	// If only one condition, return it directly
	if (conditions.length === 1) {
		return conditions[0];
	}

	// Multiple conditions - combine with $and
	return { $and: conditions };
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

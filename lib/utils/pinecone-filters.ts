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
	similarityRanges?: string[];
}

/**
 * Convert similarity range strings to numeric bounds
 * Example: "81-100" -> { min: 0.81, max: 1.0 }
 */
function parseSimilarityRange(range: string): { min: number; max: number } | null {
	const match = range.match(/^(\d+)-(\d+)$/);
	if (!match) return null;
	
	const min = parseInt(match[1]) / 100;
	const max = parseInt(match[2]) / 100;
	
	return { min, max };
}

/**
 * Build Pinecone metadata filter expression from user filter selections
 * 
 * @param filters User filter selections (continents, countries, tags, similarity ranges)
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

	// Similarity/score filters - convert ranges to numeric bounds
	if (filters.similarityRanges && filters.similarityRanges.length > 0) {
		const scoreConditions: any[] = [];
		
		for (const range of filters.similarityRanges) {
			const bounds = parseSimilarityRange(range);
			if (bounds) {
				// Create a condition for this range: score >= min AND score <= max
				scoreConditions.push({
					$and: [
						{ score: { $gte: bounds.min } },
						{ score: { $lte: bounds.max } }
					]
				});
			}
		}
		
		// Combine multiple score ranges with $or
		if (scoreConditions.length > 0) {
			if (scoreConditions.length === 1) {
				conditions.push(scoreConditions[0]);
			} else {
				conditions.push({ $or: scoreConditions });
			}
		}
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
	console.log('[Pinecone Filter] Input filters:', JSON.stringify(filters, null, 2));
	
	if (expression) {
		console.log('[Pinecone Filter] Generated expression:', JSON.stringify(expression, null, 2));
	} else {
		console.log('[Pinecone Filter] No filters applied');
	}
}

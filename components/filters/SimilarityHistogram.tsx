'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-state';
import { safeIncludes, ensureArray } from '@/lib/utils/array-safety';
import { logArrayOperation } from '@/lib/utils/error-tracker';
import { SEARCH_CONFIG } from '@/lib/config/search-config';

/**
 * SimilarityHistogram component
 * Displays a histogram of search results by similarity ranges
 * Allows filtering results by clicking on bars
 */
export function SimilarityHistogram() {
	const [isClient, setIsClient] = useState(false);

	// Get state and actions from app store - MUST be called before conditional returns
	const searchResults = useAppStore((state) => state.searchResults);
	const selectedSimilarityRanges = useAppStore(
		(state) => state.selectedSimilarityRanges
	);
	const toggleSimilarityRange = useAppStore(
		(state) => state.toggleSimilarityRange
	);
	const clearSimilarityRanges = useAppStore(
		(state) => state.clearSimilarityRanges
	);

	// Generate histogram data from search results - MUST be called before conditional returns
	const histogramData = useMemo(() => {
		const ranges = SEARCH_CONFIG.SIMILARITY_RANGES;

		// Always show bars if we have nodes
		const safeSearchResults = ensureArray(searchResults);
		if (safeSearchResults.length === 0) {
			// Return minimal width bars when no results are available
			return ranges.map(({ range, min, max }) => ({
				range,
				count: 0,
				width: SEARCH_CONFIG.HISTOGRAM.MIN_BAR_WIDTH,
				min,
				max,
			}));
		}

		// Calculate based on search results using vector search scores
		const processedResults = safeSearchResults.map((node) => {
			// Handle different score formats:
			// 1. _score from Pinecone API (already between 0-1)
			// 2. score from processed results (already between 0-1)
			// 3. similarity from other sources (already between 0-1)
			const similarity = node._score || node.score || node.similarity || 0;

			return {
				...node,
				// Convert to percentage (0-100)
				searchSimilarity: Math.round(similarity * 100),
			};
		});

		// Calculate counts for each range
		const rangeCounts = ranges.map(({ range, min, max }) => {
			const count = processedResults.filter((node) => {
				const similarity = node.searchSimilarity;
				return similarity >= min && similarity <= max;
			}).length;
			return { range, count, min, max };
		});

		// Find the maximum count across all ranges
		const maxCount = Math.max(
			...rangeCounts.map((item) => item.count),
			1 // Ensure we don't divide by zero
		);

		// Calculate widths based on the maximum count
		return rangeCounts.map(({ range, count, min, max }) => {
			// If count is 0, show a minimal bar width
			// Otherwise, scale the width based on the proportion of the maximum count
			const width = count === 0 
				? SEARCH_CONFIG.HISTOGRAM.MIN_BAR_WIDTH 
				: Math.max(
						SEARCH_CONFIG.HISTOGRAM.MIN_BAR_WIDTH, 
						(count / maxCount) * SEARCH_CONFIG.HISTOGRAM.MAX_BAR_WIDTH
					);
			return { range, count, width, min, max };
		});
	}, [searchResults]);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<div className="text-sm text-muted-foreground">Loading histogram...</div>
		);
	}

	return (
		<div className="w-full">
			<div className="space-y-2">
				{histogramData.map((bar) => (
					<div key={bar.range} className="flex items-center gap-3">
						<div className="w-16 text-xs text-muted-foreground text-right">
							{bar.range}%
						</div>
						<div className="flex-1 relative">
							<div
								className={`${SEARCH_CONFIG.HISTOGRAM.BAR_HEIGHT} rounded cursor-pointer transition-all ${SEARCH_CONFIG.HISTOGRAM.ANIMATION_DURATION} flex items-center justify-end pr-2 ${
									(() => {
										logArrayOperation('safeIncludes check', selectedSimilarityRanges, 'SimilarityHistogram bar selection');
										return safeIncludes(selectedSimilarityRanges, bar.range);
									})()
										? 'bg-primary hover:bg-primary/90 shadow-md'
										: 'bg-muted hover:bg-muted/80'
								}`}
								style={{ width: `${bar.width}%` }}
								onClick={() => toggleSimilarityRange(bar.range)}>
								{bar.count > 0 && (
									<span className="text-xs font-medium text-white">
										{bar.count}
									</span>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

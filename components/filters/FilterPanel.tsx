'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Filter, Target, Globe, Tag, Building2 } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-state';
import { SimilarityHistogram } from '@/components/filters/SimilarityHistogram';
import { GeographicFilters } from './GeographicFilters';
import { PublisherFilters } from './PublisherFilters';
import { TagFilters } from './TagFilters';

/**
 * FilterPanel - Main coordinator for filtering options
 *
 * Centralizes all filtering functionality:
 * - Similarity filtering (histogram)
 * - Geographic filtering (continents/countries)
 * - Tag filtering
 * - Publisher filtering (who published the document)
 *
 * Manages state and delegates rendering to sub-components
 */
const FilterPanel = () => {
	const [isClient, setIsClient] = useState(false);

	// Get all required state and actions from app-state store - MUST be called before conditional returns
	const filteredResults = useAppStore((state) => state.filteredResults);
	const selectedContinents = useAppStore((state) => state.selectedContinents);
	const selectedCountries = useAppStore((state) => state.selectedCountries);
	const toggleContinent = useAppStore((state) => state.toggleContinent);
	const toggleCountry = useAppStore((state) => state.toggleCountry);
	const clearLocationFilters = useAppStore(
		(state) => state.clearLocationFilters
	);

	// Get helper functions from store
	const getNodeCountByContinent = useAppStore(
		(state) => state.getNodeCountByContinent
	);
	const getNodeCountByCountry = useAppStore(
		(state) => state.getNodeCountByCountry
	);
	const getAvailableContinents = useAppStore(
		(state) => state.getAvailableContinents
	);
	const getCountriesByContinent = useAppStore(
		(state) => state.getCountriesByContinent
	);

	// Tag filtering state and actions
	const selectedTags = useAppStore((state) => state.selectedTags);
	const toggleTag = useAppStore((state) => state.toggleTag);
	const clearTagFilters = useAppStore((state) => state.clearTagFilters);
	const getAvailableTags = useAppStore((state) => state.getAvailableTags);
	const getNodeCountByTag = useAppStore((state) => state.getNodeCountByTag);

	// Similarity filtering state and actions
	const selectedSimilarityRanges = useAppStore((state) => state.selectedSimilarityRanges);
	const clearSimilarityRanges = useAppStore((state) => state.clearSimilarityRanges);

	// Publisher filtering state and actions
	const selectedPublishers = useAppStore((state) => state.selectedPublishers);
	const togglePublisher = useAppStore((state) => state.togglePublisher);
	const clearPublisherFilters = useAppStore((state) => state.clearPublisherFilters);
	const getAvailablePublishers = useAppStore((state) => state.getAvailablePublishers);
	const getNodeCountByPublisher = useAppStore((state) => state.getNodeCountByPublisher);

	// Local UI state
	const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<div className="space-y-4">
				<div className="text-sm text-gray-500">Loading filters...</div>
			</div>
		);
	}

	// Handlers
	const toggleExpandedContinent = (continent: string) => {
		setExpandedContinents((prev) => {
			const safePrev = Array.isArray(prev) ? prev : [];
			return safePrev.includes(continent)
				? safePrev.filter((c) => c !== continent)
				: [...safePrev, continent];
		});
	};

	const clearAllFilters = () => {
		clearLocationFilters();
		clearTagFilters();
		clearSimilarityRanges();
		clearPublisherFilters();
	};

	// Derived data
	const availableContinents = getAvailableContinents();
	const availableTags = getAvailableTags();
	const availablePublishers = getAvailablePublishers();

	const totalFiltersActive =
		selectedContinents.length +
		selectedCountries.length +
		selectedTags.length +
		selectedPublishers.length +
		selectedSimilarityRanges.length;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Filters</h3>
				{totalFiltersActive > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearAllFilters}
						className="h-8 gap-1 text-xs">
						<Filter className="h-3 w-3" />
						Clear All
					</Button>
				)}
			</div>

			{/* Similarity Score Card */}
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-start gap-3">
						<Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<h4 className="font-semibold text-base mb-1">Similarity Score</h4>
							<p className="text-sm text-muted-foreground mb-2">
								Filter results by vector similarity score distribution
							</p>
							<SimilarityHistogram />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Geographic Filters Card */}
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-start gap-3">
						<Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<h4 className="font-semibold text-base mb-1">Geographic Filters</h4>
							<p className="text-sm text-muted-foreground mb-2">
								Filter by continent or region ({availableContinents.length} continents, {filteredResults.length} nodes)
							</p>
							<GeographicFilters
								availableContinents={availableContinents}
								selectedContinents={selectedContinents}
								selectedCountries={selectedCountries}
								expandedContinents={expandedContinents}
								countrySearchTerm={countrySearchTerm}
								filteredResultsCount={filteredResults.length}
								toggleContinent={toggleContinent}
								toggleCountry={toggleCountry}
								toggleExpandedContinent={toggleExpandedContinent}
								getNodeCountByContinent={getNodeCountByContinent}
								getNodeCountByCountry={getNodeCountByCountry}
								getCountriesByContinent={getCountriesByContinent}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Publisher Card */}
			{availablePublishers.length > 0 && (
				<Card>
					<CardContent className="p-4 space-y-2">
						<div className="flex items-start gap-3">
							<Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<h4 className="font-semibold text-base mb-1">Publisher</h4>
								<p className="text-sm text-muted-foreground mb-2">
									Who published the document. Ticking one searches again for only those.
								</p>
								<PublisherFilters
									availablePublishers={availablePublishers}
									selectedPublishers={selectedPublishers}
									togglePublisher={togglePublisher}
									getNodeCountByPublisher={getNodeCountByPublisher}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Tags Card */}
			{availableTags.length > 0 && (
				<Card>
					<CardContent className="p-4 space-y-2">
						<div className="flex items-start gap-3">
							<Tag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<h4 className="font-semibold text-base mb-1">Tags</h4>
								<p className="text-sm text-muted-foreground mb-2">
									Filter by document tags or categories
								</p>
								<TagFilters
									availableTags={availableTags}
									selectedTags={selectedTags}
									toggleTag={toggleTag}
									getNodeCountByTag={getNodeCountByTag}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default FilterPanel;

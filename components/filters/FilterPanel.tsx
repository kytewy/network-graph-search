'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, Target, Globe, Tag, Building2, Info, Search, CalendarRange, type LucideIcon } from 'lucide-react';
import { SearchesFilter } from './SearchesFilter';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/stores/app-state';
import { useShallow } from 'zustand/react/shallow';
import { SimilarityHistogram } from '@/components/filters/SimilarityHistogram';
import { GeographicFilters } from './GeographicFilters';
import { PublisherFilters } from './PublisherFilters';
import { TagFilters } from './TagFilters';
import { PublishedTimeline } from './PublishedTimeline';

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
/** One filter group: a small title with its description in an ⓘ hover, then its controls. */
function FilterSection({ icon: Icon, title, about, children }: {
	icon: LucideIcon;
	title: string;
	about: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-t border-sidebar-border pt-3 space-y-2" aria-label={title}>
			<div className="flex items-center gap-2">
				<Icon className="h-4 w-4 text-primary shrink-0" />
				<h4 className="font-semibold text-sm">{title}</h4>
				<Tooltip>
					<TooltipTrigger asChild>
						<button type="button" aria-label={`About ${title}`} className="text-muted-foreground hover:text-foreground">
							<Info className="h-3.5 w-3.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent className="max-w-56">{about}</TooltipContent>
				</Tooltip>
			</div>
			{children}
		</section>
	);
}

const FilterPanel = () => {
	const [isClient, setIsClient] = useState(false);

	// Everything the panel reads from the store, in one read (MUST be called before
	// conditional returns). useShallow redraws the panel only when one of these changes.
	const {
		filteredResults,
		searchResults,
		selectedContinents,
		selectedCountries,
		toggleContinent,
		toggleCountry,
		clearLocationFilters,
		getNodeCountByContinent,
		getNodeCountByCountry,
		getAvailableContinents,
		getCountriesByContinent,
		selectedTags,
		toggleTag,
		clearTagFilters,
		getAvailableTags,
		getNodeCountByTag,
		selectedSimilarityRanges,
		clearSimilarityRanges,
		selectedPublishers,
		togglePublisher,
		clearPublisherFilters,
		getAvailablePublishers,
		getNodeCountByPublisher,
	} = useAppStore(
		useShallow((state) => ({
			filteredResults: state.filteredResults,
			searchResults: state.searchResults,
			selectedContinents: state.selectedContinents,
			selectedCountries: state.selectedCountries,
			toggleContinent: state.toggleContinent,
			toggleCountry: state.toggleCountry,
			clearLocationFilters: state.clearLocationFilters,
			getNodeCountByContinent: state.getNodeCountByContinent,
			getNodeCountByCountry: state.getNodeCountByCountry,
			getAvailableContinents: state.getAvailableContinents,
			getCountriesByContinent: state.getCountriesByContinent,
			selectedTags: state.selectedTags,
			toggleTag: state.toggleTag,
			clearTagFilters: state.clearTagFilters,
			getAvailableTags: state.getAvailableTags,
			getNodeCountByTag: state.getNodeCountByTag,
			selectedSimilarityRanges: state.selectedSimilarityRanges,
			clearSimilarityRanges: state.clearSimilarityRanges,
			selectedPublishers: state.selectedPublishers,
			togglePublisher: state.togglePublisher,
			clearPublisherFilters: state.clearPublisherFilters,
			getAvailablePublishers: state.getAvailablePublishers,
			getNodeCountByPublisher: state.getNodeCountByPublisher,
		}))
	);

	// Local UI state
	const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');

	useEffect(() => {
		setIsClient(true);
	}, []);

	// The workspace's searches (the Searches filter shows once there are two or more)
	const rounds = useAppStore((s) => s.rounds.length);
	const selectedSearches = useAppStore((s) => s.selectedSearches);
	const publishedSet = useAppStore((s) => s.selectedPublished.length > 0);

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
		useAppStore.setState({ selectedSearches: [] });
		clearLocationFilters();
		clearTagFilters();
		clearSimilarityRanges();
		clearPublisherFilters();
		useAppStore.getState().setPublishedRange([]);
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
		selectedSimilarityRanges.length +
		selectedSearches.length +
		(publishedSet ? 1 : 0);

	return (
		<div className="space-y-3">
			{/* One header line: title, how many results are left, Clear All */}
			<div className="flex items-center gap-2">
				<h3 className="text-base font-semibold">Filters</h3>
				{filteredResults.length !== (searchResults?.length ?? 0) && (
					<span className="text-xs text-muted-foreground">
						showing {filteredResults.length} of {searchResults?.length ?? 0}
					</span>
				)}
				{totalFiltersActive > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearAllFilters}
						className="ml-auto h-7 gap-1 text-xs">
						<Filter className="h-3 w-3" />
						Clear All
					</Button>
				)}
			</div>

			{/* Similarity Score Card */}
			{rounds > 1 && (
				<FilterSection icon={Search} title="Searches" about="Which searches in the workspace found each document. Tick to show only theirs; “Found by 2+ searches” shows the overlap; ✕ removes a search.">
					<SearchesFilter />
				</FilterSection>
			)}
			<FilterSection icon={Target} title="Similarity Score" about="How closely each result matches your search. Tick a band to keep only those results.">
				<SimilarityHistogram />
			</FilterSection>

			<FilterSection icon={CalendarRange} title="Published" about="When each result was published. Drag the handles, tap a bar, or pick a range to keep only those dates.">
				<PublishedTimeline />
			</FilterSection>

			{/* Geographic Filters Card */}
			<FilterSection icon={Globe} title="Location" about={`Filter by continent or country (${availableContinents.length} continents, ${filteredResults.length} results)`}>
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
			</FilterSection>

			{/* Publisher Card */}
			{availablePublishers.length > 0 && (
				<FilterSection icon={Building2} title="Publisher" about="Who published the document. Narrows the results on screen.">
					<PublisherFilters
									availablePublishers={availablePublishers}
									selectedPublishers={selectedPublishers}
									togglePublisher={togglePublisher}
									getNodeCountByPublisher={getNodeCountByPublisher}
								/>
				</FilterSection>
			)}

			{/* Tags Card */}
			{availableTags.length > 0 && (
				<FilterSection icon={Tag} title="Tags" about="Filter by document tags or categories.">
					<TagFilters
									availableTags={availableTags}
									selectedTags={selectedTags}
									toggleTag={toggleTag}
									getNodeCountByTag={getNodeCountByTag}
								/>
				</FilterSection>
			)}
		</div>
	);
};

export default FilterPanel;

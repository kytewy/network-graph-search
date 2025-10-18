'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-state';
import { GeographicFilters } from './GeographicFilters';
import { SourceTypeFilters } from './SourceTypeFilters';
import { TagFilters } from './TagFilters';

/**
 * FilterPanel - Main coordinator for filtering options
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

	// Local UI state
	const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
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
	const toggleSourceType = (sourceType: string) => {
		setSelectedSourceTypes((prev) => {
			const safePrev = Array.isArray(prev) ? prev : [];
			return safePrev.includes(sourceType)
				? safePrev.filter((type) => type !== sourceType)
				: [...safePrev, sourceType];
		});
	};

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
		setSelectedSourceTypes([]);
	};

	// Derived data
	const availableContinents = getAvailableContinents();
	const availableTags = getAvailableTags();
	const sourceTypes = [
		...new Set(filteredResults.map((node) => node.type || '').filter(Boolean)),
	];

	return (
		<div className="rounded-lg p-4 space-y-4 bg-card">
			<Label className="text-sidebar-foreground font-medium text-base">
				Data Filters
			</Label>

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

			{/* TODO Update Upload for more fields
			<SourceTypeFilters
				sourceTypes={sourceTypes}
				selectedSourceTypes={selectedSourceTypes}
				toggleSourceType={toggleSourceType}
			/> */}

			<TagFilters
				availableTags={availableTags}
				selectedTags={selectedTags}
				toggleTag={toggleTag}
				getNodeCountByTag={getNodeCountByTag}
			/>

			<Button
				onClick={clearAllFilters}
				variant="outline"
				className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent">
				<Filter className="h-4 w-4 mr-2" />
				Clear All Filters
			</Button>
		</div>
	);
};

export default FilterPanel;

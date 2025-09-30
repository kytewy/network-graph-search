'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-state';
import { GeographicFilters } from './GeographicFilters';
import { SourceTypeFilters } from './SourceTypeFilters';

/**
 * FilterPanel - Main coordinator for filtering options
 * Manages state and delegates rendering to sub-components
 */
const FilterPanel = () => {
	// Get all required state and actions from app-state store
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

	// Local UI state
	const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
	const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');

	// Handlers
	const toggleSourceType = (sourceType: string) => {
		setSelectedSourceTypes((prev) =>
			prev.includes(sourceType)
				? prev.filter((type) => type !== sourceType)
				: [...prev, sourceType]
		);
	};

	const toggleExpandedContinent = (continent: string) => {
		setExpandedContinents((prev) =>
			prev.includes(continent)
				? prev.filter((c) => c !== continent)
				: [...prev, continent]
		);
	};

	const clearAllFilters = () => {
		clearLocationFilters();
		setSelectedSourceTypes([]);
	};

	// Derived data
	const availableContinents = getAvailableContinents();
	const sourceTypes = [
		...new Set(filteredResults.map((node) => node.type || '').filter(Boolean)),
	];

	return (
		<div className="rounded-lg p-4 space-y-4 bg-white">
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

			<SourceTypeFilters
				sourceTypes={sourceTypes}
				selectedSourceTypes={selectedSourceTypes}
				toggleSourceType={toggleSourceType}
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

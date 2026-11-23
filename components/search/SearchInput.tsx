'use client';

import { SearchError } from './SearchError';
import { useSearch } from '@/hooks/use-search';
import { useUrlSearch } from '@/hooks/use-url-search';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-state';
import { SEARCH_CONFIG, SearchConfigHelpers } from '@/lib/config/search-config';
import { Search, Loader2, X, Plus, Minus, Globe, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * SearchInput - Main search interface component
 *
 * Provides:
 * - Search query input field
 * - Search button with loading state
 * - Result count control (topK parameter)
 *
 * Uses app store for state management
 */
export function SearchInput() {
	const [isClient, setIsClient] = useState(false);

	// Get state and actions from app store - MUST be called before conditional returns
	const query = useAppStore((state) => state.query);
	const setQuery = useAppStore((state) => state.setQuery);
	const topK = useAppStore((state) => state.topK);
	const setTopK = useAppStore((state) => state.setTopK);
	// Remembered searches, retries and cancelling: see hooks/use-search.ts
	const { isLoading } = useSearch();
	// A search goes into the web address, which then runs it
	const { submit } = useUrlSearch();

	// Metadata filter state
	const selectedContinents = useAppStore((state) => state.selectedContinents);
	const selectedCountries = useAppStore((state) => state.selectedCountries);
	const toggleContinent = useAppStore((state) => state.toggleContinent);
	const clearLocationFilters = useAppStore((state) => state.clearLocationFilters);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<Card className="p-4">
				<div className="text-sm text-gray-500">Loading search...</div>
			</Card>
		);
	}

	// Handle search
	const handleSearch = () => {
		if (!query.trim()) return;
		submit(query, topK);
	};

	// Handle clear search
	// Clears only the text, so you can type a new query; the results and the
	// graph stay until the next search replaces them
	const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
		setQuery('');
		// Keep the cursor in the box, ready for the next query
		event.currentTarget.parentElement?.querySelector('input')?.focus();
	};

	// Metadata filter data - Always show these 6 continents for pre-search filtering
	const continents = [
		'North America',
		'Europe',
		'Asia',
		'Africa',
		'South America',
		'Oceania',
	];
	const geoCount = selectedContinents.length + selectedCountries.length;

	return (
		<div className="space-y-2">
			{/* Full-width search input */}
			<div className="relative">
				<Input
					placeholder={SearchConfigHelpers.getSearchPlaceholder()}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
					className="w-full h-11 text-base px-4 font-medium"
				/>
				{query.length > 0 && !isLoading && (
					<button
						type="button"
						aria-label="Clear search text"
						onClick={handleClear}
						className="absolute top-1/2 -translate-y-1/2 right-3 h-5 w-5 rounded-full bg-muted-foreground/80 hover:bg-muted-foreground text-white flex items-center justify-center transition-colors"
						title="Clear search text">
						<X className="h-3 w-3" />
					</button>
				)}
			</div>

			{/* One row under the box: Geography, then how many results, then search */}
			<div className="flex items-center gap-2">
				{/* Geography Filter */}
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant={geoCount > 0 ? 'default' : 'outline'}
							size="sm"
							className="h-7 gap-1 text-xs">
							<Globe className="h-3 w-3" />
							Geography
							{geoCount > 0 && (
								<Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
									{geoCount}
								</Badge>
							)}
							<ChevronDown className="h-3 w-3 ml-1" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64 p-3" align="start">
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-semibold text-sm">Geography</h4>
								{geoCount > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={clearLocationFilters}
										className="h-6 px-2 text-xs">
										Clear
									</Button>
								)}
							</div>
							<div className="space-y-1 max-h-64 overflow-y-auto">
								{continents.map((continent) => (
									<div 
										key={continent} 
										className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group"
										onClick={() => toggleContinent(continent)}
									>
										<Checkbox
											id={`continent-${continent}`}
											checked={selectedContinents.includes(continent)}
											onCheckedChange={() => toggleContinent(continent)}
											className="transition-transform group-hover:scale-110"
										/>
										<Label
											htmlFor={`continent-${continent}`}
											className="text-sm cursor-pointer flex-1 select-none">
											{continent}
										</Label>
									</div>
								))}
							</div>
						</div>
					</PopoverContent>
				</Popover>

				<div className="ml-auto flex items-center gap-2">
					<div
						className="flex items-center gap-1 border rounded-md p-0.5"
						title={SEARCH_CONFIG.RESULTS_TO_FETCH_LABEL}
						aria-label={SEARCH_CONFIG.RESULTS_TO_FETCH_LABEL}>
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								setTopK(SearchConfigHelpers.getNextTopK(topK, false))
							}
							disabled={topK <= SEARCH_CONFIG.MIN_TOP_K}
							className="h-6 w-6">
							<Minus className="h-3 w-3" />
						</Button>
						<span className="min-w-[2rem] text-center text-sm font-medium">
							{topK}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								setTopK(SearchConfigHelpers.getNextTopK(topK, true))
							}
							disabled={topK >= SEARCH_CONFIG.MAX_TOP_K}
							className="h-6 w-6">
							<Plus className="h-3 w-3" />
						</Button>
					</div>
					<Button
						onClick={handleSearch}
						disabled={isLoading}
						size="icon"
						aria-label="Search"
						className="h-8 w-8">
						{isLoading ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Search className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>

			{/* Why the last search failed, with Try again */}
			<SearchError />
		</div>
	);
}

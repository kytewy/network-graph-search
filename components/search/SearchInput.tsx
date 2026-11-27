'use client';

import { CONTROL, CONTROL_ICON } from '@/components/ui/control';
import { SearchError } from './SearchError';
import { SearchScope } from './SearchScope';
import { RecentSearches } from './RecentSearches';
import { useRecentSearches } from '@/lib/stores/recent-searches';
import { useSearch } from '@/hooks/use-search';
import { useUrlSearch } from '@/hooks/use-url-search';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-state';
import { SEARCH_CONFIG, SearchConfigHelpers } from '@/lib/config/search-config';
import { Search, Loader2, X, Plus, Minus } from 'lucide-react';

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
	// The list of searches shows under the box while it's focused, or whenever there are no results
	const [focused, setFocused] = useState(false);
	const hasResults = useAppStore((state) => state.searchResults.length > 0);
	// Adding needs a workspace to add to
	const canAdd = useAppStore((state) => state.rounds.length > 0);


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
		useRecentSearches.getState().remember(query, topK);
		setFocused(false);
		submit(query, topK);
	};

	// A search picked from the list: run it again, or add it to the workspace
	const pick = (q: string, k: number, mode: 'replace' | 'add') => {
		setQuery(q);
		setFocused(false);
		useRecentSearches.getState().remember(q, k);
		if (mode === 'add') useAppStore.getState().performSearch(q, k, 'add');
		else submit(q, k);
	};

	// Collects this search into the workspace instead of replacing it. It
	// doesn't change the web address, which holds the search the workspace started from.
	const handleAdd = () => {
		if (!query.trim() || !canAdd) return;
		useRecentSearches.getState().remember(query, topK);
		setFocused(false);
		useAppStore.getState().performSearch(query, topK, 'add');
	};

	// Handle clear search
	// Clears only the text, so you can type a new query; the results and the
	// graph stay until the next search replaces them
	const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
		setQuery('');
		// Keep the cursor in the box, ready for the next query
		event.currentTarget.parentElement?.querySelector('input')?.focus({ preventScroll: true });
	};


	return (
		<div className="relative space-y-2">
			{/* Full-width search input */}
			<div className="relative">
				<Input
					placeholder={SearchConfigHelpers.getSearchPlaceholder()}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						// Enter searches; Shift+Enter adds to the workspace
						if (e.key === 'Enter') (e.shiftKey && canAdd ? handleAdd() : handleSearch());
					}}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					className={`${CONTROL} w-full px-3 pr-9 shadow-none md:text-[13px]`}
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

			{/* One row under the box: what to search within, then how many results, then search */}
			<div className="flex flex-wrap items-center gap-2">
				<SearchScope />

				<div className="ml-auto flex items-center gap-2">
					<div
						className={`${CONTROL} flex items-center gap-0.5 px-1`}
						title={SEARCH_CONFIG.RESULTS_TO_FETCH_LABEL}
						aria-label={SEARCH_CONFIG.RESULTS_TO_FETCH_LABEL}>
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								setTopK(SearchConfigHelpers.getNextTopK(topK, false))
							}
							disabled={topK <= SEARCH_CONFIG.MIN_TOP_K}
							className="h-7 w-7">
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
							className="h-7 w-7">
							<Plus className="h-3 w-3" />
						</Button>
					</div>
					<Button
						onClick={handleAdd}
						disabled={isLoading || !canAdd || !query.trim()}
						size="icon"
						variant="outline"
						aria-label="Add to workspace"
						title="Add to workspace (Shift+Enter): keeps what's there and adds these results"
						className={CONTROL_ICON}>
						<Plus className="h-4 w-4" />
					</Button>
					<Button
						onClick={handleSearch}
						disabled={isLoading}
						size="icon"
						title="Search (Enter): starts over with these results"
						aria-label="Search"
						className={CONTROL_ICON}>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Search className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Why the last search failed, with Try again */}
			<SearchError />
			{/* Your searches: this workspace's first (with results), then older ones */}
			{(focused || !hasResults) && (
				// Over the results while you type; in place when there are none
				<div className={hasResults ? 'absolute left-0 right-0 top-12 z-30 shadow-lg' : ''}>
					<RecentSearches onPick={pick} />
				</div>
			)}
		</div>
	);
}

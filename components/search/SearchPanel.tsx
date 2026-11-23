'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import FilterPanel from '@/components/filters/FilterPanel';
import { useAppStore } from '@/lib/stores/app-state';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SearchPanel - Unified left sidebar for search and filtering
 *
 * Reorganizes the left sidebar into a clean tabbed interface:
 * - Search input always visible at top
 * - Results tab: SearchResults (view what you found)
 * - Filters tab: All filtering options (Similarity, Geographic, Tags)
 *
 * Benefits:
 * - Better space utilization
 * - Clear hierarchy (search → results OR filters)
 * - Prevents results from pushing filters off-screen
 * - All filters grouped together logically
 * - Room for future expansion (Advanced tab, etc.)
 */
export function SearchPanel() {
	const [isClient, setIsClient] = useState(false);
	const [activeTab, setActiveTab] = useState<'results' | 'filters'>('results');

	// Get counts for badges
	const searchResults = useAppStore((state) => state.searchResults);
	const filteredResults = useAppStore((state) => state.filteredResults);
	const hasSearched = useAppStore((state) => state.hasSearched);
	// » opens the panel wide over the graph (like the Analysis Workspace's «)
	const expanded = useAppStore((state) => state.searchPanelExpanded);
	const setExpanded = useAppStore((state) => state.setSearchPanelExpanded);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Auto-switch to results tab when search is performed
	useEffect(() => {
		if (hasSearched && searchResults && searchResults.length > 0) {
			setActiveTab('results');
		}
	}, [hasSearched, searchResults]);

	if (!isClient) {
		return (
			<div className="w-96 bg-sidebar border-r border-sidebar-border p-6">
				<div className="text-sm text-muted-foreground">Loading...</div>
			</div>
		);
	}

	const searchCount = Array.isArray(searchResults) ? searchResults.length : 0;
	const filteredCount = Array.isArray(filteredResults)
		? filteredResults.length
		: 0;

	// » / « toggles between the tabbed sidebar and the wide view
	const expandButton = (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => setExpanded(!expanded)}
			aria-label={expanded ? 'Collapse search panel' : 'Expand search panel'}
			title={expanded ? 'Collapse' : 'Expand'}
			className="h-6 px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground">
			{expanded ? '«' : '»'}
		</Button>
	);

	// Wide: no tabs. Search box on top, filters column beside the results grid,
	// so ticking a filter changes the results right next to it.
	if (expanded) {
		return (
			<div
				data-testid="search-panel"
				className="absolute left-0 top-0 right-96 z-20 shadow-xl bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-all duration-300">
				<div className="px-6 py-4 shrink-0 border-b border-sidebar-border flex items-start gap-2">
					<div className="flex-1">
						<SearchInput />
					</div>
					{expandButton}
				</div>
				{searchCount > 0 ? (
					<div className="flex flex-1 min-h-0">
						<aside
							aria-label="Filters"
							className="w-72 shrink-0 overflow-y-auto border-r border-sidebar-border p-4 space-y-2">
							{/* FilterPanel has its own title; just say when filters narrow things */}
							{filteredCount !== searchCount && (
								<p className="text-xs text-muted-foreground">
									showing {filteredCount} of {searchCount}
								</p>
							)}
							<FilterPanel />
						</aside>
						<div className="flex-1 min-w-0 overflow-y-auto p-4">
							<SearchResults />
						</div>
					</div>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center">
						<Search className="h-12 w-12 text-muted-foreground mb-3" />
						<p className="text-sm text-muted-foreground">
							Enter a search query above to see results
						</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			data-testid="search-panel"
			className={`${
				expanded ? 'absolute left-0 top-0 right-96 z-20 shadow-xl' : 'w-96'
			} bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-all duration-300`}>

			{/* Tabbed Content Area */}
			<div className="flex-1 overflow-hidden">
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as any)}
					className="flex h-full flex-col">
					{/* Tab Headers */}
					{/* Divider under the tabs, with the same 16px gap as the line above them */}
					<div className="px-6 py-4 bg-sidebar shrink-0 border-b border-sidebar-border flex items-center gap-2">
						<TabsList className="grid flex-1 grid-cols-2 bg-transparent p-0 h-auto gap-0">
							<TabsTrigger
								value="results"
								className="flex items-center gap-2 rounded-t-md border-b-2 border-transparent pb-3 pt-2 px-4 font-normal text-muted-foreground transition-all duration-200 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground hover:bg-accent/50">
								<Search className="h-3 w-3" />
								<span>Search</span>
								{searchCount > 0 && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{searchCount}
									</Badge>
								)}
							</TabsTrigger>

							<TabsTrigger
								value="filters"
								className="flex items-center gap-2 rounded-t-md border-b-2 border-transparent pb-3 pt-2 px-4 font-normal text-muted-foreground transition-all duration-200 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground hover:bg-accent/50">
								<Filter className="h-3 w-3" />
								<span>Filters</span>
								{filteredCount !== searchCount && searchCount > 0 && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{filteredCount}
									</Badge>
								)}
							</TabsTrigger>
						</TabsList>
						{expandButton}
					</div>

					{/* Results Tab */}
					<TabsContent
						value="results"
						className="flex-1 overflow-y-auto data-[state=inactive]:hidden">
						{/* The search box sits in the Search tab; 16px gaps throughout */}
						<div className="p-6 pt-4 space-y-4">
							<SearchInput />
							{searchCount > 0 ? (
								<SearchResults />
							) : (
								<div className="flex flex-col items-center justify-center h-full">
									<Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
									<p className="text-sm text-muted-foreground">
										Enter a search query above to see results
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Try searching for "AI", "regulation", or "privacy"
									</p>
								</div>
							)}
						</div>
					</TabsContent>

					{/* Filters Tab */}
					<TabsContent
						value="filters"
						className="flex-1 overflow-y-auto data-[state=inactive]:hidden">
						<div className="p-6 pt-4">
							{searchCount > 0 ? (
								<FilterPanel />
							) : (
								<div className="flex flex-col items-center justify-center h-full">
									<Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
									<p className="text-sm text-muted-foreground">
										Filters will be available after searching
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Use filters to refine your search results
									</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

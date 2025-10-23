'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import FilterPanel from '@/components/filters/FilterPanel';
import { useAppStore } from '@/lib/stores/app-state';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';

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

	return (
		<div className="w-96 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
			{/* Header - Always visible */}
			<div className="p-6 pb-4 border-b border-sidebar-border shrink-0">
				<h1 className="text-2xl font-bold text-sidebar-foreground mb-4"></h1>
				{/* Search Input - Always visible */}
				<SearchInput />
			</div>

			{/* Tabbed Content Area */}
			<div className="flex-1 overflow-hidden">
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as any)}
					className="flex h-full flex-col">
					{/* Tab Headers */}
					<div className="px-6 pt-4 pb-0 bg-sidebar shrink-0">
						<TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-0">
							<TabsTrigger
								value="results"
								className="flex items-center gap-2 rounded-t-md border-b-2 border-transparent pb-3 pt-2 px-4 font-normal text-muted-foreground transition-all duration-200 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground hover:bg-transparent">
								<Search className="h-3 w-3" />
								<span>Results</span>
								{searchCount > 0 && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{searchCount}
									</Badge>
								)}
							</TabsTrigger>

							<TabsTrigger
								value="filters"
								className="flex items-center gap-2 rounded-t-md border-b-2 border-transparent pb-3 pt-2 px-4 font-normal text-muted-foreground transition-all duration-200 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground hover:bg-transparent">
								<Filter className="h-3 w-3" />
								<span>Filters</span>
								{filteredCount !== searchCount && searchCount > 0 && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{filteredCount}
									</Badge>
								)}
							</TabsTrigger>
						</TabsList>
					</div>

					{/* Results Tab */}
					<TabsContent
						value="results"
						className="flex-1 overflow-y-auto data-[state=inactive]:hidden">
						<div className="p-6 pt-4">
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
								<div className="flex flex-col items-center justify-center h-full py-12">
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

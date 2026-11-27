'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SearchInput } from './SearchInput';
import { AddLinkButton } from '@/components/sources/AddLinkButton';
import { WorkspaceBar } from './WorkspaceBar';
import { SearchResults } from './SearchResults';
import FilterPanel from '@/components/filters/FilterPanel';
import { useAppStore } from '@/lib/stores/app-state';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { PANEL_HEADER, PANEL_TAB, PanelMaximizeButton, PanelRail, widenOnDoubleClick } from '@/components/layout/PanelChrome';

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
	// Double-clicking the header opens the panel wide over the graph (like the chat panel)
	const expanded = useAppStore((state) => state.searchPanelExpanded);
	const setExpanded = useAppStore((state) => state.setSearchPanelExpanded);
	const collapsed = useAppStore((state) => state.searchPanelCollapsed);
	const setCollapsed = useAppStore((state) => state.setSearchPanelCollapsed);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Auto-switch to results tab when search is performed
	useEffect(() => {
		if (hasSearched && searchResults && searchResults.length > 0) {
			setActiveTab('results');
		}
	}, [hasSearched, searchResults]);

	if (isClient && collapsed) {
		return <PanelRail side="left" name="search" onOpen={() => setCollapsed(false)} />;
	}

	if (!isClient) {
		return (
			<div className="w-96 bg-card border-r border-sidebar-border p-6">
				<div className="text-sm text-muted-foreground">Loading...</div>
			</div>
		);
	}

	const searchCount = Array.isArray(searchResults) ? searchResults.length : 0;
	const filteredCount = Array.isArray(filteredResults)
		? filteredResults.length
		: 0;

	// Double-clicking the header toggles between the tabbed sidebar and the wide view
	const widen = widenOnDoubleClick(expanded, () => setExpanded(!expanded));
	// One button per panel: maximize over the graph, or restore
	const closeButton = <PanelMaximizeButton name="search" wide={expanded} onClick={() => setExpanded(!expanded)} />;

	// Wide: no tabs. Search box on top with every filter as a dropdown in its row, results below at full width
	if (expanded) {
		return (
			<div
				data-testid="search-panel"
				className="h-screen w-full bg-card border-r border-sidebar-border flex flex-col">
				<div data-panel-header="left" className={PANEL_HEADER} {...widen}>
					<span className="flex items-center gap-2 text-sm font-semibold text-primary">
						<Search className="h-3 w-3" />
						Search &amp; filters
					</span>
					<span className="ml-auto">{closeButton}</span>
				</div>
				<div className="px-4 py-3 shrink-0 border-b border-sidebar-border space-y-2">
					<WorkspaceBar />
					<SearchInput />
					<AddLinkButton variant="link" />
				</div>
				{searchCount > 0 ? (
					<div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4">
						<SearchResults />
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
			className="w-full bg-card border-r border-sidebar-border flex flex-col h-screen">

			{/* Tabbed Content Area */}
			<div className="flex-1 overflow-hidden">
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as any)}
					className="flex h-full flex-col">
					{/* Tab Headers */}
					{/* Divider under the tabs, with the same 16px gap as the line above them */}
					<div data-panel-header="left" className={`${PANEL_HEADER} bg-card`} {...widen}>
						<TabsList className="grid flex-1 grid-cols-2 bg-transparent p-0 h-auto gap-0">
							<TabsTrigger
								value="results"
								className={PANEL_TAB}>
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
								className={PANEL_TAB}>
								<Filter className="h-3 w-3" />
								<span>Filters</span>
								{filteredCount !== searchCount && searchCount > 0 && (
									<Badge variant="secondary" className="ml-1 text-xs">
										{filteredCount}
									</Badge>
								)}
							</TabsTrigger>
						</TabsList>
						{closeButton}
					</div>

					{/* Results Tab */}
					<TabsContent
						value="results"
						className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
						{/* The search box stays put; only the results list scrolls. 16px gaps throughout */}
						<div className="shrink-0 space-y-3 p-4 pb-3">
							<WorkspaceBar />
							<SearchInput />
							<AddLinkButton variant="link" />
						</div>
						<div className="min-h-0 flex-1 px-4 pb-4">
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
						<div className="p-4">
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

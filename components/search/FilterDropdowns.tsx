'use client';

import type { ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Building2, CalendarRange, ChevronDown, Search, Target, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppStore } from '@/lib/stores/app-state';
import { SimilarityHistogram } from '@/components/filters/SimilarityHistogram';
import { PublisherFilters } from '@/components/filters/PublisherFilters';
import { PublishedTimeline } from '@/components/filters/PublishedTimeline';
import { SearchesFilter } from '@/components/filters/SearchesFilter';

/** One filter as a button that opens it below; filled when something in it is picked */
function FilterDropdown({ icon: Icon, label, count, onClear, width = 'w-72', children }: {
	icon: LucideIcon;
	label: string;
	count: number;
	onClear: () => void;
	width?: string;
	children: ReactNode;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant={count > 0 ? 'default' : 'outline'} size="sm" className="h-9 gap-1 rounded-lg text-xs">
					<Icon className="h-3 w-3" />
					{label}
					{count > 0 && (
						<Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
							{count}
						</Badge>
					)}
					<ChevronDown className="ml-1 h-3 w-3" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={`${width} space-y-3 p-3`} align="start">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold">{label}</h4>
					{count > 0 && (
						<Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-xs">
							Clear
						</Button>
					)}
				</div>
				{children}
			</PopoverContent>
		</Popover>
	);
}

/** The panel's filters as dropdowns beside Geography, for the wide search panel (no filters column there) */
export function FilterDropdowns() {
	const s = useAppStore(
		useShallow((state) => ({
			results: state.searchResults?.length ?? 0,
			rounds: state.rounds.length,
			searches: state.selectedSearches,
			similarity: state.selectedSimilarityRanges,
			clearSimilarity: state.clearSimilarityRanges,
			publishers: state.selectedPublishers,
			togglePublisher: state.togglePublisher,
			clearPublishers: state.clearPublisherFilters,
			availablePublishers: state.getAvailablePublishers,
			countPublisher: state.getNodeCountByPublisher,
			published: state.selectedPublished,
			setPublished: state.setPublishedRange,
			filtered: state.filteredResults,
		}))
	);
	if (s.results === 0) return null;
	const publishers = s.availablePublishers();

	return (
		<>
			{s.rounds > 1 && (
				<FilterDropdown icon={Search} label="Searches" count={s.searches.length} onClear={() => useAppStore.setState({ selectedSearches: [] })}>
					<SearchesFilter />
				</FilterDropdown>
			)}
			<FilterDropdown icon={Target} label="Similarity" count={s.similarity.length} onClear={s.clearSimilarity}>
				<SimilarityHistogram />
			</FilterDropdown>
			{publishers.length > 0 && (
				<FilterDropdown icon={Building2} label="Publisher" count={s.publishers.length} onClear={s.clearPublishers}>
					<PublisherFilters
						availablePublishers={publishers}
						selectedPublishers={s.publishers}
						togglePublisher={s.togglePublisher}
						getNodeCountByPublisher={s.countPublisher}
					/>
				</FilterDropdown>
			)}
			<FilterDropdown icon={CalendarRange} label="Published" count={s.published.length ? 1 : 0} onClear={() => s.setPublished([])} width="w-96">
				<PublishedTimeline />
			</FilterDropdown>
		</>
	);
}

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-state';
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
	// Get state and actions from app store
	const query = useAppStore((state) => state.query);
	const setQuery = useAppStore((state) => state.setQuery);
	const isLoading = useAppStore((state) => state.isLoading);
	const topK = useAppStore((state) => state.topK);
	const setTopK = useAppStore((state) => state.setTopK);
	const performSearch = useAppStore((state) => state.performSearch);
	const searchResults = useAppStore((state) => state.searchResults);
	const setSearchResults = useAppStore((state) => state.setSearchResults);

	// Handle search
	const handleSearch = () => {
		if (!query.trim()) return;
		performSearch(query, topK);
	};

	// Handle clear search
	const handleClear = () => {
		setQuery('');
		setSearchResults([]);
	};

	return (
		<Card className="p-4">
			<h2 className="text-xl font-semibold mb-4">Search</h2>
			{/* Full-width search input */}
			<div className="relative">
				<Input
					placeholder="Search across 300+ documents..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
					className="w-full h-12 text-base px-4 font-medium"
				/>
				{searchResults.length > 0 && !isLoading && (
					<button
						onClick={handleClear}
						className="absolute top-1/2 -translate-y-1/2 right-3 h-5 w-5 rounded-full bg-muted-foreground/80 hover:bg-muted-foreground text-white flex items-center justify-center transition-colors"
						title="Clear search">
						<X className="h-3 w-3" />
					</button>
				)}
			</div>

			{/* Results to fetch + Search button */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<span className="text-sm text-muted-foreground">Results to fetch</span>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 border rounded-md p-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setTopK(Math.max(20, topK - 5))}
							disabled={topK <= 20}
							className="h-7 w-7">
							<Minus className="h-3 w-3" />
						</Button>
						<span className="min-w-[2rem] text-center text-sm font-medium">
							{topK}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setTopK(topK + 5)}
							className="h-7 w-7">
							<Plus className="h-3 w-3" />
						</Button>
					</div>
					<Button
						onClick={handleSearch}
						disabled={isLoading}
						size="icon"
						className="h-9 w-9">
						{isLoading ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Search className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>
		</Card>
	);
}

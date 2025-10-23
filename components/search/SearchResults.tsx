'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/stores/app-state';
import { SearchDataNormalizer } from '@/lib/utils/search-data-normalizer';
import { ExternalLink, ArrowUpDown } from 'lucide-react';

/**
 * Get score color based on similarity ranges (aligned with node-colors.ts)
 */
const getScoreColor = (score: number): string => {
	const percent = Math.round(score * 100);
	if (percent >= 81) return '#22c55e'; // greenBright
	if (percent >= 61) return '#84cc16'; // greenLight
	if (percent >= 41) return '#eab308'; // yellow
	if (percent >= 20) return '#f97316'; // orange
	return '#ef4444'; // redBright
};

/**
 * SearchResults component
 *
 * Features:
 * - Clean, minimal design
 * - Score-based sorting with toggle
 * - Color-coded scores (aligned with similarity ranges)
 * - Scrollable results with fixed header
 */
export function SearchResults() {
	const [isClient, setIsClient] = useState(false);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

	// Get state from app store
	const searchResults = useAppStore((state) => state.searchResults);
	const filteredResults = useAppStore((state) => state.filteredResults);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Toggle sort direction
	const toggleSort = () => {
		setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
	};

	// Normalize and sort results by score
	const processedResults = useMemo(() => {
		const safeFilteredResults = Array.isArray(filteredResults)
			? filteredResults
			: [];
		const normalized = SearchDataNormalizer.normalizeArray(safeFilteredResults);

		// Sort by score based on direction
		return [...normalized].sort((a, b) => {
			return sortDirection === 'desc' ? b.score - a.score : a.score - b.score;
		});
	}, [filteredResults, sortDirection]);

	if (!isClient) {
		return (
			<Card>
				<CardContent className="p-4">
					<div className="text-sm text-muted-foreground">
						Loading results...
					</div>
				</CardContent>
			</Card>
		);
	}

	const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];

	if (safeSearchResults.length === 0) {
		return null;
	}

	return (
		<Card className="flex flex-col h-full min-h-0">
			<CardHeader className="pb-3 shrink-0">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">
						Results ({processedResults.length})
					</h3>
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleSort}
						className="h-8 gap-1"
						title={
							sortDirection === 'desc'
								? 'Sorted: High to Low'
								: 'Sorted: Low to High'
						}>
						<ArrowUpDown className="h-3 w-3" />
						<span className="text-xs">
							{sortDirection === 'desc' ? 'High → Low' : 'Low → High'}
						</span>
					</Button>
				</div>
			</CardHeader>

			<CardContent className="flex-1 overflow-y-auto space-y-2 p-4 pt-0">
				{processedResults.map((result, index) => {
					const scorePercent = Math.round(result.score * 100);
					const scoreColor = getScoreColor(result.score);
					const previewContent = SearchDataNormalizer.extractPreview(
						result.content,
						120
					);

					return (
						<div
							key={result.id}
							className="border rounded-lg p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
							{/* Result Header */}
							<div className="flex items-start justify-between gap-3">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										{/* Score Badge with Color */}
										<Badge
											className="text-xs font-semibold px-2 py-0.5 shrink-0"
											style={{
												backgroundColor: scoreColor,
												color: '#ffffff',
												border: 'none',
											}}>
											{scorePercent}
										</Badge>
										<h4 className="font-semibold text-sm leading-tight truncate">
											{result.label}
										</h4>
									</div>
								</div>

								{/* External Link Button */}
								{result.url && (
									<Button
										size="sm"
										variant="ghost"
										onClick={() => window.open(result.url, '_blank')}
										className="h-7 w-7 p-0 shrink-0"
										title="Open Link">
										<ExternalLink className="h-3 w-3" />
									</Button>
								)}
							</div>

							{/* Content Preview */}
							<div className="mt-2">
								<p className="text-xs text-muted-foreground leading-relaxed">
									{previewContent}
								</p>
							</div>

							{/* Tags */}
							{result.tags && result.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-2">
									{result.tags.slice(0, 3).map((tag, tagIndex) => (
										<Badge key={tagIndex} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
									{result.tags.length > 3 && (
										<Badge variant="outline" className="text-xs">
											+{result.tags.length - 3}
										</Badge>
									)}
								</div>
							)}
						</div>
					);
				})}

				{processedResults.length === 0 && (
					<div className="text-center py-8 text-muted-foreground">
						<p>No results match the current filters.</p>
						<p className="text-xs mt-1">
							Try adjusting your search or filter criteria.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/stores/app-state';
import { contentPreview } from '@/lib/utils/text-preview';
import { ArrowUpDown, LayoutGrid, Rows3 } from 'lucide-react';
import { ResultsTable } from './ResultsTable';
import { foundByLabel, useFoundBy } from '@/hooks/use-found-by';
import DocumentOverlay, { nodeToReadingItem } from '@/components/network/DocumentOverlay';
import { useContextStore } from '@/lib/stores/context-store';
import type { Node } from '@/lib/config/types';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';

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
	const [showDocumentOverlay, setShowDocumentOverlay] = useState(false);
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);

	// Get state from app store
	const searchResults = useAppStore((state) => state.searchResults);
	const filteredResults = useAppStore((state) => state.filteredResults);
	const wide = useAppStore((state) => state.searchPanelExpanded);
	const found = useFoundBy();
	const view = useAppStore((state) => state.resultsView);
	const setView = useAppStore((state) => state.setResultsView);
	
	// Get context store methods
	const contextNodes = useContextStore((state) => state.contextNodes);
	const addNodesToContext = useContextStore((state) => state.addNodesToContext);
	const removeNodeFromContext = useContextStore((state) => state.removeNodeFromContext);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Toggle sort direction
	const toggleSort = () => {
		setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
	};

	const highlight = useHighlightOnHover();

	// Open document in reading mode
	const openReadingMode = (node: Node) => {
		setSelectedNode(node);
		setShowDocumentOverlay(true);
	};

	// Check if node is in context
	const isNodeInContext = (nodeId: string) => {
		return contextNodes.some((n) => n.id === nodeId);
	};

	// Handle toggling context
	const handleToggleContext = (nodeId: string) => {
		if (isNodeInContext(nodeId)) {
			removeNodeFromContext(nodeId);
			return;
		}
		const node = filteredResults.find((n) => n.id === nodeId);
		if (node) addNodesToContext([node]);
	};

	// Sort results by score (they arrive ready to show from the search route)
	const processedResults = useMemo(() => {
		const safeFilteredResults = Array.isArray(filteredResults)
			? filteredResults
			: [];

		return [...safeFilteredResults].sort((a, b) => {
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
		<>
		<div className="flex flex-col gap-2">
			{/* One row: count and sort (no card around the list) */}
			<div className="flex items-center justify-between">
					<h3 className="text-base font-semibold">
						{/* After two or more searches the list is the whole workspace */}
						{found.collected ? `Workspace (${processedResults.length}) · ${found.rounds} searches` : `Results (${processedResults.length})`}
					</h3>
					<div className="flex items-center gap-1">
					{view === 'cards' && (
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
					)}
					{/* Cards or table; the choice is remembered */}
					<div className="flex rounded-md border p-0.5" role="group" aria-label="Results view">
						{([['cards', LayoutGrid, 'Show as cards'], ['table', Rows3, 'Show as table']] as const).map(([value, Icon, label]) => (
							<button
								key={value}
								type="button"
								aria-label={label}
								aria-pressed={view === value}
								title={label}
								onClick={() => setView(value)}
								className={`h-6 w-6 rounded flex items-center justify-center ${view === value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
								<Icon className="h-3.5 w-3.5" />
							</button>
						))}
					</div>
					</div>
			</div>

			{view === 'table' ? (
				<ResultsTable
					results={processedResults as Node[]}
					wide={wide}
					scoreColor={getScoreColor}
					onToggleContext={handleToggleContext}
					onOpen={openReadingMode}
				/>
			) : (
			/* One column, or 2–3 when the search panel is open wide */
			<div
				className={`${
					wide ? 'grid gap-3 md:grid-cols-2 2xl:grid-cols-3 items-start' : 'space-y-2'
				}`}>
				{processedResults.map((result, index) => {
					const scorePercent = Math.round(result.score * 100);
					const scoreColor = getScoreColor(result.score);
					const previewContent = contentPreview(result.content, 120);

					return (
						<div
							key={result.id}
							data-result-card
							{...highlight(result.id)}
							// Clicking the card opens the document
							onClick={() => openReadingMode(result as Node)}
							className="cursor-pointer border rounded-lg p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
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
										{found.collected && (
											<span className="text-xs text-muted-foreground whitespace-nowrap" title="Searches that found it" data-found-by>
												{foundByLabel(found.byDoc[result.id])}
											</span>
										)}
										<h4 className="font-semibold text-sm leading-tight truncate">
											<button type="button" onClick={(e) => (e.stopPropagation(), openReadingMode(result as Node))} className="text-left hover:underline">
												{result.label}
											</button>
										</h4>
									</div>
								</div>

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
			</div>
			)}
		</div>
		{/* Document Overlay */}
		{showDocumentOverlay && selectedNode && (
			<DocumentOverlay
				document={nodeToReadingItem(selectedNode)}
				onClose={() => setShowDocumentOverlay(false)}
				isInContext={isNodeInContext(selectedNode.id)}
				onToggleContext={() => handleToggleContext(selectedNode.id)}
			/>
		)}
		</>
	);
}

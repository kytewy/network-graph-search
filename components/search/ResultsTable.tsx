'use client';

import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Node } from '@/lib/config/types';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';
import { clusterDisplayName, namesFromSuggestions } from '@/lib/clustering/cluster-display';
import { contentPreview } from '@/lib/utils/text-preview';
import { foundByLabel, useFoundBy } from '@/hooks/use-found-by';
import { nextSort, sortRows, type ResultRow, type TableSortKey } from '@/lib/search/results-table';

interface ResultsTableProps {
	results: Node[];
	/** Wide shows every column; narrow shows score, title and context */
	wide: boolean;
	scoreColor: (score: number) => string;
	onToggleContext: (id: string) => void;
	onOpen: (node: Node) => void;
}

const summaryOf = (node: Node) => node.summary || contentPreview(node.content, 100);

/**
 * The search results as a table: one row per document, sortable by any column.
 * The ● in the last column adds the document to the context or takes it out.
 */
export function ResultsTable({ results, wide, scoreColor, onToggleContext, onOpen }: ResultsTableProps) {
	const [sort, setSort] = useState<{ key: TableSortKey; direction: 'asc' | 'desc' }>({ key: 'score', direction: 'desc' });
	const highlight = useHighlightOnHover();
	// After two or more searches: which searches found each document
	const found = useFoundBy();

	// Each document's cluster, named the same way as on the graph
	const aiClusters = useAppStore((s) => s.aiClusters);
	const clusterResults = useContextStore((s) => s.clusterResults);
	const clusterSuggestions = useContextStore((s) => s.clusterSuggestions);
	const contextNodes = useContextStore((s) => s.contextNodes);

	const rows = useMemo(() => {
		const names = namesFromSuggestions(clusterResults?.clusters ?? [], clusterSuggestions);
		const all: ResultRow[] = results.map((node) => ({
			node,
			cluster: aiClusters[node.id] ? clusterDisplayName(aiClusters[node.id], names) : null,
			inContext: contextNodes.some((n) => n.id === node.id),
		}));
		return sortRows(all, sort.key, sort.direction);
	}, [results, aiClusters, clusterResults, clusterSuggestions, contextNodes, sort]);

	const header = (key: TableSortKey, label: string, className = '') => (
		<th
			className={`px-2 py-1.5 font-medium whitespace-nowrap ${className}`}
			aria-sort={sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
			<button type="button" onClick={() => setSort(nextSort(sort, key))} className="hover:text-foreground">
				{label}
				{sort.key === key && (sort.direction === 'asc' ? ' ↑' : ' ↓')}
			</button>
		</th>
	);

	return (
		<table className="w-full text-sm" data-testid="results-table">
			<thead className="text-xs text-muted-foreground text-left border-b">
				<tr>
					{header('score', 'Score', 'w-14')}
					{header('title', wide ? 'Title · summary' : 'Title')}
					{wide && <th className="px-2 py-1.5 font-medium w-40">Tags</th>}
					{wide && found.collected && <th className="px-2 py-1.5 font-medium w-24 whitespace-nowrap">Found by</th>}
					{wide && header('cluster', 'Cluster', 'w-36')}
					{header('context', 'Ctx', 'w-10 text-center')}
				</tr>
			</thead>
			<tbody>
				{rows.map(({ node, cluster, inContext }) => (
					<tr
						key={node.id}
						data-result-row
						{...highlight(node.id)}
						// Narrow has no room for the extra columns, so they show on hover
						title={wide ? undefined : [summaryOf(node), node.tags?.join(', '), cluster].filter(Boolean).join('\n')}
						className="border-b last:border-0 hover:bg-accent/50 align-top">
						<td className="px-2 py-2">
							<Badge className="text-xs font-semibold px-2 py-0.5 text-white border-none" style={{ backgroundColor: scoreColor(node.score) }}>
								{Math.round(node.score * 100)}
							</Badge>
						</td>
						<td className="px-2 py-2 min-w-0">
							<div className="flex items-start gap-1">
								<span className="font-medium leading-tight line-clamp-1 flex-1">{node.label}</span>
								{/* Narrow: a ★ when more than one search found it */}
								{!wide && (found.byDoc[node.id]?.length ?? 0) > 1 && (
									<span className="shrink-0 text-amber-500" title={`Found by ${foundByLabel(found.byDoc[node.id])}`} aria-label="Found by more than one search">★</span>
								)}
								<Button size="sm" variant="ghost" onClick={() => onOpen(node)} className="h-5 w-5 p-0 shrink-0" title="Open in Reading Mode">
									<BookOpen className="h-3 w-3" />
								</Button>
							</div>
							{wide && <p className="text-xs text-muted-foreground line-clamp-1">{summaryOf(node)}</p>}
						</td>
						{wide && (
							<td className="px-2 py-2">
								<div className="flex flex-wrap gap-1">
									{(node.tags ?? []).slice(0, 2).map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
									))}
									{(node.tags?.length ?? 0) > 2 && <Badge variant="outline" className="text-xs">+{node.tags!.length - 2}</Badge>}
								</div>
							</td>
						)}
						{wide && found.collected && (
							<td className="px-2 py-2 text-xs whitespace-nowrap" data-found-by>
								{foundByLabel(found.byDoc[node.id])}
							</td>
						)}
						{wide && <td className="px-2 py-2 text-xs">{cluster ?? <span className="text-muted-foreground">—</span>}</td>}
						<td className="px-2 py-2 text-center">
							<button
								type="button"
								role="switch"
								aria-checked={inContext}
								aria-label={`${inContext ? 'Remove' : 'Add'} ${node.label} ${inContext ? 'from' : 'to'} context`}
								onClick={() => onToggleContext(node.id)}
								className={`inline-block h-3 w-3 rounded-full border-2 ${inContext ? 'bg-gray-900 border-gray-900' : 'border-gray-400 hover:border-gray-900'}`}
							/>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

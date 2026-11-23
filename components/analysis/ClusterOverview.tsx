'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { analyzeNodes } from '@/lib/api/analysis-client';
import { queryClient } from '@/lib/api/query-client';
import { CLUSTER_OVERVIEW_PROMPT } from '@/lib/prompts/analysis-prompts';
import type { ClusterResult } from '@/lib/stores/context-store';

interface Suggestion {
	clusterName: string;
	description: string;
}

interface ClusterOverviewProps {
	clusters: ClusterResult[];
	/** AI names and descriptions, by cluster position */
	suggestions: Map<number, Suggestion>;
	namesLoading: boolean;
	/** Scrolls to a cluster's card */
	onJump: (clusterId: string) => void;
}

const fallbackName = (c: ClusterResult, i: number) => c.label ?? `Cluster ${i + 1}`;

const Spinner = ({ label }: { label: string }) => (
	<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-label={label} />
);

/**
 * The top of the Clusters tab, like a contents page: how many clusters, a
 * 2-3 sentence AI overview, then one line per cluster that jumps to its card.
 */
export function ClusterOverview({ clusters, suggestions, namesLoading, onJump }: ClusterOverviewProps) {
	const documents = clusters.reduce((sum, c) => sum + c.size, 0);
	const named = !namesLoading && suggestions.size > 0;

	// Written from the names and descriptions, so it waits for them. Remembered
	// for the same clusters, so switching tabs doesn't ask again.
	const overview = useQuery(
		{
			queryKey: ['cluster-overview', clusters.map((c, i) => `${c.cluster_id}:${c.size}:${suggestions.get(i)?.clusterName ?? ''}`)],
			queryFn: ({ signal }) =>
				analyzeNodes({
					signal,
					customPrompt: CLUSTER_OVERVIEW_PROMPT,
					nodes: clusters.map((c, i) => ({
						id: c.cluster_id,
						name: suggestions.get(i)?.clusterName ?? fallbackName(c, i),
						documentType: `${c.size} documents`,
						content: `${suggestions.get(i)?.description ?? c.description ?? ''}\nKey terms: ${(c.top_terms ?? []).join(', ')}`,
					})),
				}),
			enabled: named,
			staleTime: Infinity,
			retry: 1,
		},
		queryClient
	);

	return (
		<section className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3" aria-label="Clusters overview" data-testid="cluster-overview">
			<p className="text-sm font-semibold">
				{clusters.length} {clusters.length === 1 ? 'cluster' : 'clusters'} · {documents} {documents === 1 ? 'document' : 'documents'}
			</p>

			{/* Quick summary: a spinner until the names are in and the AI has written it */}
			<div className="text-sm leading-relaxed text-gray-800" data-testid="cluster-summary">
				{overview.data ? (
					overview.data.summary
				) : overview.isError ? (
					<span className="text-muted-foreground">Couldn&apos;t write a summary. The clusters below are still ready.</span>
				) : (
					<span className="flex items-center gap-2 text-muted-foreground">
						<Spinner label="Writing summary" />
						{named ? 'Writing a quick summary…' : 'Naming the clusters…'}
					</span>
				)}
			</div>

			{/* One line per cluster; click to jump to its card */}
			<ol className="space-y-1">
				{clusters.map((c, i) => {
					const s = suggestions.get(i);
					return (
						<li key={c.cluster_id}>
							<button
								type="button"
								onClick={() => onJump(c.cluster_id)}
								className="w-full text-left rounded-md px-2 py-1.5 hover:bg-white/70 flex items-start gap-2">
								{!s && namesLoading && <Spinner label="Naming cluster" />}
								<span className="min-w-0 flex-1">
									<span className="text-sm font-medium">{s?.clusterName ?? fallbackName(c, i)}</span>
									<span className="ml-1 text-xs text-muted-foreground">· {c.size}</span>
									{s?.description && <span className="text-xs text-muted-foreground line-clamp-2">{s.description}</span>}
								</span>
							</button>
						</li>
					);
				})}
			</ol>
		</section>
	);
}

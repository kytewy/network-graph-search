'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';
import { clusterDisplayName, namesFromSuggestions } from '@/lib/clustering/cluster-display';
import { searchColor } from '@/lib/config/view-modes';
import { foundBy, groupBySearch, roundTopIds } from '@/lib/workspace/collect';
import { nodeTokens } from '@/lib/utils/llm-tokens';
import type { Node } from '@/lib/config/types';

export type ContextGrouping = 'search' | 'cluster';

interface ContextGroupsProps {
	/** The context documents to show (already narrowed by the search box) */
	nodes: Node[];
	by: ContextGrouping;
	onOpen: (node: Node) => void;
	/** Sends a question to the chat */
	onAsk: (message: string) => void;
}

interface Group {
	key: string;
	title: string;
	color?: string;
	/** "4 of 50" for a search; which searches fed a cluster */
	detail: string;
	ids: string[];
	actions: { label: string; run: () => void; icon?: typeof MessageSquare }[];
}

const action = 'rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground inline-flex items-center gap-1';

/**
 * The Context tab as folders: one per search (with + Top 10 / + All / Remove)
 * or one per AI cluster (with Ask about this / Remove). Each document is
 * listed once; ★ marks documents more than one search found.
 */
export function ContextGroups({ nodes, by, onOpen, onAsk }: ContextGroupsProps) {
	const rounds = useAppStore((s) => s.rounds);
	const results = useAppStore((s) => s.searchResults);
	const aiClusters = useAppStore((s) => s.aiClusters);
	const { addNodesToContext, removeNodeFromContext, clusterResults, clusterSuggestions } = useContextStore();
	const highlight = useHighlightOnHover();
	const [closed, setClosed] = useState<Set<string>>(new Set());

	const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
	const found = useMemo(() => foundBy(rounds), [rounds]);
	const removeAll = (ids: string[]) => ids.forEach(removeNodeFromContext);
	const add = (ids: string[]) => addNodesToContext(results.filter((d) => ids.includes(d.id)));

	const groups: Group[] = useMemo(() => {
		const ids = nodes.map((n) => n.id);
		if (by === 'search') {
			return groupBySearch(ids, rounds).map(({ round, ids: inGroup }) =>
				round
					? {
							key: `s${round.n}`,
							title: `#${round.n} ${round.query}`,
							color: searchColor(round.n),
							detail: `${Object.keys(round.scores).filter((id) => byId.has(id)).length} of ${Object.keys(round.scores).length}`,
							ids: inGroup,
							actions: [
								{ label: '+ Top 10', run: () => add(roundTopIds(round, 10)) },
								{ label: '+ All', run: () => add(roundTopIds(round)) },
								{ label: '− Remove', run: () => removeAll(Object.keys(round.scores)) },
							],
						}
					: { key: 'other', title: 'Other (from earlier searches)', detail: String(inGroup.length), ids: inGroup, actions: [] }
			);
		}
		const names = namesFromSuggestions(clusterResults?.clusters ?? [], clusterSuggestions);
		const order = [...new Set(ids.map((id) => aiClusters[id] ?? ''))].sort();
		return order.map((cluster) => {
			const inGroup = ids.filter((id) => (aiClusters[id] ?? '') === cluster);
			const title = cluster ? clusterDisplayName(cluster, names) : 'Not clustered';
			const sources = [...new Set(inGroup.flatMap((id) => found[id] ?? []))].sort((a, b) => a - b);
			const labels = inGroup.map((id) => byId.get(id)?.label).filter(Boolean);
			return {
				key: `c${cluster}`,
				title,
				detail: sources.map((n) => `#${n}`).join(' '),
				ids: inGroup,
				actions: [
					...(cluster
						? [{ label: 'Ask about this', icon: MessageSquare, run: () => onAsk(`Focus on the "${title}" cluster: ${labels.join('; ')}. What do these documents say together, and where do they differ?`) }]
						: []),
					{ label: '− Remove', run: () => removeAll(inGroup) },
				],
			};
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [by, nodes, rounds, results, aiClusters, clusterResults, clusterSuggestions, found, byId]);

	const overlap = nodes.filter((n) => (found[n.id]?.length ?? 0) > 1).length;
	const toggle = (key: string) =>
		setClosed((prev) => {
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});

	return (
		<div className="space-y-2" data-testid="context-groups">
			<p className="text-xs text-muted-foreground">
				{nodes.length} in context
				{by === 'cluster' ? ` · ${groups.filter((g) => g.key !== 'c').length} clusters` : ''}
				{overlap > 0 ? ` · ${overlap} found by 2+ searches ★` : ''}
			</p>
			{groups.map((g) => (
				<section key={g.key} aria-label={g.title} className="rounded-md border border-sidebar-border bg-white/60">
					<button type="button" onClick={() => toggle(g.key)} aria-expanded={!closed.has(g.key)} className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs font-medium">
						{closed.has(g.key) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
						{g.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />}
						<span className="min-w-0 flex-1 truncate">{g.title}</span>
						<span className="text-muted-foreground">{by === 'search' ? g.detail : `${g.ids.length}${g.detail ? ` · ${g.detail}` : ''}`}</span>
					</button>
					{!closed.has(g.key) && (
						<div className="px-2 pb-2">
							{g.actions.length > 0 && (
								<div className="mb-1 flex flex-wrap gap-1">
									{g.actions.map((a) => (
										<button key={a.label} type="button" className={action} onClick={a.run} aria-label={`${a.label} ${g.title}`}>
											{a.icon && <a.icon className="h-3 w-3" />}
											{a.label}
										</button>
									))}
								</div>
							)}
							<ul className="text-xs">
								{g.ids.map((id) => {
									const node = byId.get(id)!;
									return (
										<li key={id} {...highlight(id)} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted/30" onClick={() => onOpen(node)}>
											<span className="min-w-0 flex-1 truncate font-medium">{node.label}</span>
											{(found[id]?.length ?? 0) > 1 && (
												// Just the star, as everywhere else; hover says which searches
												<span
													className="shrink-0 text-amber-600"
													title={`Found by ${found[id].map((n) => `#${n}`).join(', ')}`}
													aria-label={`Found by ${found[id].map((n) => `#${n}`).join(', ')}`}>
													★
												</span>
											)}
											<span className="text-muted-foreground/60">{nodeTokens(node).toLocaleString()}</span>
											<button
												type="button"
												aria-label={`Remove ${node.label} from context`}
												className="h-4 w-4 rounded hover:bg-destructive/20 hover:text-destructive"
												onClick={(e) => {
													e.stopPropagation();
													removeNodeFromContext(id);
												}}>
												×
											</button>
										</li>
									);
								})}
								{g.ids.length === 0 && <li className="px-1 py-1 text-muted-foreground">None in context yet</li>}
							</ul>
						</div>
					)}
				</section>
			))}
		</div>
	);
}

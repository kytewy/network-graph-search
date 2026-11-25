'use client';

import { Clock, Plus, Search, X } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-state';
import { olderSearches, useRecentSearches } from '@/lib/stores/recent-searches';

interface RecentSearchesProps {
	/** Runs a search: replace the results, or add it to the workspace */
	onPick: (query: string, topK: number, mode: 'replace' | 'add') => void;
}

/** Your searches: the ones in this workspace (with results) first, then older ones to run again */
export function RecentSearches({ onPick }: RecentSearchesProps) {
	const rounds = useAppStore((s) => s.rounds);
	const { recent, forget } = useRecentSearches();
	const older = olderSearches(recent, rounds.map((r) => r.query));
	if (rounds.length === 0 && older.length === 0) return null;
	return (
		<div className="rounded-lg border border-primary/30 bg-white p-2 text-sm" data-testid="recent-searches">
			{rounds.length > 0 && (
				<section aria-label="In this workspace">
					<h3 className="px-2 pb-1 text-xs font-medium text-primary">In this workspace</h3>
					<ul>
						{rounds.map((r) => (
							<li key={r.n} className="flex items-center gap-2 rounded-md px-2 py-1.5">
								<Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" />
								<span className="min-w-0 flex-1 truncate">
									#{r.n} {r.query}
								</span>
								<span className="shrink-0 text-xs text-muted-foreground">{Object.keys(r.scores).length} results</span>
							</li>
						))}
					</ul>
				</section>
			)}
			{older.length > 0 && (
				<section aria-label="Recent searches" className={rounds.length > 0 ? 'mt-1 border-t pt-1' : ''}>
					<h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">Recent</h3>
					<ul>
						{older.map((r) => (
							<li key={r.query} className="group flex items-center gap-1 rounded-md hover:bg-accent/40">
								<button
									type="button"
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => onPick(r.query, r.topK, 'replace')}
									className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left">
									<Clock aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									<span className="truncate">{r.query}</span>
								</button>
								{rounds.length > 0 && (
									<button
										type="button"
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => onPick(r.query, r.topK, 'add')}
										aria-label={`Add "${r.query}" to the workspace`}
										title="Add to the workspace"
										className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary">
										<Plus className="h-3.5 w-3.5" />
									</button>
								)}
								<button
									type="button"
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => forget(r.query)}
									aria-label={`Forget "${r.query}"`}
									className="mr-1 rounded p-1 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100">
									<X className="h-3 w-3" />
								</button>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}

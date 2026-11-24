'use client';

import { X } from 'lucide-react';
import { OverlapIcon } from '@/components/search/OverlapIcon';
import { useAppStore } from '@/lib/stores/app-state';
import { FOUND_BY_MANY } from '@/lib/config/filters';
import { FOUND_BY_MANY_COLOR, searchColor } from '@/lib/config/view-modes';

/**
 * The searches in the workspace as a filter: tick one or more to show only
 * what they found, "Found by 2+" for the overlap, ✕ to take a search out.
 * Hovering a search lights up its documents on the graph.
 */
export function SearchesFilter() {
	const rounds = useAppStore((s) => s.rounds);
	const selected = useAppStore((s) => s.selectedSearches);
	const results = useAppStore((s) => s.searchResults);
	// Counts follow the other filters (Location, score…); re-count when they change
	useAppStore((s) => s.filteredResults);
	const base = useAppStore.getState().facet('searches');
	const toggle = useAppStore((s) => s.toggleSearchFilter);
	const removeRound = useAppStore((s) => s.removeRound);
	const setHighlighted = useAppStore((s) => s.setHighlightedNodes);

	const overlap = results.filter((d) => (d.foundBy?.length ?? 0) > 1);
	const overlapLeft = base.filter((d) => (d.foundBy?.length ?? 0) > 1).length;
	const row = (value: string, ticked: boolean) =>
		`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${ticked ? 'bg-primary/10 font-medium' : 'hover:bg-accent/50'}`;

	return (
		<ul className="space-y-0.5" aria-label="Searches in the workspace">
			{rounds.map((r) => {
				const value = String(r.n);
				const ids = Object.keys(r.scores);
				const left = base.filter((d) => d.foundBy?.includes(r.n)).length;
				const faded = !selected.includes(value) && left === 0 ? 'opacity-40' : '';
				return (
					<li key={r.n} className="group flex items-center gap-1">
						<button
							type="button"
							aria-pressed={selected.includes(value)}
							onClick={() => toggle(value)}
							onMouseEnter={() => setHighlighted(ids)}
							onMouseLeave={() => setHighlighted([])}
							className={`${row(value, selected.includes(value))} ${faded}`}>
							<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: searchColor(r.n) }} />
							<span className="min-w-0 flex-1 truncate">
								#{r.n} {r.query}
							</span>
							<span className="text-xs text-muted-foreground">{left}</span>
						</button>
						{rounds.length > 1 && (
							<button
								type="button"
								onClick={() => removeRound(r.n)}
								aria-label={`Remove search #${r.n} ${r.query}`}
								title="Remove this search from the workspace"
								className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-accent/50">
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</li>
				);
			})}
			{overlap.length > 0 && (
				<li className="flex items-center gap-1 pr-8">
					<button
						type="button"
						aria-pressed={selected.includes(FOUND_BY_MANY)}
						onClick={() => toggle(FOUND_BY_MANY)}
						onMouseEnter={() => setHighlighted(overlap.map((d) => d.id))}
						onMouseLeave={() => setHighlighted([])}
						className={`${row(FOUND_BY_MANY, selected.includes(FOUND_BY_MANY))} ${!selected.includes(FOUND_BY_MANY) && overlapLeft === 0 ? 'opacity-40' : ''}`}>
						<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FOUND_BY_MANY_COLOR }} />
						<OverlapIcon label="" />
						<span className="flex-1">Found by 2+ searches</span>
						<span className="text-xs text-muted-foreground">{overlapLeft}</span>
					</button>
				</li>
			)}
		</ul>
	);
}

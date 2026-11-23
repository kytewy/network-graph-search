/**
 * The rows of the results table and how they sort. Kept apart from the
 * component so the sorting can be tested on its own.
 */
import type { Node } from '@/lib/config/types';

export type TableSortKey = 'score' | 'title' | 'cluster' | 'context';
export type SortDirection = 'asc' | 'desc';

export interface ResultRow {
	node: Node;
	/** The cluster's display name, or null before clustering */
	cluster: string | null;
	inContext: boolean;
}

/** Score is best-first by default; the text columns start A → Z. */
export const DEFAULT_DIRECTION: Record<TableSortKey, SortDirection> = {
	score: 'desc',
	title: 'asc',
	cluster: 'asc',
	context: 'desc',
};

const compare: Record<TableSortKey, (a: ResultRow, b: ResultRow) => number> = {
	score: (a, b) => a.node.score - b.node.score,
	title: (a, b) => a.node.label.localeCompare(b.node.label),
	// Rows without a cluster go last whichever way you sort
	cluster: (a, b) => (a.cluster ?? '').localeCompare(b.cluster ?? ''),
	context: (a, b) => Number(a.inContext) - Number(b.inContext),
};

export function sortRows(rows: readonly ResultRow[], key: TableSortKey, direction: SortDirection): ResultRow[] {
	const sign = direction === 'asc' ? 1 : -1;
	return [...rows].sort((a, b) => {
		if (key === 'cluster' && !a.cluster !== !b.cluster) return a.cluster ? -1 : 1;
		// Ties keep the best score first
		return sign * compare[key](a, b) || b.node.score - a.node.score;
	});
}

/** Clicking the column you're sorted by flips it; a new column starts at its default. */
export function nextSort(
	current: { key: TableSortKey; direction: SortDirection },
	clicked: TableSortKey
): { key: TableSortKey; direction: SortDirection } {
	if (current.key !== clicked) return { key: clicked, direction: DEFAULT_DIRECTION[clicked] };
	return { key: clicked, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

import { useMemo } from 'react';
import { useAppStore } from '@/lib/stores/app-state';
import { foundBy } from '@/lib/workspace/collect';

/**
 * Which searches found each document ("#1, #3"), once more than one search
 * is in the workspace. `collected` is false after a single search, so the
 * results look exactly as before.
 */
export function useFoundBy() {
	const rounds = useAppStore((s) => s.rounds);
	return useMemo(() => ({ collected: rounds.length > 1, rounds: rounds.length, byDoc: foundBy(rounds) }), [rounds]);
}

/** "#1 #2" with a ★ when more than one search found it */
export function foundByLabel(ns: number[] | undefined): string {
	if (!ns?.length) return '';
	return `${ns.map((n) => `#${n}`).join(' ')}${ns.length > 1 ? ' ★' : ''}`;
}

/**
 * The search as it appears in the web address: /graph?q=AI+Act&k=20
 * q = the query, k = how many results.
 */
import { parseAsInteger, parseAsString } from 'nuqs';
import { SEARCH_LIMITS } from '@/lib/contracts/search';

export const searchUrlParams = {
	q: parseAsString,
	k: parseAsInteger,
};

/** A count from a link might be anything; keep it within what search allows. */
export function clampTopK(k: number | null): number {
	if (k == null || !Number.isFinite(k)) return SEARCH_LIMITS.DEFAULT_TOP_K;
	return Math.min(SEARCH_LIMITS.MAX_TOP_K, Math.max(1, Math.round(k)));
}

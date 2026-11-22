/**
 * Talks to the search route. Requests and replies are checked against the
 * search rulebook (lib/contracts/search.ts), and TanStack Query remembers
 * recent searches, retries a network blip once and cancels on request.
 */
import { queryClient } from './query-client';
import { searchResponseSchema, type SearchRequest, type SearchResponse } from '@/lib/contracts/search';

export const SEARCH_CACHE = {
	/** A repeat of the same search within this time is answered from memory */
	FRESH_MS: 5 * 60_000,
	/** Extra attempts after a network blip or server error */
	RETRIES: 1,
	RETRY_DELAY_MS: 300,
} as const;

export class ApiError extends Error {
	constructor(message: string, readonly status?: number) {
		super(message);
		this.name = 'ApiError';
	}
}

export async function fetchSearch(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
	const response = await fetch('/api/reranked-vector-search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
		signal,
	});
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		// API routes return { error }; older responses used { message }
		throw new ApiError(data?.error || data?.message || 'Search failed', response.status);
	}

	const reply = searchResponseSchema.safeParse(data);
	if (!reply.success) throw new ApiError('Search returned an unexpected reply. Please try again.');
	return reply.data;
}

export const searchQueryKey = (query: string, topK: number) => ['search', query, topK] as const;

/** Retry network blips and server errors, never a request the server rejected. */
function shouldRetry(failureCount: number, error: unknown) {
	if (failureCount >= SEARCH_CACHE.RETRIES) return false;
	if (error instanceof ApiError) return (error.status ?? 0) >= 500;
	return true;
}

/** One search, answered from memory when the same one ran recently. */
export function searchOnce(query: string, topK: number): Promise<SearchResponse> {
	return queryClient.fetchQuery({
		queryKey: searchQueryKey(query, topK),
		queryFn: ({ signal }) => fetchSearch({ query, topK }, signal),
		staleTime: SEARCH_CACHE.FRESH_MS,
		retry: shouldRetry,
		retryDelay: SEARCH_CACHE.RETRY_DELAY_MS,
	});
}

/** Stop a search that is still running (it is replaced by a newer one). */
export function cancelSearch(query: string, topK: number) {
	return queryClient.cancelQueries({ queryKey: searchQueryKey(query, topK) });
}

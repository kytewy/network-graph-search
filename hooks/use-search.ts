import { useAppStore } from '@/lib/stores/app-state';

/**
 * Search for the search box. Searches run through TanStack Query's shared
 * memory (lib/api/search-client.ts): a repeat within a few minutes is
 * instant, a network blip is retried once, and a newer search cancels an
 * older one. The store runs it, so a search keeps going even if the search
 * box is hidden (e.g. on the Filters tab), and its results still arrive.
 */
export function useSearch() {
	const search = useAppStore((s) => s.performSearch);
	const isLoading = useAppStore((s) => s.isLoading);
	const error = useAppStore((s) => s.error);
	return { search, isLoading, error };
}

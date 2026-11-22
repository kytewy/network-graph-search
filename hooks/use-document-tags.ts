import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/query-client';
import { fetchTags, tagsQueryKey } from '@/lib/api/tags-client';

/**
 * A document's tags. Refreshes by itself after any tag change made through
 * changeTag (lib/api/tags-client.ts), including tags added to a whole cluster.
 */
export function useDocumentTags(documentId: string) {
	return useQuery(
		{
			queryKey: tagsQueryKey(documentId),
			queryFn: ({ signal }) => fetchTags(documentId, signal),
			staleTime: 60_000,
		},
		// Passed directly: the reading view also opens from the graph's menus,
		// which React draws in a separate renderer that can't see QueryProvider
		queryClient
	);
}

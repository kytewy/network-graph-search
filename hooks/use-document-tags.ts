import { useQuery } from '@tanstack/react-query';
import { fetchTags, tagsQueryKey } from '@/lib/api/tags-client';

/**
 * A document's tags. Refreshes by itself after any tag change made through
 * changeTag (lib/api/tags-client.ts), including tags added to a whole cluster.
 */
export function useDocumentTags(documentId: string) {
	return useQuery({
		queryKey: tagsQueryKey(documentId),
		queryFn: ({ signal }) => fetchTags(documentId, signal),
		staleTime: 60_000,
	});
}

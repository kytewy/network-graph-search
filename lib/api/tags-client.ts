/**
 * Document tags. Every change goes through `changeTag`, which also updates
 * the loaded results (so the list and the tag filter show it) and refreshes
 * each document's tags wherever they are shown.
 */
import { queryClient } from './query-client';
import { requestJson } from './http';
import { useAppStore } from '@/lib/stores/app-state';

export const tagsQueryKey = (documentId: string) => ['tags', documentId] as const;

export async function fetchTags(documentId: string, signal?: AbortSignal): Promise<string[]> {
	const data = await requestJson<{ tags?: string[] }>(
		`/api/documents/tags?documentId=${encodeURIComponent(documentId)}`,
		{ signal },
		'Failed to load tags'
	);
	return data?.tags ?? [];
}

export async function changeTag(documentIds: string[], tag: string, action: 'add' | 'remove') {
	await requestJson(
		'/api/documents/tags',
		{ method: 'PATCH', body: JSON.stringify({ documentIds, tag, action }) },
		`Failed to ${action} tag`
	);

	const ids = new Set(documentIds);
	const { searchResults, setSearchResults } = useAppStore.getState();
	setSearchResults(
		searchResults.map((node) => {
			if (!ids.has(node.id)) return node;
			const others = (node.tags ?? []).filter((t) => t !== tag);
			return { ...node, tags: action === 'add' ? [...others, tag] : others };
		})
	);
	documentIds.forEach((id) => queryClient.invalidateQueries({ queryKey: tagsQueryKey(id) }));
}

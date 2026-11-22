import { clusterDocuments, nameCluster } from '@/lib/api/analysis-client';
import { changeTag, fetchTags, tagsQueryKey } from '@/lib/api/tags-client';
import { queryClient } from '@/lib/api/query-client';
import { useAppStore } from '@/lib/stores/app-state';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const doc = (id: string, tags: string[] = []) =>
	({ id, label: id, score: 1, size: 1, publisher: '', documentType: '', summary: '', content: '', tags }) as any;

beforeEach(() => {
	global.fetch = jest.fn();
	queryClient.clear();
});

describe('clustering client', () => {
	const nodes = [
		{ id: 'b', label: 'B', content: 'b' },
		{ id: 'a', label: 'A', content: 'a' },
	];

	it('remembers the clusters for the same documents, in any order', async () => {
		(global.fetch as jest.Mock).mockResolvedValue(ok({ clusters: [], cluster_assignments: {} }));
		await clusterDocuments(nodes);
		await clusterDocuments([...nodes].reverse());
		expect(global.fetch).toHaveBeenCalledTimes(1);

		await clusterDocuments(nodes.slice(0, 1)); // different documents
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	it('remembers a cluster name, and reports the server error message', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce(ok({ clusterName: 'Privacy' }));
		const payload = [{ id: 'a', label: 'A', fields: { full_text: 'a' } }];
		await expect(nameCluster(payload, 0)).resolves.toEqual({ clusterName: 'Privacy' });
		await nameCluster(payload, 0);
		expect(global.fetch).toHaveBeenCalledTimes(1);

		(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: 'Too many requests' }) });
		await expect(nameCluster(payload, 1)).rejects.toThrow('Too many requests');
	});
});

describe('tags client', () => {
	it('loads a document’s tags', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce(ok({ tags: ['risk'] }));
		await expect(fetchTags('a')).resolves.toEqual(['risk']);
		expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/documents/tags?documentId=a');
	});

	it('after a change, updates the results and refreshes each document’s tags', async () => {
		useAppStore.getState().setSearchResults([doc('a', ['old']), doc('b'), doc('c')]);
		queryClient.setQueryData(tagsQueryKey('a'), ['old']);
		(global.fetch as jest.Mock).mockResolvedValueOnce(ok({ success: true }));

		await changeTag(['a', 'b'], 'new', 'add');

		const tagsOf = (id: string) => useAppStore.getState().searchResults.find((n) => n.id === id)?.tags;
		expect(tagsOf('a')).toEqual(['old', 'new']);
		expect(tagsOf('b')).toEqual(['new']);
		expect(tagsOf('c')).toEqual([]);
		expect(queryClient.getQueryState(tagsQueryKey('a'))?.isInvalidated).toBe(true);

		(global.fetch as jest.Mock).mockResolvedValueOnce(ok({ success: true }));
		await changeTag(['a'], 'old', 'remove');
		expect(tagsOf('a')).toEqual(['new']);
	});
});

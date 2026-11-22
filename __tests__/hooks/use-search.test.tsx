import { act, renderHook } from '@testing-library/react';
import { useSearch } from '@/hooks/use-search';
import { queryClient } from '@/lib/api/query-client';
import { useAppStore } from '@/lib/stores/app-state';

const hit = { id: 'a', label: 'Doc A', score: 0.9, similarity: 0.9, publisher: '', documentType: '', summary: '', content: '', continent: '', country: '', size: 9, tags: [] };

describe('useSearch', () => {
	beforeEach(() => {
		queryClient.clear();
		global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ nodes: [hit], edges: [] }) });
	});

	it('searches, fills the results, and answers a repeat from memory', async () => {
		const { result } = renderHook(() => useSearch());

		await act(() => result.current.search('AI', 10));
		expect(useAppStore.getState().searchResults.map((n) => n.id)).toEqual(['a']);
		expect(result.current.isLoading).toBe(false);

		await act(() => result.current.search('AI', 10));
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});
});

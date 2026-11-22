import { renderHook, waitFor } from '@testing-library/react';
import { useDocumentTags } from '@/hooks/use-document-tags';
import { queryClient } from '@/lib/api/query-client';

describe('useDocumentTags', () => {
	beforeEach(() => queryClient.clear());

	// The graph draws its menus in a separate React renderer that cannot see
	// the page's QueryProvider, and the reading view opens from there
	it('works without a QueryProvider around it', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ tags: ['risk'] }) });
		const { result } = renderHook(() => useDocumentTags('a'));
		await waitFor(() => expect(result.current.data).toEqual(['risk']));
	});
});

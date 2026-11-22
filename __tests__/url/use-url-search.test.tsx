import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { useSearchFromUrl, useUrlSearch } from '@/hooks/use-url-search';
import { SEARCH_LIMITS } from '@/lib/contracts/search';
import { useAppStore } from '@/lib/stores/app-state';

const performSearch = jest.fn();

function setup(searchParams = '') {
	const updates: UrlUpdateEvent[] = [];
	const wrapper = withNuqsTestingAdapter({ searchParams, onUrlUpdate: (e) => updates.push(e) });
	const result = renderHook(() => ({ fromUrl: useSearchFromUrl(), url: useUrlSearch() }), { wrapper });
	return { ...result, updates };
}

describe('search in the web address', () => {
	beforeEach(() => {
		performSearch.mockReset();
		useAppStore.setState({ performSearch, query: '', topK: 10 });
	});

	it('runs the search in the address when the page opens', () => {
		setup('?q=AI+Act&k=20');
		expect(performSearch).toHaveBeenCalledWith('AI Act', 20);
		expect(useAppStore.getState().query).toBe('AI Act');
		expect(useAppStore.getState().topK).toBe(20);
	});

	it('does nothing when the address has no search', () => {
		setup('');
		expect(performSearch).not.toHaveBeenCalled();
	});

	it('keeps a result count in range', () => {
		setup('?q=AI&k=999');
		expect(performSearch).toHaveBeenCalledWith('AI', SEARCH_LIMITS.MAX_TOP_K);
	});

	it('puts a new search in the address (as a new history entry) and runs it', async () => {
		const { result, updates } = setup('');
		await act(async () => result.current.url.submit('privacy', 15));
		expect(updates.at(-1)?.queryString).toBe('?q=privacy&k=15');
		expect(updates.at(-1)?.options.history).toBe('push');
		expect(performSearch).toHaveBeenCalledWith('privacy', 15);
	});

	it('searching the same thing again still runs it (e.g. after an error)', async () => {
		const { result } = setup('?q=AI&k=10');
		performSearch.mockReset();
		await act(async () => result.current.url.submit('AI', 10));
		expect(performSearch).toHaveBeenCalledTimes(1);
	});

	it('clearing removes the search from the address', async () => {
		const { result, updates } = setup('?q=AI&k=10');
		await act(async () => result.current.url.clear());
		expect(updates.at(-1)?.searchParams.has('q')).toBe(false);
		expect(updates.at(-1)?.searchParams.has('k')).toBe(false);
	});
});

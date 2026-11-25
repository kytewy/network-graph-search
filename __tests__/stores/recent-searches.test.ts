import { MAX_RECENT, olderSearches, useRecentSearches } from '@/lib/stores/recent-searches';

describe('recent searches', () => {
	beforeEach(() => useRecentSearches.setState({ recent: [] }));

	it('keeps the newest first, once each (ignoring case), and at most a dozen', () => {
		const { remember } = useRecentSearches.getState();
		remember('AI regulation', 50);
		remember('compliance', 20);
		remember('ai REGULATION ', 30);
		expect(useRecentSearches.getState().recent.map((r) => [r.query, r.topK])).toEqual([['ai REGULATION', 30], ['compliance', 20]]);
		for (let i = 0; i < 20; i++) remember(`q${i}`, 10);
		expect(useRecentSearches.getState().recent).toHaveLength(MAX_RECENT);
	});

	it('lists the workspace searches apart, so older ones show only once', () => {
		const { remember } = useRecentSearches.getState();
		remember('compliance', 20);
		remember('AI regulation', 50);
		expect(olderSearches(useRecentSearches.getState().recent, ['ai regulation']).map((r) => r.query)).toEqual(['compliance']);
		useRecentSearches.getState().forget('compliance');
		expect(useRecentSearches.getState().recent.map((r) => r.query)).toEqual(['AI regulation']);
	});
});

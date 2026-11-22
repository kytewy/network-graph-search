import { fetchSearch, searchOnce, SEARCH_CACHE } from '@/lib/api/search-client';
import { queryClient } from '@/lib/api/query-client';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const reply = { nodes: [], edges: [] };

describe('search client', () => {
	beforeEach(() => {
		global.fetch = jest.fn();
		queryClient.clear();
	});

	it('sends the request the rulebook describes and returns the checked reply', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce(ok(reply));
		await expect(fetchSearch({ query: 'AI', topK: 5 })).resolves.toEqual(reply);
		const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
		expect(url).toBe('/api/reranked-vector-search');
		expect(JSON.parse(init.body)).toEqual({ query: 'AI', topK: 5 });
	});

	it('passes on the error message the route sends', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Query parameter is required' }) });
		await expect(fetchSearch({ query: '', topK: 5 })).rejects.toThrow('Query parameter is required');
	});

	it('answers a repeated search from memory without calling the server again', async () => {
		(global.fetch as jest.Mock).mockResolvedValue(ok(reply));
		await searchOnce('AI', 10);
		await searchOnce('AI', 10);
		expect(global.fetch).toHaveBeenCalledTimes(1);

		await searchOnce('AI', 20); // a different result count is a different search
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	it('retries once after a network blip', async () => {
		(global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok(reply));
		await expect(searchOnce('AI', 10)).resolves.toEqual(reply);
		expect(global.fetch).toHaveBeenCalledTimes(1 + SEARCH_CACHE.RETRIES);
	});

	it('does not retry a request the server rejected', async () => {
		(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'Bad' }) });
		await expect(searchOnce('AI', 10)).rejects.toThrow('Bad');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});
});

import type { Mock } from 'vitest';
/**
 * @vitest-environment node
 */

/**
 * The search rulebook (contract): what a valid search request and reply
 * look like, shared by the route and the app.
 */

import { NextRequest } from 'next/server';
import {
	SEARCH_LIMITS,
	parseSearchRequest,
	searchResponseSchema,
} from '@/lib/contracts/search';

vi.mock('@/lib/services/vector_search', () => ({ searchPinecone: vi.fn(), searchPassages: vi.fn(async () => []), fetchDocuments: vi.fn(async () => []) }));
import { fetchDocuments, searchPassages, searchPinecone } from '@/lib/services/vector_search';
import { POST as search } from '@/app/api/reranked-vector-search/route';
import { resetRateLimits } from '@/lib/utils/api-guard';

const mockSearch = searchPinecone as Mock;

const post = (body: string) =>
	search(
		new NextRequest('http://localhost/api/reranked-vector-search', {
			method: 'POST',
			body,
			headers: { 'content-type': 'application/json' },
		})
	);

describe('parseSearchRequest', () => {
	it('accepts a query and fills in the default result count', () => {
		expect(parseSearchRequest({ query: 'AI Act' })).toEqual({
			ok: true,
			data: { query: 'AI Act', topK: 10 },
		});
	});

	it('trims the query and rejects an empty one', () => {
		expect(parseSearchRequest({ query: '  AI  ', topK: 5 })).toMatchObject({ ok: true, data: { query: 'AI' } });
		expect(parseSearchRequest({ query: '   ' })).toEqual({ ok: false, error: 'Query parameter is required' });
		expect(parseSearchRequest({})).toEqual({ ok: false, error: 'Query parameter is required' });
	});

	it('rejects a query that is too long', () => {
		const query = 'a'.repeat(SEARCH_LIMITS.MAX_QUERY_CHARS + 1);
		expect(parseSearchRequest({ query })).toEqual({
			ok: false,
			error: `Query must be under ${SEARCH_LIMITS.MAX_QUERY_CHARS} characters`,
		});
	});

	it.each([0, 1.5, SEARCH_LIMITS.MAX_TOP_K + 1, 'lots'])('rejects topK = %p', (topK) => {
		expect(parseSearchRequest({ query: 'AI', topK })).toEqual({
			ok: false,
			error: `topK must be a whole number from 1 to ${SEARCH_LIMITS.MAX_TOP_K}`,
		});
	});

	it('still accepts topK sent as text, as older clients did', () => {
		expect(parseSearchRequest({ query: 'AI', topK: '20' })).toMatchObject({ ok: true, data: { topK: 20 } });
	});
});

describe('search route', () => {
	beforeEach(() => {
		resetRateLimits();
		mockSearch.mockReset();
	});

	it('answers a body that is not JSON with 400, not a server error', async () => {
		const res = await post('not json');
		expect(res.status).toBe(400);
		expect(mockSearch).not.toHaveBeenCalled();
	});

	it('rejects an invalid request before calling Pinecone', async () => {
		const res = await post(JSON.stringify({ query: '' }));
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: 'Query parameter is required' });
		expect(mockSearch).not.toHaveBeenCalled();
	});

	it('replies in the shape the rulebook describes', async () => {
		mockSearch.mockResolvedValue({
			results: {
				result: {
					hits: [
						{ _id: 'a', _score: 0.9, fields: { label: 'Doc A', connected_to: ['b'], tags: ['x'] } },
						{ _id: 'b', _score: 0.5, fields: { label: 'Doc B' } },
					],
				},
			},
		});
		const res = await post(JSON.stringify({ query: 'AI', topK: 2 }));
		expect(res.status).toBe(200);
		const parsed = searchResponseSchema.safeParse(await res.json());
		expect(parsed.success).toBe(true);
		expect(parsed.data?.nodes.map((n) => n.id)).toEqual(['a', 'b']);
		expect(parsed.data?.edges).toHaveLength(1);
		expect(mockSearch).toHaveBeenCalledWith('AI', 2, true, undefined);
	});
});

describe('searchResponseSchema', () => {
	it('rejects a reply without nodes, so the app can show a clear error', () => {
		expect(searchResponseSchema.safeParse({ edges: [] }).success).toBe(false);
	});
});

describe('search by passage', () => {
	beforeEach(() => {
		resetRateLimits();
		mockSearch.mockReset();
	});

	it('brings in a document only its passages found, with its best passages and match count', async () => {
		mockSearch.mockResolvedValue({ results: { result: { hits: [{ _id: 'a', _score: 0.4, fields: { label: 'A' } }] } } });
		(searchPassages as Mock).mockResolvedValueOnce([
			{ _id: 'e23#p14', _score: 0.9, fields: { document_id: 'e23', position: 14, heading: 'Model Inventory', start: 9000, chunk_text: 'E-23 · Model Inventory\nKeep a complete inventory.' } },
			{ _id: 'e23#p22', _score: 0.7, fields: { document_id: 'e23', position: 22, heading: 'Model Review', start: 15000, chunk_text: 'E-23 · Model Review\nReview models.' } },
		]);
		(fetchDocuments as Mock).mockResolvedValueOnce([{ _id: 'e23', metadata: { label: 'OSFI E-23', content: 'Full text' } }]);
		const res = await post(JSON.stringify({ query: 'model inventory', topK: 10 }));
		const { nodes } = searchResponseSchema.parse(await res.json());
		expect(nodes.map((n) => n.id)).toEqual(['e23', 'a']);
		expect(nodes[0]).toMatchObject({ label: 'OSFI E-23', score: 0.9, matches: 2 });
		expect(nodes[0].passages?.[0]).toMatchObject({ heading: 'Model Inventory', text: 'Keep a complete inventory.' });
		expect(nodes[1].passages).toBeUndefined();
	});
});

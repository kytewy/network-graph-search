/**
 * @jest-environment node
 */

/**
 * Pinecone search request building
 *
 * The search route always asked for reranking, but the request never
 * included a rerank block, so results came back in raw vector order.
 */

import { buildSearchRequest, RERANK } from '@/lib/services/vector_search';

describe('buildSearchRequest', () => {
	it('adds a rerank block when reranking is on', () => {
		const request = buildSearchRequest('high-risk AI', 10, true);
		expect(request.rerank).toEqual({
			model: RERANK.model,
			topN: 10,
			rankFields: ['chunk_text'],
			parameters: { truncate: 'END' },
		});
	});

	it('over-fetches candidates for the reranker, capped at its limit', () => {
		expect(buildSearchRequest('q', 10, true).query.topK).toBe(RERANK.minCandidates);
		expect(buildSearchRequest('q', 30, true).query.topK).toBe(60);
		expect(buildSearchRequest('q', 100, true).query.topK).toBe(RERANK.maxCandidates);
	});

	it('returns exactly topK results after reranking', () => {
		expect(buildSearchRequest('q', 25, true).rerank?.topN).toBe(25);
	});

	it('sends a plain vector query when reranking is off', () => {
		const request = buildSearchRequest('q', 10, false);
		expect(request.rerank).toBeUndefined();
		expect(request.query.topK).toBe(10);
	});

	it('passes the query text and filters through', () => {
		const filter = { continent: { $in: ['Europe'] } };
		const request = buildSearchRequest('watermarking', 10, true, filter);
		expect(request.query.inputs).toEqual({ text: 'watermarking' });
		expect(request.query.filter).toEqual(filter);
	});

	it('leaves the filter out when none is given', () => {
		expect(buildSearchRequest('q', 10, true, {}).query.filter).toBeUndefined();
	});
});

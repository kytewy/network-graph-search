import { NextRequest, NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/services/vector_search';
import { buildPineconeFilter, logFilterExpression } from '@/lib/utils/pinecone-filters';
import { badRequest, rateLimit, serverError } from '@/lib/utils/api-guard';
import { parseSearchRequest, type SearchResponse } from '@/lib/contracts/search';
import { toApiEdges, toApiNode, type PineconeHit } from '@/lib/contracts/node';

export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'search');
	if (limited) return limited;

	try {
		// The body must be JSON; anything else is the caller's mistake, not ours
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return badRequest('Request body must be JSON');
		}

		const parsed = parseSearchRequest(body);
		if (!parsed.ok) return badRequest(parsed.error);
		const { query, topK: requestedTopK, filters = {} } = parsed.data;

		// Build Pinecone metadata filter expression from user filters
		const pineconeFilter = buildPineconeFilter(filters);
		logFilterExpression(filters, pineconeFilter);

		// Use the searchPinecone function with reranking enabled and filters
		const { results } = await searchPinecone(query, requestedTopK, true, pineconeFilter);

		// Serverless inference returns result.hits; the older format returned matches
		const raw = results as { result?: { hits?: PineconeHit[] }; matches?: PineconeHit[] };
		const hits = raw?.result?.hits ?? raw?.matches ?? [];

		const reply: SearchResponse = {
			nodes: hits.map(toApiNode),
			edges: toApiEdges(hits),
		};
		return NextResponse.json(reply);
	} catch (error) {
		return serverError('reranked-vector-search', error, 'Search failed');
	}
}

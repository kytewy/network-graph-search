import { NextRequest, NextResponse } from 'next/server';
import { fetchDocuments, searchPassages, searchPinecone } from '@/lib/services/vector_search';
import { groupPassages, rankDocuments } from '@/lib/search/passage-results';
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

		// Documents and their passages, searched together; a document can be found by either
		const [{ results }, passageHits] = await Promise.all([
			searchPinecone(query, requestedTopK, true, pineconeFilter),
			searchPassages(query, requestedTopK, pineconeFilter),
		]);

		const raw = results as { result?: { hits?: PineconeHit[] }; matches?: PineconeHit[] };
		const docHits = raw?.result?.hits ?? raw?.matches ?? [];
		const groups = groupPassages(passageHits as PineconeHit[]);
		const ranked = rankDocuments(docHits, groups, requestedTopK);
		// Documents only a passage found aren't in the document hits yet: fetch their records
		const byId = new Map(docHits.map((h) => [h._id ?? h.id ?? '', h]));
		for (const hit of await fetchDocuments(ranked.map(([id]) => id).filter((id) => !byId.has(id)))) byId.set(hit._id, hit);
		const hits = ranked.filter(([id]) => byId.has(id)).map(([id, score]) => ({ ...byId.get(id)!, _score: score }));

		const reply: SearchResponse = {
			nodes: hits.map((hit) => {
				const node = toApiNode(hit);
				const group = groups.get(node.id);
				return group ? { ...node, passages: group.passages, matches: group.matches } : node;
			}),
			edges: toApiEdges(hits),
		};
		return NextResponse.json(reply);
	} catch (error) {
		return serverError('reranked-vector-search', error, 'Search failed');
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/services/vector_search';
import { buildPineconeFilter, logFilterExpression } from '@/lib/utils/pinecone-filters';
import { badRequest, rateLimit, serverError } from '@/lib/utils/api-guard';
import {
	parseSearchRequest,
	type ApiEdge,
	type ApiNode,
	type SearchResponse,
} from '@/lib/contracts/search';

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


		// Process the results based on the v6.1.2 searchRecords response format
		let nodes: ApiNode[] = [];
		const edges: ApiEdge[] = [];

		// Use any type to avoid TypeScript errors with the response format
		const responseData = results as any;

		// Check if results exists and has hits (Pinecone serverless inference format)
		const hits = responseData?.result?.hits || responseData?.matches || [];
		const allNodeIds = new Set<string>();

		if (Array.isArray(hits) && hits.length > 0) {
			// Get all node IDs first to create a lookup set
			// This is similar to the Python example's all_node_ids set
			hits.forEach((hit: any) => {
				allNodeIds.add(hit._id || hit.id);
			});

			// First, create all nodes from the hits
			nodes = hits.map((hit: any) => {
				// Handle both formats: serverless inference (fields) and standard (metadata)
				const data = hit.fields || hit.metadata || {};
				const nodeId = hit._id || hit.id;
				const score = hit._score || hit.score || 0;

				const node = {
					id: nodeId,
					label: data.label || nodeId,
					score: score,
					similarity: score, // For compatibility with existing code
					publisher: data.publisher || '',
					documentType: data.documentType || '',
					summary: data.summary || '',
					content: data.content?.substring(0, 200) || '',
					continent: data.continent || '',
					country: data.country || '',
					size: score * 10, // Scale score for node size
					url: data.url || undefined,
					tags: data.tags || [],
				};

				return node;
			});

			// Then create edges based on connected_to field
			// This is similar to the Python example's edge creation logic
			hits.forEach((hit: any) => {
				const data = hit.fields || hit.metadata || {};
				const nodeId = hit._id || hit.id;
				const connectedTo = data.connected_to || [];

				if (Array.isArray(connectedTo)) {
					connectedTo.forEach((targetId: string) => {
						// Only create edges to nodes that are in our result set
						// This matches the Python example's check: if target_id in all_node_ids
						if (allNodeIds.has(targetId)) {
							const edgeId = `${nodeId}-${targetId}`;
							edges.push({
								id: edgeId,
								source: nodeId,
								target: targetId,
								label: 'connected',
								type: 'connected',
								weight: 1,
							});
						}
					});
				}
			});
		}

		// Return the nodes and edges with rawResponse for compatibility
		const reply: SearchResponse = {
			nodes,
			edges,
			rawResponse: results, // Include raw response for processApiResponse
		};
		return NextResponse.json(reply);
	} catch (error) {
		return serverError('reranked-vector-search', error, 'Search failed');
	}
}

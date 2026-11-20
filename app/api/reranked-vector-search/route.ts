import { NextRequest, NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/services/vector_search';
import { buildPineconeFilter, logFilterExpression } from '@/lib/utils/pinecone-filters';
import { LIMITS, badRequest, rateLimit, serverError } from '@/lib/utils/api-guard';

export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'search');
	if (limited) return limited;

	try {
		// Parse the request body
		const body = await request.json();
		const { 
			query, 
			topK = 10,
			filters = {} // New: filter metadata
		} = body;

		// Validate required parameters
		if (!query || typeof query !== 'string') {
			return badRequest('Query parameter is required');
		}

		if (query.length > LIMITS.MAX_QUERY_CHARS) {
			return badRequest(`Query must be under ${LIMITS.MAX_QUERY_CHARS} characters`);
		}

		const requestedTopK = Number(topK);
		if (!Number.isInteger(requestedTopK) || requestedTopK < 1 || requestedTopK > LIMITS.MAX_TOP_K) {
			return badRequest(`topK must be a whole number from 1 to ${LIMITS.MAX_TOP_K}`);
		}

		// Build Pinecone metadata filter expression from user filters
		const pineconeFilter = buildPineconeFilter(filters);
		logFilterExpression(filters, pineconeFilter);

		// Use the searchPinecone function with reranking enabled and filters
		const { results } = await searchPinecone(query, requestedTopK, true, pineconeFilter);


		// Define interfaces for nodes and edges
		interface Node {
			id: string;
			label: string;
			score: number;
			similarity: number;
			category: string;
			type: string;
			summary: string;
			content: string;
			continent: string;
			country: string;
			sourceType: string;
			size: number;
			url?: string;
			tags?: string[];
		}

		interface Edge {
			id: string;
			source: string;
			target: string;
			label: string;
			type: string;
			weight: number;
		}

		// Process the results based on the v6.1.2 searchRecords response format
		let nodes: Node[] = [];
		let edges: Edge[] = [];

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
					category: data.category || '',
					type: data.type || '',
					summary: data.summary || '',
					content: data.content?.substring(0, 200) || '',
					continent: data.continent || '',
					country: data.country || '',
					sourceType: data.sourceType || '',
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
		return NextResponse.json({
			nodes,
			edges,
			rawResponse: results, // Include raw response for processApiResponse
		});
	} catch (error) {
		return serverError('reranked-vector-search', error, 'Search failed');
	}
}

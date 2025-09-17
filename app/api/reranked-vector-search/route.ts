import { NextRequest, NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/services/vector_search';

export async function POST(request: NextRequest) {
	try {
		// Parse the request body
		const body = await request.json();
		const { query, topK = 10 } = body;

		// Validate required parameters
		if (!query) {
			return NextResponse.json(
				{ error: 'Query parameter is required' },
				{ status: 400 }
			);
		}

		// Log search request
		console.log(
			`Executing reranked vector search for query: "${query}" with topK=${topK}`
		);

		// Use the searchPinecone function with reranking enabled
		const { results } = await searchPinecone(query, topK, true);

		// Log the results structure to understand the format
		// console.log('Results structure:', JSON.stringify(results, null, 2));

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

		// Check if results exists and has matches
		if (
			responseData &&
			responseData.matches &&
			Array.isArray(responseData.matches)
		) {
			// Get all node IDs first to create a lookup set
			// This is similar to the Python example's all_node_ids set
			const allNodeIds = new Set<string>();
			responseData.matches.forEach((match: any) => {
				allNodeIds.add(match.id);
			});

			// First, create all nodes from the matches
			nodes = responseData.matches.map((match: any) => ({
				id: match.id,
				label: match.metadata?.label || match.id,
				score: match.score,
				similarity: match.score, // For compatibility with existing code
				category: match.metadata?.category || '',
				type: match.metadata?.type || '',
				summary: match.metadata?.summary || '',
				content: match.metadata?.content?.substring(0, 200) || '',
				continent: match.metadata?.continent || '',
				country: match.metadata?.country || '',
				sourceType: match.metadata?.sourceType || '',
				size: match.score * 10, // Scale score for node size
			}));

			// Then create edges based on connected_to field
			// This is similar to the Python example's edge creation logic
			responseData.matches.forEach((match: any) => {
				const connectedTo = match.metadata?.connected_to || [];
				if (Array.isArray(connectedTo)) {

					connectedTo.forEach((targetId: string) => {
						// Only create edges to nodes that are in our result set
						// This matches the Python example's check: if target_id in all_node_ids
						if (allNodeIds.has(targetId)) {
							const edgeId = `${match.id}-${targetId}`;
							edges.push({
								id: edgeId,
								source: match.id,
								target: targetId,
								label: `${match.metadata?.label || match.id} → ${targetId}`,
								type: 'connected',
								weight: 1,
							});
						}
					});
				}
			});

			// Only print the nodes and edges being created
			console.log('Nodes created:', JSON.stringify(nodes, null, 2));
			console.log('Edges created:', JSON.stringify(edges, null, 2));
		} else {
			console.log('No matches found or unexpected results format');
		}

		// Return the search results
		return NextResponse.json({
			success: true,
			nodes: nodes,
			edges: edges,
			rawResponse: results,
		});
	} catch (error: any) {
		console.error('Vector search API error:', error);

		return NextResponse.json(
			{
				error: 'Error processing vector search',
				message: error.message,
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

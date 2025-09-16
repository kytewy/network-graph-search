/**
 * Pinecone client service for vector search operations
 * Updated to use official Pinecone JavaScript SDK v6.1.2 with integrated embeddings
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Environment variable handling
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'network-graph';
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || ''; // Add this to your env variables
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || 'example-namespace';

// Types for Pinecone responses
export interface PineconeSearchResult {
	id: string;
	score: number;
	fields: {
		chunk_text?: string;
		category?: string;
		label?: string;
		type?: string;
		summary?: string;
		content?: string;
		continent?: string;
		country?: string;
		sourceType?: string;
		[key: string]: any;
	};
}

/**
 * Search Pinecone index using SDK v6.1.2 features
 * @param query Search query text
 * @param topK Number of results to return
 * @param useReranking Whether to use reranking
 * @param filters Optional metadata filters
 * @returns Search results
 */
export async function searchPinecone(
	query: string,
	topK: number = 10,
	useReranking: boolean = true,
	filters?: Record<string, any>
) {
	try {
		// Check if API key exists
		if (!PINECONE_API_KEY) {
			throw new Error('PINECONE_API_KEY is not set');
		}
		
		// Initialize Pinecone client
		const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

		// Log the search request
		console.log(`Executing search for query: "${query}" with topK=${topK}`);

		// Get the index and namespace using the pattern from the documentation
		// Note: If PINECONE_INDEX_HOST is empty, it will use the default host
		const index = PINECONE_INDEX_HOST ? 
			pc.index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST) : 
			pc.index(PINECONE_INDEX_NAME);
		
		// Get the namespace
		const namespace = index.namespace(PINECONE_NAMESPACE);

		// Log the query parameters
		console.log('Searching with params:', {
			query,
			topK,
			namespace: PINECONE_NAMESPACE,
			indexName: PINECONE_INDEX_NAME
		});

		// Search using the exact pattern from the documentation
		const response = await namespace.searchRecords({
			query: {
				topK,
				inputs: { text: query },
			},
			fields: ['chunk_text', 'category', 'label', 'type', 'summary', 'content'],
		});

		// Log the results for debugging
		console.log('Search results structure:', JSON.stringify(response, null, 2));

		return { results: response };
	} catch (error) {
		console.error('Error searching Pinecone:', error);
		throw new Error(`Pinecone search failed: ${error}`);
	}
}

// End of file

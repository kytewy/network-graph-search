import { debugLog } from '@/lib/utils/debug';
/**
 * Pinecone client service for vector search operations
 * Updated to use official Pinecone JavaScript SDK v6.1.2 with integrated embeddings
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { passagesNamespace } from '@/lib/passages/passages.mjs';

// Not exported from the package root, so derive it from the client
type SearchRecordsOptions = Parameters<ReturnType<Pinecone['index']>['searchRecords']>[0];

// Environment variable handling
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'network-graph';
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || ''; // Add this to your env variables
const PINECONE_NAMESPACE =
	process.env.PINECONE_NAMESPACE || 'example-namespace';

/**
 * Reranking settings. The vector search over-fetches candidates, then a
 * hosted reranker reorders them and keeps the top `topK`.
 * Pinecone-hosted rerankers accept at most 100 documents per request.
 */
export const RERANK = {
	model: process.env.PINECONE_RERANK_MODEL || 'bge-reranker-v2-m3',
	minCandidates: 40,
	maxCandidates: 100,
} as const;

const SEARCH_FIELDS = [
	'chunk_text',
	'label',
	'summary',
	'content',
	'continent',
	'country',
	'publisher',
	'documentType',
	'connected_to',
	'url',
	'embedding',
	'tags',
];

/** Builds the searchRecords request, with a rerank block when reranking is on. */
export function buildSearchRequest(
	query: string,
	topK: number,
	useReranking: boolean,
	filters?: Record<string, any>
): SearchRecordsOptions {
	const candidates = useReranking
		? Math.min(RERANK.maxCandidates, Math.max(RERANK.minCandidates, topK * 2))
		: topK;

	const request: SearchRecordsOptions = {
		query: { topK: candidates, inputs: { text: query } },
		fields: SEARCH_FIELDS,
	};

	if (filters && Object.keys(filters).length > 0) {
		request.query.filter = filters;
	}

	if (useReranking) {
		request.rerank = {
			model: RERANK.model,
			topN: topK,
			rankFields: ['chunk_text'],
			// Long articles exceed the reranker's input limit; cut them instead of failing
			parameters: { truncate: 'END' },
		};
	}

	return request;
}

// Types for Pinecone responses
export interface PineconeSearchResult {
	id: string;
	score: number;
	fields: {
		chunk_text?: string;
		label?: string;
		summary?: string;
		content?: string;
		continent?: string;
		country?: string;
		publisher?: string;
		documentType?: string;
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
		if (!PINECONE_API_KEY) {
			throw new Error('PINECONE_API_KEY is not set');
		}

		// Initialize Pinecone client
		const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

		// Get the index and namespace using the pattern from the documentation
		// Note: If PINECONE_INDEX_HOST is empty, it will use the default host
		const index = PINECONE_INDEX_HOST
			? pc.index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST)
			: pc.index(PINECONE_INDEX_NAME);

		// Get the namespace
		const namespace = index.namespace(PINECONE_NAMESPACE);

		const searchQuery = buildSearchRequest(query, topK, useReranking, filters);
		debugLog('[Vector Search] Request:', JSON.stringify(searchQuery));

		const response = await namespace.searchRecords(searchQuery);

		return { results: response };
	} catch (error) {
		console.error('Error searching Pinecone:', error);
		throw new Error(`Pinecone search failed: ${error}`);
	}
}

function pineconeIndex() {
	if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is not set');
	const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
	return PINECONE_INDEX_HOST ? pc.index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST) : pc.index(PINECONE_INDEX_NAME);
}

/**
 * Searches the passages (their own namespace, see lib/passages) with the same reranker, asking for
 * a few per document so each result can say how many matched. Returns [] when there are none yet.
 */
export async function searchPassages(query: string, topK: number, filters?: Record<string, any>) {
	// Tags live only on document records, so a tag filter can't apply to passages
	if (filters && JSON.stringify(filters).includes('"tags"')) return [];
	const candidates = Math.min(RERANK.maxCandidates, Math.max(RERANK.minCandidates, topK * 3));
	const request: SearchRecordsOptions = {
		query: { topK: candidates, inputs: { text: query }, ...(filters && Object.keys(filters).length ? { filter: filters } : {}) },
		fields: ['chunk_text', 'document_id', 'position', 'heading', 'start'],
		rerank: { model: RERANK.model, topN: candidates, rankFields: ['chunk_text'], parameters: { truncate: 'END' } },
	};
	try {
		const response = await pineconeIndex().namespace(passagesNamespace()).searchRecords(request);
		return response.result?.hits ?? [];
	} catch (error) {
		// Passages not indexed yet (or the namespace is missing): search works as before
		debugLog('[Vector Search] Passage search skipped:', String(error));
		return [];
	}
}

/** Document records by id, for documents that only their passages found */
export async function fetchDocuments(ids: string[]) {
	if (ids.length === 0) return [];
	const response = await pineconeIndex().namespace(PINECONE_NAMESPACE).fetch(ids);
	return Object.entries(response.records ?? {}).map(([id, record]) => ({ _id: id, metadata: record.metadata ?? {} }));
}

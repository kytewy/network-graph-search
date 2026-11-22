/**
 * The one place a Pinecone search result becomes a document (and a link).
 * The search route uses these; the app uses the route's documents as they
 * arrive, so every part of the app sees the same document.
 *
 * Adding a document field: add it to `apiNodeSchema` in ./search.ts and
 * read it here. The type checker points to anything else that needs it.
 */
import { COUNTRY_CONTINENT_MAP } from '@/lib/stores/country_map';
import type { ApiEdge, ApiNode } from './search';

/** A search result as Pinecone returns it (integrated or older format). */
export interface PineconeHit {
	_id?: string;
	id?: string;
	_score?: number;
	score?: number;
	fields?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const hitId = (hit: PineconeHit) => hit._id || hit.id || '';
const hitFields = (hit: PineconeHit) => hit.fields || hit.metadata || {};

export function toApiNode(hit: PineconeHit): ApiNode {
	const data = hitFields(hit);
	const id = hitId(hit);
	const score = hit._score ?? hit.score ?? 0;
	const country = text(data.country);
	const url = text(data.url);

	return {
		id,
		label: text(data.label) || id,
		score,
		similarity: score,
		publisher: text(data.publisher),
		documentType: text(data.documentType),
		summary: text(data.summary),
		// The full text: the reading view and AI analysis need all of it
		content: text(data.content),
		country,
		// Older records have no continent; work it out from the country
		continent: text(data.continent) || COUNTRY_CONTINENT_MAP[country] || '',
		size: score * 10,
		...(url ? { url } : {}),
		tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : [],
	};
}

/** Links from each document's `connected_to`, kept only within these results. */
export function toApiEdges(hits: readonly PineconeHit[]): ApiEdge[] {
	const ids = new Set(hits.map(hitId));
	return hits.flatMap((hit) => {
		const data = hitFields(hit);
		const source = hitId(hit);
		const targets = Array.isArray(data.connected_to) ? data.connected_to : [];
		return targets
			.filter((target): target is string => typeof target === 'string' && ids.has(target))
			.map((target) => ({
				id: `${source}-${target}`,
				source,
				target,
				label: `${text(data.label) || source} → ${target}`,
				type: 'connected',
				weight: 1,
			}));
	});
}

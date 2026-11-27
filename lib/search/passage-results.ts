/**
 * Search by passage: passage hits grouped back into one result per document, and merged with the
 * document hits. Pure functions, so the route stays short and this is easy to test.
 */
import type { PineconeHit } from '@/lib/contracts/node';
import type { PassageMatch } from '@/lib/contracts/search';

/** A document's key sections: at most this many of its passages travel with it */
export const PASSAGES_PER_DOCUMENT = 3;

/** A passage is "key" when it scores at least this share of the document's best passage */
export const STRONG_SHARE = 0.5;

const fieldsOf = (hit: PineconeHit) => hit.fields ?? hit.metadata ?? {};
const scoreOf = (hit: PineconeHit) => hit._score ?? hit.score ?? 0;

/** Passage hits → each document's key sections (strong ones only, at most three), best first */
export function groupPassages(hits: readonly PineconeHit[]): Map<string, { matches: number; passages: PassageMatch[] }> {
	const groups = new Map<string, { matches: number; passages: PassageMatch[] }>();
	for (const hit of hits) {
		const f = fieldsOf(hit);
		const documentId = typeof f.document_id === 'string' ? f.document_id : null;
		if (!documentId) continue;
		const chunk = typeof f.chunk_text === 'string' ? f.chunk_text : '';
		const group = groups.get(documentId) ?? { matches: 0, passages: [] };
		group.matches++;
		group.passages.push({
			position: Number(f.position ?? 0),
			heading: typeof f.heading === 'string' ? f.heading : null,
			start: Number(f.start ?? 0),
			// The search copy starts "Title · Heading" on its own line; the passage is the rest
			text: chunk.includes('\n') ? chunk.slice(chunk.indexOf('\n') + 1) : chunk,
			score: scoreOf(hit),
		});
		groups.set(documentId, group);
	}
	for (const group of groups.values()) {
		group.passages.sort((a, b) => b.score - a.score);
		const best = group.passages[0]?.score ?? 0;
		group.passages = group.passages.filter((p) => p.score >= best * STRONG_SHARE).slice(0, PASSAGES_PER_DOCUMENT);
		// Only the key sections count: "3 key sections", never "44 matches"
		group.matches = group.passages.length;
	}
	return groups;
}

/**
 * The documents to show, best first: each scores its document hit or its best passage, whichever is
 * higher, so a document whose key rule sits deep inside still ranks. Returns ids and scores; the
 * caller fetches any document that only its passages found.
 */
export function rankDocuments(docHits: readonly PineconeHit[], groups: ReturnType<typeof groupPassages>, topK: number) {
	const scores = new Map<string, number>();
	for (const hit of docHits) scores.set(hit._id ?? hit.id ?? '', scoreOf(hit));
	for (const [id, g] of groups) scores.set(id, Math.max(scores.get(id) ?? 0, g.passages[0]?.score ?? 0));
	return [...scores].filter(([id]) => id).sort((a, b) => b[1] - a[1]).slice(0, topK);
}

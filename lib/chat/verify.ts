/**
 * Checking an answer's citations: a document the answer cites but the AI
 * only got an excerpt of (under half) is read in full, and the AI keeps,
 * fixes or removes each claim that rests on it before the answer is shown.
 */
import { findCitations, matchCitation } from './citations';
import { sentDocument, sentShare } from './receipt';
import { WEAK_SHARE } from './coverage';

type DocInput = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** The cited documents that need a full read: cut to an excerpt (or sent as a summary) and not read yet */
export function citationsToCheck(answer: string, nodes: readonly DocInput[], read: ReadonlyMap<string, number>): { id: string; title: string }[] {
	const docs = nodes.map((n) => ({ id: str(n.id), label: str(n.name) || str(n.id) }));
	const ids = new Set<string>();
	for (const name of findCitations(answer)) {
		const doc = matchCitation(name, docs);
		if (doc) ids.add(doc.id);
	}
	return nodes
		.filter((n) => ids.has(str(n.id)) && !read.has(str(n.id)))
		.filter((n) => (sentShare(sentDocument(n)) ?? 0) < WEAK_SHARE)
		.map((n) => ({ id: str(n.id), title: str(n.name) || str(n.label) || str(n.id) }));
}

/** The request that follows the full texts: check the draft against them */
export function checkInstruction(titles: readonly string[]): string {
	return (
		`You have now read the full text of documents your answer cites: ${titles.map((t) => `[${t}]`).join(', ')}. ` +
		'Check every claim that cites them against the full text. Keep what holds, fix what does not, and remove a citation ' +
		'that does not support its claim. Reply with the complete corrected answer only, in the same format, citing titles in brackets.'
	);
}

/**
 * Coverage: which of the documents sent with a question the answer actually
 * cites, and which citations deserve a second look.
 */
import { findCitations, matchCitation } from './citations';
import { sentShare, type Receipt, type SentDocument } from './receipt';

/** A cited document the AI saw less than this share of counts as mostly unsent */
export const WEAK_SHARE = 0.5;

export interface Coverage {
	cited: SentDocument[];
	notCited: SentDocument[];
	/** Cited, but the AI saw under half of it, or only its summary */
	weak: SentDocument[];
	/** Names in [brackets] that match no document sent: possibly made up */
	unmatched: string[];
}

export function coverage(answer: string, receipt: Receipt): Coverage {
	const docs = receipt.documents.map((d) => ({ id: d.id, label: d.title }));
	const citedIds = new Set<string>();
	const unmatched: string[] = [];
	for (const name of findCitations(answer)) {
		const doc = matchCitation(name, docs);
		if (doc) citedIds.add(doc.id);
		else unmatched.push(name);
	}
	const cited = receipt.documents.filter((d) => citedIds.has(d.id));
	return {
		cited,
		notCited: receipt.documents.filter((d) => !citedIds.has(d.id)),
		weak: cited.filter((d) => (sentShare(d) ?? 0) < WEAK_SHARE),
		unmatched,
	};
}

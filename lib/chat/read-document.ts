/**
 * The read_document tool: the AI skims each document's excerpt or summary,
 * then asks for the full text of the few it needs. The text is already in
 * the request (each search result carries it), so no lookup is needed.
 */
import { matchCitation } from './citations';

export const READ_LIMITS = {
	/** Full text the AI may read for one answer, in tokens (about 4 characters each) */
	BUDGET_TOKENS: 50_000,
	/** Most characters of one document's text, so one long document can't use up the budget */
	MAX_CHARS: 12_000,
	/** Rounds of reading before the AI must answer */
	MAX_ROUNDS: 4,
} as const;
export const BUDGET_CHARS = READ_LIMITS.BUDGET_TOKENS * 4;

export const READ_TOOL = {
	type: 'function' as const,
	function: {
		name: 'read_document',
		description:
			'Read the full text of one listed document when its excerpt or summary is not enough to answer well. ' +
			'Read what the question needs, then answer; reading is limited, so pick the documents that matter.',
		parameters: {
			type: 'object',
			properties: { title: { type: 'string', description: 'The document title exactly as listed in bold brackets' } },
			required: ['title'],
		},
	},
};

/** Characters read so far for this answer */
export const charsRead = (read: ReadonlyMap<string, number>) => [...read.values()].reduce((n, c) => n + c, 0);

/** Sent to the browser as each document is opened, so it can show "Reading…" */
export interface ReadingEvent {
	id: string;
	title: string;
	round: number;
}

type DocInput = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** The document a title names, and its full text (cut to the limit) */
export function findDocument(title: string, nodes: readonly DocInput[]): { id: string; text: string } | null {
	const docs = nodes.map((n) => ({ id: str(n.id), label: str(n.name) || str(n.id) }));
	const doc = matchCitation(title, docs);
	if (!doc) return null;
	const node = nodes.find((n) => str(n.id) === doc.id)!;
	const text = str(node.content) || str(node.text) || str(node.summary);
	return { id: doc.id, text: text.slice(0, READ_LIMITS.MAX_CHARS) };
}

/**
 * Answers one read_document call and records what was read. Once the budget
 * is spent, the AI is told so and the refusal is counted for the receipt.
 */
export function serveRead(
	argumentsJson: string,
	nodes: readonly DocInput[],
	read: Map<string, number>,
	refused: { count: number }
): string {
	let title = '';
	try {
		title = str(JSON.parse(argumentsJson)?.title);
	} catch {
		// fall through: no title
	}
	const doc = title ? findDocument(title, nodes) : null;
	if (!doc) return 'No document with that title is in the list.';
	if (read.has(doc.id)) return 'You have already read this document above.';
	const left = BUDGET_CHARS - charsRead(read);
	if (left <= 0) {
		refused.count++;
		return 'The reading budget for this answer is used up. Answer from what you have.';
	}
	const text = doc.text.slice(0, left);
	read.set(doc.id, text.length);
	return text || 'This document has no text beyond its title.';
}

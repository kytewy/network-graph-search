/**
 * The receipt for one chat answer: exactly what went to the AI. The server
 * builds it from the request it sends, so it can't drift from reality.
 *
 * Safe to import in the browser: no server-only code here.
 */
import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';

/** How a document's words reached the AI */
export type SentAs = 'summary' | 'text' | 'title';

export interface SentDocument {
	id: string;
	title: string;
	sentAs: SentAs;
	/** Characters sent */
	sent: number;
	/** Characters available in what was sent from (summary or text) */
	total: number;
}

export interface Receipt {
	model: string;
	contextWindow: number;
	/** Rough count of everything sent: documents, instructions, memory */
	tokens: number;
	/** Most characters sent per document */
	charLimit: number;
	documents: SentDocument[];
	/** The question as typed; none = the default analysis prompt */
	question?: string;
	goal?: string;
	/** Whether the list of suggestion options went along */
	suggestions: boolean;
	/** Earlier question-and-answer pairs sent for follow-ups */
	memoryTurns: number;
}

type DocInput = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** How one document is sent, mirroring the prompt builder's choice of text */
export function sentDocument(node: DocInput, charLimit: number = PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS): SentDocument {
	const summary = str(node.summary), content = str(node.content), name = str(node.name);
	const text = str(node.text) || content || summary || name;
	const sentAs: SentAs = !text || (text === name && text !== summary && text !== content) ? 'title' : text === summary ? 'summary' : 'text';
	return { id: str(node.id), title: name || str(node.id), sentAs, sent: Math.min(text.length, charLimit), total: text.length };
}

export function buildReceipt(input: {
	nodes: DocInput[];
	messages: { content: string }[];
	question?: string;
	goal?: string;
	suggestions: boolean;
	memoryTurns: number;
}): Receipt {
	const chars = input.messages.reduce((n, m) => n + m.content.length, 0);
	return {
		model: PROMPT_CONFIG.MODEL,
		contextWindow: PROMPT_CONFIG.CONTEXT_WINDOW_TOKENS,
		tokens: Math.ceil(chars / 4),
		charLimit: PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS,
		documents: input.nodes.map((n) => sentDocument(n)),
		question: input.question?.trim() || undefined,
		goal: input.goal?.trim() || undefined,
		suggestions: input.suggestions,
		memoryTurns: input.memoryTurns,
	};
}

/** Documents that were cut to the character limit */
export const cutCount = (r: Receipt) => r.documents.filter((d) => d.total > d.sent).length;

/** "Summary · 800 of 4,200 characters · cut" */
export function describeSent(d: SentDocument): string {
	const how = d.sentAs === 'summary' ? 'Summary' : d.sentAs === 'text' ? 'Document text' : 'Title only';
	if (d.sentAs === 'title') return how;
	const n = (x: number) => x.toLocaleString('en-US');
	return d.total > d.sent ? `${how} · ${n(d.sent)} of ${n(d.total)} characters · cut` : `${how} · ${n(d.sent)} characters`;
}

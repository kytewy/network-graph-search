import {
	PROMPT_CONFIG,
	buildAnalyzeNodesPrompt,
	formatNodesForPrompt,
	type AnalyzeNodesParams,
} from '@/lib/prompts/analysis-prompts';

type AnalysisNode = AnalyzeNodesParams['nodes'][number];

/** The fields of a context node the analysis uses. */
export interface ContextNodeLike {
	id: string;
	label?: string;
	summary?: string;
	content?: string;
	country?: string;
	publisher?: string;
	documentType?: string;
}

/**
 * The words the chat sends for one document: the whole text when it fits the
 * per-document limit; otherwise a real summary (not just the title repeated,
 * as EU recitals have); otherwise the start of the text.
 */
export function analysisText(node: ContextNodeLike): string {
	const content = node.content?.trim();
	const summary = node.summary?.trim();
	if (content && content.length <= PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS) return content;
	const realSummary = summary && summary !== node.label?.trim() ? summary : undefined;
	return realSummary || content || summary || 'No content available';
}

/**
 * The node as the chat sends it to /api/analyze-nodes. The chat and the
 * token counter both use this, so the count matches what's sent.
 */
export function toAnalysisNode(node: ContextNodeLike): AnalysisNode {
	return {
		id: node.id,
		name: node.label,
		documentType: node.documentType,
		text: analysisText(node),
		content: node.content,
		summary: node.summary,
		country: node.country,
		publisher: node.publisher,
	};
}

/** Rough token count for English text: about 4 characters per token. */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/** Tokens one node adds to the prompt: its 800-character excerpt plus its labels. */
export function nodeTokens(node: ContextNodeLike): number {
	return estimateTokens(formatNodesForPrompt([toAnalysisNode(node)]));
}

/** Tokens of the whole analysis prompt for these nodes, instructions included. */
export function contextTokens(nodes: readonly ContextNodeLike[]): number {
	if (nodes.length === 0) return 0;
	return estimateTokens(
		buildAnalyzeNodesPrompt({
			nodes: nodes.map(toAnalysisNode),
			charLimitPerDoc: PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS,
		})
	);
}

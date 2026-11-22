/**
 * @vitest-environment node
 */

/**
 * The token counter must measure exactly what the chat sends to the AI:
 * an excerpt per node (first 800 characters) inside the analysis prompt.
 */

import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { LIMITS } from '@/lib/utils/api-guard';
import { contextTokens, estimateTokens, nodeTokens, toAnalysisNode } from '@/lib/utils/llm-tokens';

const node = (extra: Record<string, unknown>) =>
	({ id: 'A50', label: 'Article 50', publisher: 'Government', documentType: 'Law', country: 'European Union', ...extra } as any);

describe('toAnalysisNode (what the chat sends)', () => {
	// Search results never carried a separate full text (fields.full_text), so
	// the summary comes first, then the document's text
	it('prefers summary, then content', () => {
		expect(toAnalysisNode(node({ summary: 'S', content: 'C' })).text).toBe('S');
		expect(toAnalysisNode(node({ content: 'C' })).text).toBe('C');
		expect(toAnalysisNode(node({})).text).toBe('No content available');
	});

	it('carries the name and metadata the prompt shows', () => {
		expect(toAnalysisNode(node({ summary: 'S' }))).toMatchObject({
			id: 'A50',
			name: 'Article 50',
			publisher: 'Government',
			documentType: 'Law',
			country: 'European Union',
		});
	});
});

describe('nodeTokens', () => {
	it('counts a summary-only node (it used to read 0)', () => {
		expect(nodeTokens(node({ summary: 'A'.repeat(400) }))).toBeGreaterThan(100);
	});

	it('counts only the 800-character excerpt the AI receives', () => {
		const huge = nodeTokens(node({ content: 'x'.repeat(50_000) }));
		const excerpt = nodeTokens(node({ content: 'x'.repeat(PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS) }));
		expect(huge).toBeLessThanOrEqual(excerpt + 1);
		expect(huge).toBeLessThan(400);
	});
});

describe('contextTokens', () => {
	it('is zero with no nodes', () => {
		expect(contextTokens([])).toBe(0);
	});

	it('includes the prompt instructions on top of the nodes', () => {
		const nodes = [node({ summary: 'one' }), node({ id: 'A51', summary: 'two' })];
		expect(contextTokens(nodes)).toBeGreaterThan(nodeTokens(nodes[0]) + nodeTokens(nodes[1]));
	});
});

describe('limits', () => {
	it('uses the real model limits, shared with the API route', () => {
		expect(PROMPT_CONFIG.MODEL).toBe('gpt-4o-mini');
		expect(PROMPT_CONFIG.CONTEXT_WINDOW_TOKENS).toBe(128_000);
		expect(LIMITS.MAX_NODES_LLM).toBe(PROMPT_CONFIG.MAX_NODES_PER_REQUEST);
		expect(estimateTokens('abcd'.repeat(10))).toBe(10);
	});
});

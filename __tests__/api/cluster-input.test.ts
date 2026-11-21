/**
 * @jest-environment node
 */

/**
 * Clustering input mapping
 *
 * Regression test for a bug where the UI sent document text as `text`
 * but the route only kept `content`, so clustering ran on titles alone.
 */

import { toClusterInput } from '@/lib/clustering/input';
import { LIMITS } from '@/lib/utils/api-guard';

describe('toClusterInput', () => {
	it('keeps document text sent as `content`', () => {
		const [node] = toClusterInput([
			{ id: 'A1', label: 'Article 1', content: 'Rules for high-risk AI systems' },
		]);
		expect(node.content).toBe('Rules for high-risk AI systems');
	});

	it('uses `text` when `content` is missing', () => {
		const [node] = toClusterInput([
			{ id: 'A1', label: 'Article 1', text: 'Rules for high-risk AI systems' },
		]);
		expect(node.content).toBe('Rules for high-risk AI systems');
	});

	it('prefers `content` over `text` when both are present', () => {
		const [node] = toClusterInput([
			{ id: 'A1', label: 'Article 1', content: 'full text', text: 'other text' },
		]);
		expect(node.content).toBe('full text');
	});

	it('truncates long text and drops non-string values', () => {
		const [node] = toClusterInput([
			{ id: 'A1', label: 42, content: 'x'.repeat(LIMITS.MAX_CONTENT_CHARS + 10) },
		]);
		expect(node.content).toHaveLength(LIMITS.MAX_CONTENT_CHARS);
		expect(node.label).toBe('');
	});

	it('keeps only the fields the analyzer reads', () => {
		const [node] = toClusterInput([
			{ id: 'A1', label: 'L', content: 'C', summary: 'S', type: 'article', secret: 'x' },
		]);
		expect(Object.keys(node).sort()).toEqual(['content', 'id', 'label', 'summary', 'type']);
	});
});

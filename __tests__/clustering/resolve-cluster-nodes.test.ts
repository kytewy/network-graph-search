/**
 * @jest-environment node
 */

import { resolveClusterNodes } from '@/lib/clustering/resolve-cluster-nodes';

const node = (id: string, label: string) => ({ id, label } as any);

describe('resolveClusterNodes', () => {
	it('turns cluster ids into titled nodes, in cluster order', () => {
		const result = resolveClusterNodes(['R1', 'A50'], [node('A50', 'Article 50'), node('R1', 'Recital 1')]);
		expect(result.map((r) => [r.id, r.label])).toEqual([
			['R1', 'Recital 1'],
			['A50', 'Article 50'],
		]);
	});

	it('falls back to the context nodes, then to the bare id', () => {
		const result = resolveClusterNodes(['A1', 'A2', 'GONE'], [node('A1', 'Shown')], [node('A2', 'In context')]);
		expect(result).toEqual([
			{ id: 'A1', label: 'Shown', node: expect.objectContaining({ id: 'A1' }) },
			{ id: 'A2', label: 'In context', node: expect.objectContaining({ id: 'A2' }) },
			{ id: 'GONE', label: 'GONE', node: undefined },
		]);
	});
});

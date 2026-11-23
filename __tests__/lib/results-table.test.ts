import { nextSort, sortRows, type ResultRow } from '@/lib/search/results-table';
import type { Node } from '@/lib/config/types';

const row = (label: string, score: number, cluster: string | null, inContext = false): ResultRow => ({
	node: { id: label, label, score } as Node,
	cluster,
	inContext,
});

const rows = [row('Beta', 0.5, 'Finance'), row('Alpha', 0.9, null, true), row('Gamma', 0.7, 'EU rules')];
const labels = (r: ResultRow[]) => r.map((x) => x.node.label);

describe('sortRows', () => {
	it('sorts by score, best first', () => {
		expect(labels(sortRows(rows, 'score', 'desc'))).toEqual(['Alpha', 'Gamma', 'Beta']);
	});

	it('sorts by title A to Z', () => {
		expect(labels(sortRows(rows, 'title', 'asc'))).toEqual(['Alpha', 'Beta', 'Gamma']);
	});

	it('puts rows without a cluster last, either way', () => {
		expect(labels(sortRows(rows, 'cluster', 'asc'))).toEqual(['Gamma', 'Beta', 'Alpha']);
		expect(labels(sortRows(rows, 'cluster', 'desc'))).toEqual(['Beta', 'Gamma', 'Alpha']);
	});

	it('puts documents in context first, then by score', () => {
		expect(labels(sortRows(rows, 'context', 'desc'))).toEqual(['Alpha', 'Gamma', 'Beta']);
	});
});

describe('nextSort', () => {
	it('flips the column you are on, and starts a new one at its default', () => {
		expect(nextSort({ key: 'score', direction: 'desc' }, 'score')).toEqual({ key: 'score', direction: 'asc' });
		expect(nextSort({ key: 'score', direction: 'desc' }, 'title')).toEqual({ key: 'title', direction: 'asc' });
	});
});

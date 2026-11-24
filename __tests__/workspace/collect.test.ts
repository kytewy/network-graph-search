import { foundBy, groupBySearch, hasRound, makeRound, mergeResults, roundTopIds, searchGroup, stampRounds } from '@/lib/workspace/collect';
import type { Link, Node } from '@/lib/config/types';

const doc = (id: string, score: number) => ({ id, label: id, score }) as Node;
const link = (source: string, target: string) => ({ id: `${source}-${target}`, source, target }) as Link;

describe('mergeResults', () => {
	it('keeps each document once, with its best score', () => {
		const { nodes } = mergeResults(
			{ nodes: [doc('a', 0.9), doc('b', 0.5)], links: [] },
			{ nodes: [doc('b', 0.7), doc('c', 0.6)], links: [] }
		);
		expect(nodes.map((d) => [d.id, d.score])).toEqual([
			['a', 0.9],
			['b', 0.7],
			['c', 0.6],
		]);
	});

	it('keeps the better score when the new search scores lower', () => {
		const { nodes } = mergeResults({ nodes: [doc('a', 0.9)], links: [] }, { nodes: [doc('a', 0.2)], links: [] });
		expect(nodes[0].score).toBe(0.9);
	});

	it('keeps each link once, whichever way round it points', () => {
		const { links } = mergeResults({ nodes: [], links: [link('a', 'b')] }, { nodes: [], links: [link('b', 'a'), link('b', 'c')] });
		expect(links).toHaveLength(2);
	});
});

describe('rounds', () => {
	const r1 = makeRound(1, 'AI regulation', 50, [doc('a', 0.9), doc('b', 0.5)]);
	const r2 = makeRound(2, 'compliance', 50, [doc('b', 0.7), doc('c', 0.6)]);

	it('records which rounds found each document', () => {
		expect(foundBy([r1, r2])).toEqual({ a: [1], b: [1, 2], c: [2] });
	});

	it('each round keeps its own scores', () => {
		expect(r1.scores.b).toBe(0.5);
		expect(r2.scores.b).toBe(0.7);
	});

	it('spots a search that is already a round', () => {
		expect(hasRound([r1], '  ai REGULATION ', 50)).toBe(true);
		expect(hasRound([r1], 'AI regulation', 20)).toBe(false);
	});

	it('stamps found-by on each document and takes its best score; drops what no search found', () => {
		const nodes = [doc('a', 0), doc('b', 0), doc('c', 0), doc('gone', 0)];
		expect(stampRounds(nodes, [r1, r2]).map((d) => [d.id, d.foundBy, d.score])).toEqual([
			['a', [1], 0.9],
			['b', [1, 2], 0.7],
			['c', [2], 0.6],
		]);
		// Without search #2, b falls back to #1's score and c goes
		expect(stampRounds(nodes, [r1]).map((d) => [d.id, d.score])).toEqual([
			['a', 0.9],
			['b', 0.5],
		]);
	});
});

describe('searchGroup', () => {
	it('names the group a document clusters into', () => {
		const queries = { 1: 'AI regulation', 2: 'compliance' };
		expect(searchGroup([2], queries)).toBe('#2 compliance');
		expect(searchGroup([1, 2], queries)).toBe('Found by 2+ searches');
		expect(searchGroup(undefined, queries)).toBe('Other');
	});
});

describe('context by search', () => {
	const r1 = makeRound(1, 'AI regulation', 50, [doc('a', 0.9), doc('b', 0.5), doc('c', 0.7)]);
	const r2 = makeRound(2, 'compliance', 50, [doc('b', 0.7), doc('d', 0.6)]);

	it("lists a search's documents best first, or its top few", () => {
		expect(roundTopIds(r1)).toEqual(['a', 'c', 'b']);
		expect(roundTopIds(r1, 2)).toEqual(['a', 'c']);
	});

	it('groups context documents under the first search that found them, others last', () => {
		const groups = groupBySearch(['b', 'd', 'x'], [r1, r2]);
		expect(groups.map((g) => [g.round?.n ?? null, g.ids])).toEqual([
			[1, ['b']],
			[2, ['d']],
			[null, ['x']],
		]);
	});
});


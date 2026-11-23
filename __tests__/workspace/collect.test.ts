import { foundBy, hasRound, makeRound, mergeResults } from '@/lib/workspace/collect';
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
});

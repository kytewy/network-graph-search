/**
 * @vitest-environment node
 */

import { filterNodes } from '@/lib/filters/filter-nodes';
import type { Node } from '@/lib/config/types';

const node = (id: string, extra: Partial<Node>): Node =>
	({ id, label: id, score: 0.9, tags: [], ...extra } as Node);

const nodes = [
	node('eu-law', { continent: 'Europe', country: 'European Union', publisher: 'Government', score: 0.95 }),
	node('eu-firm', { continent: 'Europe', country: 'Germany', publisher: 'Law firm', tags: ['transparency'], score: 0.7 }),
	node('ca-reg', { continent: 'North America', country: 'Canada', publisher: 'Regulator', score: 0.5 }),
	node('us-ngo', { continent: 'North America', country: 'USA', publisher: 'NGO', tags: ['transparency'], score: 0.3 }),
];
const none = { continents: [], countries: [], tags: [], publishers: [], similarityRanges: [] };
const ids = (result: Node[]) => result.map((n) => n.id);

describe('filterNodes', () => {
	it('returns everything when nothing is selected', () => {
		expect(ids(filterNodes(nodes, none))).toEqual(['eu-law', 'eu-firm', 'ca-reg', 'us-ngo']);
	});

	it('matches a continent by the continent field, or a country, either way', () => {
		expect(ids(filterNodes(nodes, { ...none, continents: ['Europe'] }))).toEqual(['eu-law', 'eu-firm']);
		expect(ids(filterNodes(nodes, { ...none, continents: ['Europe'], countries: ['Canada'] }))).toEqual([
			'eu-law',
			'eu-firm',
			'ca-reg',
		]);
	});

	it('filters by publisher and by tag', () => {
		expect(ids(filterNodes(nodes, { ...none, publishers: ['Law firm', 'NGO'] }))).toEqual(['eu-firm', 'us-ngo']);
		expect(ids(filterNodes(nodes, { ...none, tags: ['transparency'] }))).toEqual(['eu-firm', 'us-ngo']);
	});

	it('combines different filters with AND', () => {
		expect(ids(filterNodes(nodes, { ...none, continents: ['Europe'], publishers: ['Law firm'] }))).toEqual([
			'eu-firm',
		]);
	});

	it('filters by similarity range', () => {
		expect(ids(filterNodes(nodes, { ...none, similarityRanges: ['81-100', '41-60'] }))).toEqual([
			'eu-law',
			'ca-reg',
		]);
	});

	it('never changes the input', () => {
		const copy = JSON.parse(JSON.stringify(nodes));
		filterNodes(nodes, { ...none, publishers: ['NGO'] });
		expect(nodes).toEqual(copy);
	});
});

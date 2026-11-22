import { toApiEdges, toApiNode } from '@/lib/contracts/node';
import { apiNodeSchema } from '@/lib/contracts/search';

const longText = 'word '.repeat(500);

describe('toApiNode', () => {
	it('turns a Pinecone result into a document the rulebook accepts', () => {
		const node = toApiNode({
			_id: 'osfi-e23',
			_score: 0.82,
			fields: {
				label: 'OSFI E-23',
				publisher: 'Regulator',
				documentType: 'Guidance',
				summary: 'Model risk',
				content: longText,
				country: 'Canada',
				url: 'https://osfi.ca',
				tags: ['model risk'],
			},
		});
		expect(apiNodeSchema.safeParse(node).success).toBe(true);
		expect(node).toMatchObject({
			id: 'osfi-e23',
			label: 'OSFI E-23',
			score: 0.82,
			similarity: 0.82,
			publisher: 'Regulator',
			documentType: 'Guidance',
			country: 'Canada',
			size: 8.2,
			tags: ['model risk'],
		});
	});

	it('keeps the full text, which the reading view and AI analysis need', () => {
		const node = toApiNode({ _id: 'a', _score: 1, fields: { content: longText } });
		expect(node.content).toBe(longText);
	});

	it('fills in the continent from the country when it is missing', () => {
		expect(toApiNode({ _id: 'a', fields: { country: 'Canada' } }).continent).toBe('North America');
		expect(toApiNode({ _id: 'a', fields: { country: 'Canada', continent: 'Elsewhere' } }).continent).toBe('Elsewhere');
	});

	it('uses safe defaults for missing fields, including the older metadata format', () => {
		expect(toApiNode({ id: 'b', score: 0.5, metadata: {} })).toEqual({
			id: 'b',
			label: 'b',
			score: 0.5,
			similarity: 0.5,
			publisher: '',
			documentType: '',
			summary: '',
			content: '',
			continent: '',
			country: '',
			size: 5,
			tags: [],
		});
	});
});

describe('toApiEdges', () => {
	it('links documents only to others in the same results', () => {
		const hits = [
			{ _id: 'a', fields: { label: 'Doc A', connected_to: ['b', 'not-in-results'] } },
			{ _id: 'b', fields: { label: 'Doc B' } },
		];
		expect(toApiEdges(hits)).toEqual([
			{ id: 'a-b', source: 'a', target: 'b', label: 'Doc A → b', type: 'connected', weight: 1 },
		]);
	});
});

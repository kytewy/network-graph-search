/**
 * @jest-environment node
 */

import { buildPineconeFilter } from '@/lib/utils/pinecone-filters';

describe('buildPineconeFilter', () => {
	it('matches either continent or country', () => {
		expect(buildPineconeFilter({ continents: ['Europe'], countries: ['Japan'] })).toEqual({
			$or: [{ continent: { $in: ['Europe'] } }, { country: { $in: ['Japan'] } }],
		});
	});

	it('combines geography and tags with $and', () => {
		expect(buildPineconeFilter({ continents: ['Europe'], tags: ['privacy'] })).toEqual({
			$and: [{ continent: { $in: ['Europe'] } }, { tags: { $in: ['privacy'] } }],
		});
	});

	it('never filters on score, which is not stored metadata', () => {
		const filters = { similarityRanges: ['81-100'] } as Record<string, unknown>;
		expect(buildPineconeFilter(filters)).toBeUndefined();
	});

	it('returns undefined when nothing is selected', () => {
		expect(buildPineconeFilter({})).toBeUndefined();
	});
});

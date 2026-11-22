import { FILTERS, emptySelections, selectionsFromStore } from '@/lib/config/filters';
import { buildPineconeFilter } from '@/lib/utils/pinecone-filters';
import { filterNodes } from '@/lib/filters/filter-nodes';
import { useAppStore } from '@/lib/stores/app-state';

const node = (extra: Record<string, unknown>) => ({ id: 'a', label: 'A', score: 0.9, size: 1, publisher: '', ...extra }) as any;

describe('filter registry', () => {
	it('lists each filter once, each with a store field that exists', () => {
		const ids = FILTERS.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
		const state = useAppStore.getState() as unknown as Record<string, unknown>;
		FILTERS.forEach((f) => expect(Array.isArray(state[f.storeKey])).toBe(true));
	});

	it('reads the current selections from the store', () => {
		useAppStore.setState({ selectedContinents: ['Europe'], selectedPublishers: ['Regulator'] });
		expect(selectionsFromStore(useAppStore.getState())).toMatchObject({
			continents: ['Europe'],
			publishers: ['Regulator'],
			countries: [],
		});
	});

	it('marks which filters Pinecone can apply (similarity is per search, so it cannot)', () => {
		expect(FILTERS.filter((f) => f.inPinecone).map((f) => f.id)).toEqual(['continents', 'countries', 'tags', 'publishers']);
		expect(buildPineconeFilter({ ...emptySelections(), similarityRanges: ['81-100'] })).toBeUndefined();
	});

	it('uses the similarity ranges from the search config', () => {
		const selected = { ...emptySelections(), similarityRanges: ['81-100'] };
		expect(filterNodes([node({ score: 0.9 }), node({ id: 'b', score: 0.3 })], selected).map((n) => n.id)).toEqual(['a']);
	});

	it('accepts filters a client sends, keeping only lists of text', () => {
		expect(buildPineconeFilter({ publishers: ['Regulator', 7], tags: 'oops', other: ['x'] } as any)).toEqual({
			publisher: { $in: ['Regulator'] },
		});
	});
});

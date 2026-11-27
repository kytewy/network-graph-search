import { describe, expect, it } from 'vitest';
import { groupPassages, rankDocuments, PASSAGES_PER_DOCUMENT } from '@/lib/search/passage-results';
import { matchLine, queryWords } from '@/components/search/Highlighted';

const passage = (doc: string, position: number, score: number, heading: string | null = null) => ({
	_id: `${doc}#p${position}`,
	_score: score,
	fields: { document_id: doc, position, heading, start: position * 1000, chunk_text: `Title${heading ? ` · ${heading}` : ''}\nText of ${position}` },
});

describe('groupPassages', () => {
	it('groups passages by document, best first, keeps at most three and counts them all', () => {
		const groups = groupPassages([passage('e23', 4, 0.5), passage('e23', 14, 0.9, 'Model Inventory'), passage('e23', 22, 0.7), passage('e23', 31, 0.6), passage('kpmg', 3, 0.8)]);
		const e23 = groups.get('e23')!;
		expect(e23.matches).toBe(4);
		expect(e23.passages).toHaveLength(PASSAGES_PER_DOCUMENT);
		expect(e23.passages[0]).toMatchObject({ position: 14, heading: 'Model Inventory', start: 14000, text: 'Text of 14', score: 0.9 });
		expect(groups.get('kpmg')!.matches).toBe(1);
	});
});

describe('rankDocuments', () => {
	it('scores a document by its document hit or its best passage, whichever is higher', () => {
		const docHits = [{ _id: 'a', _score: 0.4 }, { _id: 'b', _score: 0.3 }];
		const groups = groupPassages([passage('b', 1, 0.95), passage('c', 2, 0.6)]);
		expect(rankDocuments(docHits, groups, 10)).toEqual([['b', 0.95], ['c', 0.6], ['a', 0.4]]);
		expect(rankDocuments(docHits, groups, 2).map(([id]) => id)).toEqual(['b', 'c']);
	});

	it('is the plain document search when there are no passages', () => {
		expect(rankDocuments([{ _id: 'a', _score: 0.4 }], new Map(), 10)).toEqual([['a', 0.4]]);
	});
});

describe('match line and highlighting', () => {
	it('says how many matched and the best heading, or its first words', () => {
		expect(matchLine(3, 'Model Inventory', 'x')).toBe('3 matches · best: Model Inventory');
		expect(matchLine(1, null, 'Institutions should maintain a complete inventory')).toBe('1 match · best: Institutions should maintain a complete…');
	});

	it('highlights the words of the search, not little ones', () => {
		expect(queryWords('Model inventory of AI')).toEqual(['model', 'inventory']);
	});
});

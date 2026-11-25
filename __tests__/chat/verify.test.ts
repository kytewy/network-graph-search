import { checkInstruction, citationsToCheck } from '@/lib/chat/verify';

const nodes = [
	{ id: 'long', name: 'Long doc', text: 'x'.repeat(800), content: 'x'.repeat(5000) },
	{ id: 'short', name: 'Short doc', text: 'All of it', content: 'All of it' },
	{ id: 'other', name: 'Not cited', text: 'y'.repeat(800), content: 'y'.repeat(5000) },
];

describe('checking citations against the full text', () => {
	it('picks cited documents the AI only got an excerpt of', () => {
		expect(citationsToCheck('From [Long doc] and [Short doc].', nodes, new Map())).toEqual([{ id: 'long', title: 'Long doc' }]);
	});

	it('skips documents already read in full, and answers without citations', () => {
		expect(citationsToCheck('From [Long doc].', nodes, new Map([['long', 5000]]))).toEqual([]);
		expect(citationsToCheck('No citations here.', nodes, new Map())).toEqual([]);
	});

	it('asks for the whole corrected answer, naming the documents', () => {
		expect(checkInstruction(['Long doc'])).toMatch(/full text of documents your answer cites: \[Long doc\].*complete corrected answer/);
	});
});

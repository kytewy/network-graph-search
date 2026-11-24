import { BUDGET_CHARS, findDocument, READ_LIMITS, serveRead } from '@/lib/chat/read-document';
import { buildReceipt } from '@/lib/chat/receipt';

const nodes = [
	{ id: 'e23', name: 'OSFI Guideline E-23', text: 'Short summary', summary: 'Short summary', content: 'E'.repeat(30_000) },
	{ id: 'r38', name: 'Recital R38', text: 'R'.repeat(800), content: 'R'.repeat(1_012) },
];
const call = (title: string) => JSON.stringify({ title });

describe('read_document: the AI reads whole documents it needs', () => {
	it('finds a document by its title and gives its full text, cut to the per-document limit', () => {
		expect(findDocument('Recital R38', nodes)).toEqual({ id: 'r38', text: 'R'.repeat(1_012) });
		expect(findDocument('OSFI Guideline E-23', nodes)!.text).toHaveLength(READ_LIMITS.MAX_CHARS);
		expect(findDocument('Not in the list', nodes)).toBeNull();
	});

	it('records what was read, once per document', () => {
		const read = new Map<string, number>();
		const refused = { count: 0 };
		expect(serveRead(call('Recital R38'), nodes, read, refused)).toBe('R'.repeat(1_012));
		expect(serveRead(call('Recital R38'), nodes, read, refused)).toMatch(/already read/);
		expect(serveRead('not json', nodes, read, refused)).toMatch(/No document/);
		expect(read).toEqual(new Map([['r38', 1_012]]));
	});

	it('stops at the reading budget and counts what it turned down', () => {
		const read = new Map([['earlier', BUDGET_CHARS]]);
		const refused = { count: 0 };
		expect(serveRead(call('Recital R38'), nodes, read, refused)).toMatch(/budget .* used up/);
		expect(refused.count).toBe(1);
	});

	it('marks documents read on request in the receipt, at their full share', () => {
		const r = buildReceipt({
			nodes,
			messages: [{ content: 'x' }],
			suggestions: false,
			memoryTurns: 0,
			read: new Map([['e23', 12_000]]),
			readRounds: 2,
		});
		expect(r.documents[0]).toMatchObject({ sentAs: 'text', sent: 12_000, length: 30_000, readOnRequest: true });
		expect(r.documents[1].readOnRequest).toBeUndefined();
		expect(r.readRounds).toBe(2);
	});
});

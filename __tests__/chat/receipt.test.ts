import { buildReceipt, cutCount, describeSent, sentDetail, sentDocument, sentShare } from '@/lib/chat/receipt';

describe('the receipt: what was sent', () => {
	it('says a document went as its summary when the chat sent the summary', () => {
		const d = sentDocument({ id: 'e23', name: 'OSFI E-23', text: 'Short summary', summary: 'Short summary', content: 'x'.repeat(5000) });
		expect(d).toEqual({ id: 'e23', title: 'OSFI E-23', sentAs: 'summary', sent: 13, total: 13, length: 5000 });
		// A summary isn't part of the text, so it gets no percentage
		expect(sentShare(d)).toBeNull();
		expect(sentDetail(d)).toBe('Summary sent (13 characters); the document is 5,000 characters');
	});

	it('marks long text as cut to the character limit', () => {
		const d = sentDocument({ id: 'act', name: 'EU AI Act', text: 'y'.repeat(4200), content: 'y'.repeat(4200) });
		expect(d).toMatchObject({ sentAs: 'text', sent: 800, total: 4200 });
		expect(describeSent(d)).toBe('Document text · 800 of 4,200 characters · cut');
		expect(Math.round(sentShare(d)! * 100)).toBe(19);
	});

	it('says title only when a document has no words of its own', () => {
		const d = sentDocument({ id: 'n1', name: 'News item' });
		expect(d.sentAs).toBe('title');
		expect(describeSent(d)).toBe('Title only');
		expect(sentShare(d)).toBe(0);
	});

	it('counts cut documents and every message toward the tokens', () => {
		const r = buildReceipt({
			nodes: [{ id: 'a', name: 'A', text: 'z'.repeat(2000) }, { id: 'b', name: 'B', text: 'short' }],
			messages: [{ content: 'x'.repeat(400) }, { content: 'y'.repeat(400) }],
			question: '  ',
			suggestions: true,
			memoryTurns: 2,
		});
		expect(cutCount(r)).toBe(1);
		expect(r.tokens).toBe(200);
		expect(r.question).toBeUndefined();
		expect(r).toMatchObject({ suggestions: true, memoryTurns: 2, charLimit: 800 });
	});
});

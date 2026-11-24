import { askAboutPrompt, coverage } from '@/lib/chat/coverage';
import type { Receipt, SentDocument } from '@/lib/chat/receipt';

const doc = (id: string, title: string, extra: Partial<SentDocument> = {}): SentDocument => ({
	id, title, sentAs: 'text', sent: 500, total: 500, length: 500, ...extra,
});
const receipt = (documents: SentDocument[]): Receipt => ({
	model: 'gpt-4o-mini', contextWindow: 128000, tokens: 1, charLimit: 800, documents, suggestions: false, memoryTurns: 0,
});

describe('coverage: what the answer cites out of what was sent', () => {
	const sent = receipt([
		doc('a', 'EU AI Act'),
		doc('b', 'OSFI Guideline E-23', { sent: 800, total: 29960, length: 29960 }),
		doc('c', 'Recital R38'),
	]);

	it('splits cited from not cited, matching shortened titles', () => {
		const c = coverage('Binding rules: [EU AI Act] and [OSFI Guideline E-23].', sent);
		expect(c.cited.map((d) => d.id)).toEqual(['a', 'b']);
		expect(c.notCited.map((d) => d.id)).toEqual(['c']);
	});

	it('flags cited documents the AI saw less than half of, and summaries', () => {
		expect(coverage('[OSFI Guideline E-23]', sent).weak.map((d) => d.id)).toEqual(['b']);
		const summary = receipt([doc('s', 'KPMG note', { sentAs: 'summary', sent: 300, total: 300, length: 9000 })]);
		expect(coverage('[KPMG note]', summary).weak).toHaveLength(1);
	});

	it('lists citations that match no document sent', () => {
		expect(coverage('See [The Made Up Act] and [EU AI Act].', sent).unmatched).toEqual(['The Made Up Act']);
	});

	it('writes a follow-up that names up to 10 documents', () => {
		const many = Array.from({ length: 12 }, (_, i) => doc(`d${i}`, `Doc ${i}`));
		const text = askAboutPrompt(many);
		expect(text).toContain('[Doc 0], [Doc 1]');
		expect(text).toContain('and 2 more');
		expect(text).not.toContain('[Doc 10]');
	});
});

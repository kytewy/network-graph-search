import { describe, expect, it } from 'vitest';
import { PASSAGE, isHeading, passageRecord, passagesNamespace, splitPassages } from '@/lib/passages/passages.mjs';

const para = (n: number, word = 'Models') => `${word} must be inventoried and reviewed. `.repeat(n).trim();

describe('splitPassages', () => {
	it('keeps short documents as one passage', () => {
		const text = `${para(3)}\n\n${para(2)}`;
		expect(splitPassages(text)).toEqual([{ position: 0, heading: null, start: 0, text }]);
	});

	it('groups whole paragraphs into passages of about the target size', () => {
		const text = Array.from({ length: 12 }, () => para(8)).join('\n\n');
		const passages = splitPassages(text);
		expect(passages.length).toBeGreaterThan(2);
		for (const p of passages) expect(p.text.length).toBeLessThanOrEqual(PASSAGE.max);
		// Nothing lost or reordered: every passage sits exactly where it came from
		for (const p of passages) expect(text.slice(p.start, p.start + p.text.length)).toBe(p.text);
	});

	it('starts a new passage at a heading and remembers it', () => {
		const text = `${para(10)}\n\nModel inventory\n\n${para(4, 'Inventories')}\n\nModel review\n\n${para(4, 'Reviews')}`;
		const passages = splitPassages(text);
		const inventory = passages.find((p) => p.text.includes('Inventories'))!;
		expect(inventory.heading).toBe('Model inventory');
		expect(inventory.text.startsWith('Model inventory')).toBe(true);
		expect(passages.find((p) => p.text.includes('Reviews'))!.heading).toBe('Model review');
	});

	it('splits a very long paragraph at sentence ends', () => {
		const text = para(120);
		const passages = splitPassages(text);
		expect(passages.length).toBeGreaterThan(1);
		for (const p of passages.slice(0, -1)) expect(p.text.endsWith('.')).toBe(true);
		expect(passages.map((p) => p.position)).toEqual(passages.map((_, i) => i));
	});

	it('reads one paragraph per line, as scraped pages store them, and keeps list items in the text', () => {
		const text = `A.2 Scope\n${para(6)}\nA.3 Application\nThis applies in proportion to the institution's:\n- size\n- strategy\n${para(3)}`;
		const passages = splitPassages(text);
		expect(passages.map((p) => p.heading)).toEqual(['A.2 Scope', 'A.3 Application']);
		expect(passages[1].text).toContain('- size');
	});

	it('never makes a passage longer than the maximum, even from one endless sentence', () => {
		const passages = splitPassages('word '.repeat(2000));
		for (const p of passages) expect(p.text.length).toBeLessThanOrEqual(PASSAGE.max);
	});

	it('returns nothing for empty text', () => {
		expect(splitPassages('   ')).toEqual([]);
	});
});

describe('isHeading', () => {
	it.each(['Article 6', 'Model inventory', '## Scope'])('%s is a heading', (s) => expect(isHeading(s)).toBe(true));
	it.each(['This is a sentence.', 'Note:', '1,2', '', '- size', '(a) the placing on the market'])('%s is not', (s) => expect(isHeading(s)).toBe(false));
});

describe('passageRecord', () => {
	const doc = { id: 'osfi-e23', title: 'OSFI E-23', url: 'https://x', publisher: 'Regulator', documentType: 'Guidance', country: 'Canada', continent: null, source: 'index' };

	it('gets its own id, the document it belongs to, and the document’s filter fields', () => {
		const r = passageRecord(doc, { position: 14, heading: 'Model inventory', start: 9000, text: 'Keep an inventory.' }, 38);
		expect(r).toMatchObject({ _id: 'osfi-e23#p14', document_id: 'osfi-e23', position: 14, passages: 38, publisher: 'Regulator', country: 'Canada', heading: 'Model inventory' });
		expect(r.chunk_text).toBe('OSFI E-23 · Model inventory\nKeep an inventory.');
		expect(r).not.toHaveProperty('continent');
	});

	it('lives in its own namespace beside the documents', () => {
		expect(passagesNamespace({ PINECONE_NAMESPACE: 'docs' })).toBe('docs-passages');
		expect(passagesNamespace({ PINECONE_PASSAGES_NAMESPACE: 'p' })).toBe('p');
	});
});

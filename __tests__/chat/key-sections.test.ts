import { describe, expect, it, vi } from 'vitest';

const ROWS = [
	{ document_id: 'e23', position: 0, heading: 'Purpose and scope', start: 0, body: 'This guideline sets out expectations.' },
	{ document_id: 'e23', position: 1, heading: 'Model risk rating', start: 40, body: 'Each model gets a risk rating.' },
	{ document_id: 'e23', position: 2, heading: 'Residual model risk', start: 80, body: 'Assess the risk that remains after controls.' },
	{ document_id: 'r115', position: 0, heading: null, start: 0, body: 'Providers should monitor their models after release.' },
	{ document_id: 'dk', position: 0, heading: 'Key findings', start: 0, body: 'Almost every organisation has an assistant.' },
	{ document_id: 'dk', position: 1, heading: 'Governance gaps', start: 50, body: 'Few have a monitoring policy.' },
];
let hits: unknown[] = [];
vi.mock('@/lib/db/client', () => ({ db: () => Object.assign(async () => ROWS, (ids: string[]) => ids) }));
vi.mock('@/lib/services/vector_search', () => ({ searchPassages: vi.fn(async () => hits) }));

import { outlineText, planSections, serveSection } from '@/lib/chat/key-sections';
import { buildReceipt, type ReceiptSection } from '@/lib/chat/receipt';
import { citationsToCheck } from '@/lib/chat/verify';

const hit = (doc: string, position: number, score: number) => ({ _score: score, fields: { document_id: doc, position } });
const DOCS = [{ id: 'e23', label: 'Guideline E-23' }, { id: 'r115', label: 'Recital R115' }, { id: 'dk', label: 'State of AI in Denmark' }];

describe('planSections', () => {
	it('sends each document its best match, a one-section document whole, and nothing below the floor', async () => {
		hits = [hit('e23', 2, 0.94), hit('e23', 1, 0.6), hit('dk', 1, 0.12)];
		const plan = await planSections('residual model risk', ['e23', 'r115', 'dk']);
		expect(plan.best.get('e23')?.heading).toBe('Residual model risk');
		expect(plan.best.get('r115')?.position).toBe(0);
		expect(plan.best.has('dk')).toBe(false);
		expect(plan.unscored).toBe(false);
	});

	it('lists every section in the outline, numbered, with its match and which one is included', async () => {
		hits = [hit('e23', 2, 0.94)];
		const plan = await planSections('residual model risk', ['e23', 'dk']);
		const outline = outlineText([{ id: 'e23', title: 'Guideline E-23' }, { id: 'dk', title: 'State of AI in Denmark' }], plan);
		expect(outline).toContain('[Guideline E-23]\n  1. Purpose and scope\n  2. Model risk rating\n  3. Residual model risk (match 94%) [included below]');
		expect(outline).toContain('[State of AI in Denmark]\n  1. Key findings\n  2. Governance gaps');
		expect(outline).toContain('read_section');
	});

	it('still gives an outline (headings only) when the search can’t score sections', async () => {
		hits = [];
		const plan = await planSections('anything', ['e23']);
		expect(plan.unscored).toBe(true);
		expect(plan.best.has('e23')).toBe(false);
		expect(outlineText([{ id: 'e23', title: 'Guideline E-23' }], plan)).toContain('  2. Model risk rating\n');
	});
});

describe('serveSection', () => {
	it('returns the section the AI asked for and records it with its reason', async () => {
		hits = [];
		const plan = await planSections('q', ['e23', 'dk']);
		const picked = new Map<string, ReceiptSection[]>();
		const text = serveSection(JSON.stringify({ title: 'State of AI in Denmark', section: 2, why: 'Shows the monitoring gap' }), DOCS, plan, picked, 10_000);
		expect(text).toBe('Governance gaps\nFew have a monitoring policy.');
		expect(picked.get('dk')).toMatchObject([{ position: 1, by: 'ai', why: 'Shows the monitoring gap', chars: 29 }]);
		expect(serveSection(JSON.stringify({ title: 'State of AI in Denmark', section: 2, why: 'again' }), DOCS, plan, picked, 10_000)).toMatch(/already/);
		expect(serveSection(JSON.stringify({ title: 'Nope', section: 1, why: 'x' }), DOCS, plan, picked, 10_000)).toMatch(/No document/);
		expect(serveSection(JSON.stringify({ title: 'Guideline E-23', section: 9, why: 'x' }), DOCS, plan, picked, 10_000)).toMatch(/no section/);
		expect(serveSection(JSON.stringify({ title: 'Guideline E-23', section: 1, why: 'x' }), DOCS, plan, picked, 0)).toMatch(/No more sections/);
	});
});

describe('the receipt and the citation check with sections', () => {
	const node = { id: 'e23', name: 'Guideline E-23', content: 'x'.repeat(10_000) };
	const sections: ReceiptSection[] = [
		{ position: 2, heading: 'Residual model risk', start: 80, text: 'Assess…', chars: 1_900, by: 'search' },
		{ position: 1, heading: 'Model risk rating', start: 40, text: 'Each…', chars: 1_600, by: 'ai', why: 'The rating sets the tolerance' },
	];

	it('counts what the sections sent, out of the whole document', () => {
		const receipt = buildReceipt({ nodes: [node], messages: [], suggestions: false, memoryTurns: 0, sections: new Map([['e23', sections]]) });
		expect(receipt.documents[0]).toMatchObject({ sentAs: 'text', sent: 3_500, total: 10_000, sections });
	});

	it('doesn’t re-read in full a cited document whose sections were sent', () => {
		const answer = 'Measure what remains [Guideline E-23].';
		expect(citationsToCheck(answer, [node], new Map())).toHaveLength(1);
		expect(citationsToCheck(answer, [node], new Map(), new Set(['e23']))).toHaveLength(0);
	});
});

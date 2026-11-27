import { describe, expect, it } from 'vitest';
import { inPassage, matchLabel, paragraphsOf } from '@/lib/reading/paragraphs';

const TEXT = 'A.2 Scope\nThis guideline applies to all institutions.\nModel Inventory\nKeep a complete inventory of models.\nModel Review\nReview models independently.';

describe('reading mode paragraphs', () => {
	it('knows where each paragraph sits in the text', () => {
		const ps = paragraphsOf(TEXT);
		expect(ps).toHaveLength(6);
		for (const p of ps) expect(TEXT.slice(p.start, p.end)).toBe(p.text);
	});

	it('finds the paragraphs a passage covers, from where it starts and how long it is', () => {
		const start = TEXT.indexOf('Model Inventory');
		const passage = { start, text: 'Model Inventory\nKeep a complete inventory of models.' };
		const lit = paragraphsOf(TEXT).filter((p) => inPassage(p, passage)).map((p) => p.text);
		expect(lit).toEqual(['Model Inventory', 'Keep a complete inventory of models.']);
	});

	it('labels a match by its heading, or its first words', () => {
		expect(matchLabel({ heading: 'Model Inventory', text: 'x' })).toBe('Model Inventory');
		expect(matchLabel({ heading: null, text: 'Institutions should maintain a complete inventory of models' })).toBe('Institutions should maintain a complete inventory…');
	});
});

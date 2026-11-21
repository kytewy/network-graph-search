/**
 * @jest-environment node
 */

import {
	DOCUMENT_TYPES,
	PUBLISHERS,
	UNKNOWN_COLOR,
	documentTypeColor,
	legendEntries,
	publisherColor,
} from '@/lib/config/document-taxonomy';

describe('document taxonomy', () => {
	it('has interpretation as a document type, not a publisher', () => {
		expect(DOCUMENT_TYPES.map((d) => d.value)).toEqual(['Law', 'Guidance', 'Interpretation']);
		expect(PUBLISHERS.map((p) => p.value)).not.toContain('Interpretation');
		expect(PUBLISHERS.map((p) => p.value)).toContain('Government');
	});

	it('gives every entry its own colour', () => {
		const colors = [...PUBLISHERS, ...DOCUMENT_TYPES].map((e) => e.color);
		expect(new Set(PUBLISHERS.map((p) => p.color)).size).toBe(PUBLISHERS.length);
		expect(new Set(DOCUMENT_TYPES.map((d) => d.color)).size).toBe(DOCUMENT_TYPES.length);
		expect(colors).not.toContain(UNKNOWN_COLOR);
	});

	it('looks up colours, falling back for missing or unknown values', () => {
		expect(publisherColor('Law firm')).toBe(PUBLISHERS.find((p) => p.value === 'Law firm')!.color);
		expect(documentTypeColor('Interpretation')).toBe(DOCUMENT_TYPES[2].color);
		expect(publisherColor('')).toBe(UNKNOWN_COLOR);
		expect(documentTypeColor('pdf')).toBe(UNKNOWN_COLOR);
	});
});

describe('legendEntries', () => {
	it('lists only values on screen, in taxonomy order', () => {
		expect(legendEntries(PUBLISHERS, ['NGO', 'Government', 'NGO']).map((e) => e.label)).toEqual([
			'Government',
			'NGO',
		]);
	});

	it('adds one Unknown entry for missing or unrecognised values', () => {
		const entries = legendEntries(DOCUMENT_TYPES, ['Law', '', 'pdf']);
		expect(entries).toEqual([
			{ label: 'Law', color: DOCUMENT_TYPES[0].color },
			{ label: 'Unknown', color: UNKNOWN_COLOR },
		]);
	});
});

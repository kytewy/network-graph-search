import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({ db: () => { throw new Error('no database in unit tests'); } }));

import { formatAdded, formatAddedExact, formatPublished, parseFilters } from '@/lib/sources/list';
import { toRow } from '../../scripts/import-index.mjs';

describe('parseFilters', () => {
	it('reads a search and a known source', () => {
		expect(parseFilters({ q: '  E-23 ', source: 'link' })).toEqual({ q: 'E-23', source: 'link', sort: 'added', dir: 'desc' });
	});

	it('ignores an unknown source and takes the first of repeated params', () => {
		expect(parseFilters({ q: ['a', 'b'], source: 'scraped' })).toEqual({ q: 'a', source: null, sort: 'added', dir: 'desc' });
	});

	it('caps a very long search', () => {
		expect(parseFilters({ q: 'x'.repeat(500) }).q).toHaveLength(200);
	});
});

describe('formatAdded', () => {
	const now = new Date(2026, 10, 25, 18, 0);

	it('says Today and Yesterday', () => {
		expect(formatAdded(new Date(2026, 10, 25, 1, 0), now)).toBe('Today');
		expect(formatAdded(new Date(2026, 10, 24, 23, 0), now)).toBe('Yesterday');
	});

	it('gives a short date this year and adds the year otherwise', () => {
		expect(formatAdded(new Date(2026, 10, 20), now)).toBe('Nov 20');
		expect(formatAdded(new Date(2025, 0, 3), now)).toBe('Jan 3, 2025');
	});
});

describe('sorting by date', () => {
	it('reads published / oldest first, and ignores anything else', () => {
		expect(parseFilters({ sort: 'published', dir: 'asc' })).toMatchObject({ sort: 'published', dir: 'asc' });
		expect(parseFilters({ sort: 'title; DROP TABLE documents', dir: 'sideways' })).toMatchObject({ sort: 'added', dir: 'desc' });
	});
});

describe('date display', () => {
	it('shows a publication date in full, or a dash', () => {
		expect(formatPublished(new Date('2024-07-12'))).toBe('Jul 12, 2024');
		expect(formatPublished(null)).toBe('—');
	});

	it('gives the exact added time for the hover text', () => {
		expect(formatAddedExact(new Date(2026, 10, 25, 20, 41))).toBe('Nov 25, 2026, 8:41 PM');
	});
});

describe('import-index toRow', () => {
	it('maps an exported index record to a documents row with full text and dates', () => {
		const row = toRow({ _id: 12, label: 'Article 6', content: 'Full text…', publisher: 'Government', documentType: 'Law', country: 'European Union', continent: 'Europe', published_at: '2024-07-12', effective_at: '2026-08-02', url: 'https://x' });
		expect(row).toMatchObject({ id: '12', title: 'Article 6', body: 'Full text…', document_type: 'Law', published_at: '2024-07-12', effective_at: '2026-08-02' });
	});

	it('leaves odd or missing dates empty', () => {
		expect(toRow({ _id: 'a', label: 'x', chunk_text: 't', published_at: 'soon' })).toMatchObject({ body: 't', published_at: null, effective_at: null, url: null });
	});
});

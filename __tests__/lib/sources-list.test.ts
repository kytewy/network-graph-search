import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({ db: () => { throw new Error('no database in unit tests'); } }));

import { formatAdded, parseFilters } from '@/lib/sources/list';

describe('parseFilters', () => {
	it('reads a search and a known source', () => {
		expect(parseFilters({ q: '  E-23 ', source: 'link' })).toEqual({ q: 'E-23', source: 'link' });
	});

	it('ignores an unknown source and takes the first of repeated params', () => {
		expect(parseFilters({ q: ['a', 'b'], source: 'scraped' })).toEqual({ q: 'a', source: null });
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

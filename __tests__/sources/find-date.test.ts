import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils/openai-client', () => ({
	openai: { chat: { completions: { create: vi.fn(async () => ({ choices: [{ message: { content: '{"date": "2025-10"}' } }] })) } } },
	parseJSONObject: (t: string) => JSON.parse(t),
}));

import { aiDate, cleanDate, pageDate } from '@/lib/sources/find-date';

describe('cleanDate', () => {
	it('fills in a missing day or month, and refuses odd or future dates', () => {
		const today = new Date('2026-11-27T00:00:00Z');
		expect(cleanDate('2024-07-12T09:00:00+02:00', today)).toBe('2024-07-12');
		expect(cleanDate('2024-07', today)).toBe('2024-07-01');
		expect(cleanDate('2024', today)).toBe('2024-01-01');
		expect(cleanDate('2027-01-01', today)).toBeNull();
		expect(cleanDate('1850-01-01', today)).toBeNull();
		expect(cleanDate(null, today)).toBeNull();
	});
});

describe('pageDate', () => {
	it('reads the date a page states in its tags', () => {
		expect(pageDate('<meta property="article:published_time" content="2025-03-04T10:00:00Z">')).toBe('2025-03-04');
		expect(pageDate('<script type="application/ld+json">{"datePublished":"2024-11-20"}</script>')).toBe('2024-11-20');
		expect(pageDate('<p>No date here</p>')).toBeNull();
	});
});

describe('aiDate', () => {
	it('takes the model’s date, cleaned', async () => {
		expect(await aiDate({ title: 'State of AI in Denmark', body: 'Our new survey…' })).toBe('2025-10-01');
	});
});

import { describe, expect, it } from 'vitest';
import { inPublishedRange, monthLabel, timelineBars } from '@/lib/filters/published-range';

describe('inPublishedRange', () => {
	it('keeps everything when no range is set', () => {
		expect(inPublishedRange(undefined, [])).toBe(true);
	});
	it('keeps months from..to inclusive, and drops undated documents', () => {
		expect(inPublishedRange('2024-07-12', ['2024-07', '2024-12'])).toBe(true);
		expect(inPublishedRange('2024-06-30', ['2024-07', '2024-12'])).toBe(false);
		expect(inPublishedRange(undefined, ['2024-07', '2024-12'])).toBe(false);
	});
});

describe('timelineBars', () => {
	it('uses months for a short span, with empty months in between', () => {
		const bars = timelineBars(['2024-01-05', '2024-03-01', '2024-03-20']);
		expect(bars.map((b) => [b.from, b.count])).toEqual([['2024-01', 1], ['2024-02', 0], ['2024-03', 2]]);
	});
	it('uses quarters up to six years, and calendar years beyond', () => {
		expect(timelineBars(['2020-02-01', '2024-11-01'])[0]).toEqual({ from: '2020-01', to: '2020-03', count: 1 });
		const years = timelineBars(['2010-05-01', '2024-07-12']);
		expect(years[0]).toEqual({ from: '2010-01', to: '2010-12', count: 1 });
		expect(years).toHaveLength(15);
	});
	it('labels months', () => {
		expect(monthLabel('2024-07')).toBe('Jul 2024');
	});
});

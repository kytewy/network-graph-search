import { describe, expect, it } from 'vitest';
import { inDateRange, periodLabel, timelineBars } from '@/lib/filters/date-range';

describe('inDateRange', () => {
	it('keeps everything when no range is set', () => {
		expect(inDateRange(undefined, [])).toBe(true);
	});
	it('keeps months from..to inclusive, and drops undated documents', () => {
		expect(inDateRange('2024-07-12', ['2024-07', '2024-12'])).toBe(true);
		expect(inDateRange('2024-06-30', ['2024-07', '2024-12'])).toBe(false);
		expect(inDateRange(undefined, ['2024-07', '2024-12'])).toBe(false);
	});
});

describe('timelineBars', () => {
	it('uses months for a short span, with empty months in between', () => {
		const bars = timelineBars(['2023-01-05', '2023-03-01', '2023-03-20', '2024-02-01']);
		expect(bars.slice(0, 3).map((b) => [b.from, b.count])).toEqual([['2023-01', 1], ['2023-02', 0], ['2023-03', 2]]);
		expect(bars).toHaveLength(14);
	});
	it('uses days when the dates are close, at least two weeks of them', () => {
		const bars = timelineBars(['2026-11-20', '2026-11-27', '2026-11-27']);
		expect(bars).toHaveLength(14);
		expect(bars.find((b) => b.from === '2026-11-27')?.count).toBe(2);
		expect(inDateRange('2026-11-27', ['2026-11-25', '2026-11-27'])).toBe(true);
		expect(inDateRange('2026-11-24', ['2026-11-25', '2026-11-27'])).toBe(false);
	});
	it('shows at least a year of months, centred, once dates are months apart', () => {
		const bars = timelineBars(['2024-01-12', '2024-06-01']);
		expect(bars).toHaveLength(12);
		expect([bars[0].from, bars[11].to]).toEqual(['2023-10', '2024-09']);
	});
	it('uses months up to ten years, quarters up to thirty, and calendar years beyond', () => {
		expect(timelineBars(['2016-02-01', '2024-11-01'])).toHaveLength(106);
		expect(timelineBars(['2000-02-01', '2024-11-01'])[0]).toEqual({ from: '2000-01', to: '2000-03', count: 1 });
		const years = timelineBars(['1980-05-01', '2024-07-12']);
		expect(years[0]).toEqual({ from: '1980-01', to: '1980-12', count: 1 });
		expect(years).toHaveLength(45);
	});
	it('labels months', () => {
		expect(periodLabel('2024-07')).toBe('Jul 2024');
		expect(periodLabel('2024-07-12')).toBe('Jul 12, 2024');
	});
});

describe('searching within dates', () => {
	it('turns a month range into a Pinecone range on published_month', async () => {
		const { buildPineconeFilter } = await import('@/lib/utils/pinecone-filters');
		expect(buildPineconeFilter({ published: ['2023-01', '2024-07'] })).toEqual({ published_month: { $gte: 202301, $lte: 202407 } });
		expect(buildPineconeFilter({ published: ['2023-01', '2024-07'], publishers: ['Regulator'] })).toEqual({
			$and: [{ publisher: { $in: ['Regulator'] } }, { published_month: { $gte: 202301, $lte: 202407 } }],
		});
	});
});

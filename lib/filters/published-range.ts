/** The Published timeline: dates bucketed into bars, and whether a document falls in a [from, to] range of months */

/** A month as YYYY-MM, counted as a number so buckets are easy to step through */
const toIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
const toMonth = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;

/** A month as the number Pinecone stores (published_month), e.g. "2024-07" → 202407 */
export const monthNumber = (month: string) => Number(month.slice(0, 4)) * 100 + Number(month.slice(5, 7));

/** In the range when its month is from..to inclusive; undated documents drop out once a range is set */
export function inPublishedRange(published: string | undefined, range: readonly string[]): boolean {
	if (range.length < 2) return true;
	const month = published?.slice(0, 7);
	return !!month && month >= range[0] && month <= range[1];
}

export interface TimelineBar {
	from: string;
	to: string;
	count: number;
}

/** Bars from the earliest to the latest date: by month up to 2 years, by quarter up to 6, else by year */
export function timelineBars(dates: readonly string[]): TimelineBar[] {
	if (dates.length === 0) return [];
	const months = dates.map(toIndex);
	const span = Math.max(...months) - Math.min(...months) + 1;
	const step = span <= 24 ? 1 : span <= 72 ? 3 : 12;
	const first = Math.floor(Math.min(...months) / step) * step;
	const last = Math.floor(Math.max(...months) / step) * step;
	const bars: TimelineBar[] = [];
	for (let at = first; at <= last; at += step) {
		bars.push({ from: toMonth(at), to: toMonth(at + step - 1), count: months.filter((m) => m >= at && m < at + step).length });
	}
	return bars;
}

/** "Jul 2024" */
export function monthLabel(month: string): string {
	const [y, m] = month.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

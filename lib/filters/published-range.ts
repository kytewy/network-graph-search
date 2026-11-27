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

/** At least this many months show, so one date doesn't fill the whole chart */
export const MIN_MONTHS = 12;

/** Bars from the earliest to the latest date: by month up to 10 years, by quarter up to 30, else by year */
export function timelineBars(dates: readonly string[]): TimelineBar[] {
	if (dates.length === 0) return [];
	const months = dates.map(toIndex);
	let [lo, hi] = [Math.min(...months), Math.max(...months)];
	// A short span is widened evenly on both sides
	const short = MIN_MONTHS - (hi - lo + 1);
	if (short > 0) [lo, hi] = [lo - Math.floor(short / 2), hi + Math.ceil(short / 2)];
	const span = hi - lo + 1;
	const step = span <= 120 ? 1 : span <= 360 ? 3 : 12;
	const first = Math.floor(lo / step) * step;
	const last = Math.floor(hi / step) * step;
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

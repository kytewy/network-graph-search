/** The date timelines (Published, Added): dates bucketed into bars, and whether a document falls in a [from, to] range */

const DAY_MS = 86_400_000;
const dayIndex = (date: string) => Math.floor(Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / DAY_MS);
const dayOf = (index: number) => new Date(index * DAY_MS).toISOString().slice(0, 10);
const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
const monthOf = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;

/** A month as the number Pinecone stores (published_month), e.g. "2024-07" → 202407 */
export const monthNumber = (month: string) => Number(month.slice(0, 4)) * 100 + Number(month.slice(5, 7));

/**
 * In the range when its date is from..to inclusive, compared at the range's precision (YYYY-MM or
 * YYYY-MM-DD); documents with no date drop out once a range is set
 */
export function inDateRange(date: string | undefined, range: readonly string[]): boolean {
	if (range.length < 2) return true;
	if (!date) return false;
	return date.slice(0, range[0].length) >= range[0] && date.slice(0, range[1].length) <= range[1];
}

export interface TimelineBar {
	/** First and last day (YYYY-MM-DD) or month (YYYY-MM) the bar covers */
	from: string;
	to: string;
	count: number;
}

/** Up to this many days apart, bars are days (at least DAYS_SHOWN of them); further apart, months or longer */
export const DAILY_UP_TO = 92;
export const DAYS_SHOWN = 14;
/** At least this many months show, so one date doesn't fill the whole chart */
export const MIN_MONTHS = 12;

/** Widens [lo, hi] evenly on both sides to at least `least` long */
const widen = (lo: number, hi: number, least: number): [number, number] => {
	const short = least - (hi - lo + 1);
	return short > 0 ? [lo - Math.floor(short / 2), hi + Math.ceil(short / 2)] : [lo, hi];
};

/** Bars from the earliest to the latest date: days within ~3 months, months up to 10 years, quarters up to 30, else years */
export function timelineBars(dates: readonly string[]): TimelineBar[] {
	if (dates.length === 0) return [];
	const days = dates.map(dayIndex);
	if (Math.max(...days) - Math.min(...days) < DAILY_UP_TO) {
		const [lo, hi] = widen(Math.min(...days), Math.max(...days), DAYS_SHOWN);
		const bars: TimelineBar[] = [];
		for (let d = lo; d <= hi; d++) bars.push({ from: dayOf(d), to: dayOf(d), count: days.filter((x) => x === d).length });
		return bars;
	}
	const months = dates.map(monthIndex);
	const [lo, hi] = widen(Math.min(...months), Math.max(...months), MIN_MONTHS);
	const span = hi - lo + 1;
	const step = span <= 120 ? 1 : span <= 360 ? 3 : 12;
	const first = Math.floor(lo / step) * step;
	const last = Math.floor(hi / step) * step;
	const bars: TimelineBar[] = [];
	for (let at = first; at <= last; at += step) {
		bars.push({ from: monthOf(at), to: monthOf(at + step - 1), count: months.filter((m) => m >= at && m < at + step).length });
	}
	return bars;
}

/** "Jul 2024" for a month, "Jul 12, 2024" for a day */
export function periodLabel(period: string): string {
	const [y, m, d] = period.split('-').map(Number);
	const at = new Date(Date.UTC(y, m - 1, d || 1));
	return at.toLocaleDateString('en-US', { month: 'short', ...(d ? { day: 'numeric' } : {}), year: 'numeric', timeZone: 'UTC' });
}

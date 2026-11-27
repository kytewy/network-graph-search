'use client';

import { useAppStore } from '@/lib/stores/app-state';
import { monthLabel, timelineBars } from '@/lib/filters/published-range';

// Bars inside the range are green, like the similarity colours; the rest stay pale
const IN_RANGE = 'bg-[#97c459]';
const OUT_OF_RANGE = 'bg-[#cfe6e2]';
// Two range sliders on one track: only their handles take the pointer
const HANDLE =
	'pointer-events-none absolute inset-x-0 top-0 h-4 w-full appearance-none bg-transparent ' +
	'[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-card ' +
	'[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[1.5px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-card';

/** Quick ranges: [label, from month or a function of today] */
const LAST_YEAR = () => {
	const d = new Date();
	return `${d.getUTCFullYear() - 1}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const QUICK: [string, () => string][] = [
	['Last year', LAST_YEAR],
	['Since EU AI Act', () => '2024-07'],
];

/** How many documents were published when: drag the handles (or tap a chip) to keep a range of dates */
export function PublishedTimeline() {
	// Re-read whenever the results or any filter change; the bars count what the other filters leave
	useAppStore((s) => s.filteredResults);
	const facet = useAppStore((s) => s.facet);
	const range = useAppStore((s) => s.selectedPublished);
	const setRange = useAppStore((s) => s.setPublishedRange);
	const nodes = facet('published');
	const dated = nodes.flatMap((n) => (n.published ? [n.published] : []));
	const bars = timelineBars(dated);

	if (bars.length === 0) return <p className="text-xs text-muted-foreground">None of these results has a date yet.</p>;

	const last = bars.length - 1;
	const indexOf = (month: string) => {
		const i = bars.findIndex((b) => month >= b.from && month <= b.to);
		if (i >= 0) return i;
		return month < bars[0].from ? 0 : last;
	};
	const lo = range.length === 2 ? indexOf(range[0]) : 0;
	const hi = range.length === 2 ? indexOf(range[1]) : last;
	const set = (a: number, b: number) => {
		const [from, to] = [Math.min(a, b), Math.max(a, b)];
		setRange(from === 0 && to === last ? [] : [bars[from].from, bars[to].to]);
	};
	const inside = bars.slice(lo, hi + 1).reduce((n, b) => n + b.count, 0);
	const undated = nodes.length - dated.length;
	// Square roots keep small bars visible next to a tall one (many EU records share one date)
	const tallest = Math.sqrt(Math.max(...bars.map((b) => b.count), 1));
	const years = [...new Set(bars.map((b) => b.from.slice(0, 4)))];
	const ticks = years.length <= 5 ? years : years.filter((_, i) => i % Math.ceil(years.length / 5) === 0);

	return (
		<div className="space-y-1.5" data-testid="published-timeline">
			<p className="text-xs text-muted-foreground" aria-live="polite">
				{monthLabel(bars[lo].from)} – {monthLabel(bars[hi].to)} · {inside} document{inside === 1 ? '' : 's'}
				{range.length === 2 && undated > 0 && ` · ${undated} undated hidden`}
			</p>
			<div className="flex h-16 items-end gap-px">
				{bars.map((b, i) => (
					<button
						key={b.from}
						type="button"
						title={`${monthLabel(b.from)}${b.from === b.to ? '' : ` – ${monthLabel(b.to)}`}: ${b.count}`}
						aria-label={`${monthLabel(b.from)}: ${b.count} documents`}
						onClick={() => set(i, i)}
						className={`min-w-0 flex-1 rounded-t-sm transition-colors ${i >= lo && i <= hi ? IN_RANGE : OUT_OF_RANGE}`}
						style={{ height: b.count ? `${Math.max(6, (Math.sqrt(b.count) / tallest) * 100)}%` : '2px' }}
					/>
				))}
			</div>
			<div className="relative h-4">
				<div className="absolute inset-x-0 top-[7px] h-px bg-border" />
				<input type="range" min={0} max={last} step={1} value={lo} aria-label="Published from" onChange={(e) => set(Number(e.target.value), hi)} className={HANDLE} />
				<input type="range" min={0} max={last} step={1} value={hi} aria-label="Published to" onChange={(e) => set(lo, Number(e.target.value))} className={HANDLE} />
			</div>
			<div className="flex justify-between text-[11px] text-muted-foreground">
				{ticks.map((y) => (
					<span key={y}>{y}</span>
				))}
			</div>
			<div className="flex flex-wrap gap-1.5 pt-1">
				{QUICK.map(([label, from]) => (
					<button key={label} type="button" onClick={() => setRange([from(), bars[last].to > from() ? bars[last].to : from()])} className="rounded-full border px-2 py-0.5 text-xs hover:bg-accent/50">
						{label}
					</button>
				))}
				{range.length === 2 && (
					<button type="button" onClick={() => setRange([])} className="rounded-full border px-2 py-0.5 text-xs hover:bg-accent/50">
						All dates
					</button>
				)}
			</div>
		</div>
	);
}

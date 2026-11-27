'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/stores/app-state';
import { periodLabel, timelineBars } from '@/lib/filters/date-range';

// Purple for what's kept, pale purple for the rest, like the Similarity filter (green means high similarity on the graph)
const IN_RANGE = 'bg-primary';
const OUT_OF_RANGE = 'bg-primary/20';
// Two range sliders on one track: only their handles take the pointer
const HANDLE =
	'pointer-events-none absolute inset-x-0 top-0 h-4 w-full appearance-none bg-transparent ' +
	'[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-card ' +
	'[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[1.5px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-card';

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

/** Each timeline: which date it reads, where its range lives, and its quick ranges ([label, from]) */
const FIELDS = {
	published: {
		noun: 'published',
		range: (s: ReturnType<typeof useAppStore.getState>) => s.selectedPublished,
		set: (s: ReturnType<typeof useAppStore.getState>) => s.setPublishedRange,
		quick: [['Last year', () => ago(365).slice(0, 7)], ['Since EU AI Act', () => '2024-07']] as [string, () => string][],
	},
	added: {
		noun: 'added',
		range: (s: ReturnType<typeof useAppStore.getState>) => s.selectedAdded,
		set: (s: ReturnType<typeof useAppStore.getState>) => s.setAddedRange,
		quick: [['Last 7 days', () => ago(7)], ['Last 30 days', () => ago(30)]] as [string, () => string][],
	},
} as const;

/**
 * How many results were published (or added) when. Drag the handles, tap a bar or a chip to keep a range;
 * the results only change when you let go of a handle, so dragging stays smooth.
 */
export function DateTimeline({ field }: { field: keyof typeof FIELDS }) {
	const def = FIELDS[field];
	// Re-read whenever the results or any filter change; the bars count what the other filters leave
	useAppStore((s) => s.filteredResults);
	const facet = useAppStore((s) => s.facet);
	const range = useAppStore(def.range);
	const setRange = useAppStore(def.set);
	// While a handle is being dragged: where it is, not yet applied
	const [draft, setDraft] = useState<[number, number] | null>(null);
	const nodes = facet(field);
	const dated = nodes.flatMap((n) => (n[field] ? [n[field] as string] : []));
	const bars = timelineBars(dated);
	const undated = nodes.length - dated.length;

	if (bars.length === 0) return <p className="text-xs text-muted-foreground">None of these {undated} results has a date yet.</p>;

	const last = bars.length - 1;
	const indexOf = (date: string) => {
		const i = bars.findIndex((b) => date.slice(0, b.from.length) >= b.from && date.slice(0, b.to.length) <= b.to);
		if (i >= 0) return i;
		return date < bars[0].from ? 0 : last;
	};
	const [lo, hi] = draft ?? (range.length === 2 ? [indexOf(range[0]), indexOf(range[1])] : [0, last]);
	const apply = (a: number, b: number) => {
		setDraft(null);
		const [from, to] = [Math.min(a, b), Math.max(a, b)];
		setRange(from === 0 && to === last ? [] : [bars[from].from, bars[to].to]);
	};
	const letGo = () => draft && apply(...draft);
	const [from, to] = [Math.min(lo, hi), Math.max(lo, hi)];
	const inside = bars.slice(from, to + 1).reduce((n, b) => n + b.count, 0);
	// Square roots keep small bars visible next to a tall one
	const tallest = Math.sqrt(Math.max(...bars.map((b) => b.count), 1));
	const years = [...new Set(bars.map((b) => b.from.slice(0, 4)))];
	const ticks = years.length <= 5 ? years : years.filter((_, i) => i % Math.ceil(years.length / 5) === 0);
	const handle = { min: 0, max: last, step: 1, onPointerUp: letGo, onMouseUp: letGo, onTouchEnd: letGo, onKeyUp: letGo, onBlur: letGo, className: HANDLE };

	return (
		<div className="space-y-1.5" data-testid={`${field}-timeline`}>
			<p className="text-xs text-muted-foreground" aria-live="polite">
				{periodLabel(bars[from].from)} – {periodLabel(bars[to].to)} · {inside} document{inside === 1 ? '' : 's'}
				{undated > 0 && <span title={`No ${def.noun} date`}>{` · ${undated} undated${range.length === 2 ? ', hidden' : ''}`}</span>}
			</p>
			<div className="flex h-16 items-end gap-px">
				{bars.map((b, i) => (
					<button
						key={b.from}
						type="button"
						title={`${periodLabel(b.from)}${b.from === b.to ? '' : ` – ${periodLabel(b.to)}`}: ${b.count}`}
						aria-label={`${periodLabel(b.from)}: ${b.count} documents`}
						onClick={() => apply(i, i)}
						className={`min-w-0 flex-1 rounded-t-sm transition-colors ${i >= from && i <= to ? IN_RANGE : OUT_OF_RANGE}`}
						style={{ height: b.count ? `${Math.max(6, (Math.sqrt(b.count) / tallest) * 100)}%` : '2px' }}
					/>
				))}
			</div>
			<div className="relative h-4">
				<div className="absolute inset-x-0 top-[7px] h-px bg-border" />
				<input type="range" {...handle} value={lo} aria-label={`${def.noun} from`} onChange={(e) => setDraft([Number(e.target.value), hi])} />
				<input type="range" {...handle} value={hi} aria-label={`${def.noun} to`} onChange={(e) => setDraft([lo, Number(e.target.value)])} />
			</div>
			<div className="flex justify-between text-[11px] text-muted-foreground">
				{(years.length > 1 ? ticks : [periodLabel(bars[0].from), periodLabel(bars[last].to)]).map((t) => (
					<span key={t}>{t}</span>
				))}
			</div>
			<div className="flex flex-wrap gap-1.5 pt-1">
				{def.quick.map(([label, start]) => (
					<button key={label} type="button" onClick={() => setRange([start(), bars[last].to])} className="rounded-full border px-2 py-0.5 text-xs hover:bg-accent/50">
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

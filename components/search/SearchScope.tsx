'use client';

import type { ReactNode } from 'react';
import { CalendarRange, ChevronDown, Building2, Globe, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CONTROL } from '@/components/ui/control';
import { PUBLISHERS } from '@/lib/config/document-taxonomy';
import { monthLabel } from '@/lib/filters/published-range';
import { useAppStore } from '@/lib/stores/app-state';

const CONTINENTS = ['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania'];

/** One thing to search within: purple with what's picked once set, its choices below */
function ScopeButton({ icon: Icon, label, picked, onClear, children }: {
	icon: LucideIcon;
	label: string;
	/** What's picked, in words; empty when nothing is */
	picked: string;
	onClear: () => void;
	children: ReactNode;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					aria-label={picked ? `${label}: ${picked}` : label}
					className={`h-9 max-w-[14rem] gap-1 rounded-lg text-xs ${picked ? 'border-primary bg-primary-soft text-primary hover:bg-primary-soft' : ''}`}>
					<Icon className="h-3 w-3 shrink-0" />
					<span className="truncate">{picked || label}</span>
					<ChevronDown className="h-3 w-3 shrink-0" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 space-y-2 p-3" align="start">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold">{label}</h4>
					{picked && (
						<Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-xs">
							Clear
						</Button>
					)}
				</div>
				<p className="text-xs text-muted-foreground">Applies when you search.</p>
				{children}
			</PopoverContent>
		</Popover>
	);
}

/** A list of ticks for one scope */
function Ticks({ options, picked, onChange }: { options: { value: string; label: string }[]; picked: string[]; onChange: (next: string[]) => void }) {
	return (
		<div className="max-h-64 space-y-0.5 overflow-y-auto">
			{options.map((o) => (
				<label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50">
					<Checkbox
						checked={picked.includes(o.value)}
						onCheckedChange={() => onChange(picked.includes(o.value) ? picked.filter((v) => v !== o.value) : [...picked, o.value])}
					/>
					{o.label}
				</label>
			))}
		</div>
	);
}

const summary = (picked: string[]) => (picked.length <= 1 ? (picked[0] ?? '') : `${picked[0]} +${picked.length - 1}`);

/** "Search within": location, publisher and dates the search itself keeps to (the Filters column narrows afterwards) */
export function SearchScope() {
	const scope = useAppStore((s) => s.searchScope);
	const setScope = useAppStore((s) => s.setSearchScope);
	const continents = scope.continents ?? [];
	const publishers = scope.publishers ?? [];
	const [from = '', to = ''] = scope.published ?? [];
	const setDates = (a: string, b: string) => setScope('published', a || b ? [a || '1900-01', b || '2100-12'] : []);
	const datesLabel = from || to ? `${from && from !== '1900-01' ? monthLabel(from) : 'Any'} – ${to && to !== '2100-12' ? monthLabel(to) : 'now'}` : '';

	return (
		<div className="flex flex-wrap items-center gap-2" role="group" aria-label="Search within">
			<span className="text-xs text-muted-foreground">Search within</span>
			<ScopeButton icon={Globe} label="Geography" picked={summary(continents)} onClear={() => setScope('continents', [])}>
				<Ticks options={CONTINENTS.map((c) => ({ value: c, label: c }))} picked={continents} onChange={(v) => setScope('continents', v)} />
			</ScopeButton>
			<ScopeButton icon={Building2} label="Publisher" picked={summary(publishers)} onClear={() => setScope('publishers', [])}>
				<Ticks options={PUBLISHERS.map((p) => ({ value: p.value, label: p.value }))} picked={publishers} onChange={(v) => setScope('publishers', v)} />
			</ScopeButton>
			<ScopeButton icon={CalendarRange} label="Published" picked={datesLabel} onClear={() => setScope('published', [])}>
				<div className="grid grid-cols-2 gap-2 text-xs">
					<label className="space-y-1">
						<span className="text-muted-foreground">From</span>
						<input type="month" value={from === '1900-01' ? '' : from} onChange={(e) => setDates(e.target.value, to)} className={`${CONTROL} w-full px-2`} />
					</label>
					<label className="space-y-1">
						<span className="text-muted-foreground">To</span>
						<input type="month" value={to === '2100-12' ? '' : to} onChange={(e) => setDates(from, e.target.value)} className={`${CONTROL} w-full px-2`} />
					</label>
				</div>
				<p className="text-xs text-muted-foreground">Undated documents are left out once you set dates.</p>
			</ScopeButton>
		</div>
	);
}

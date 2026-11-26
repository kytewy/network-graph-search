import { Check } from 'lucide-react';
import { STEPS, type StepId } from '@/lib/workstreams/steps';

/** The six steps across the top of a workstream: done ✓, the current one, the rest to do */
export function StepBar({ step }: { step: StepId }) {
	const current = STEPS.findIndex((s) => s.id === step);
	return (
		<ol aria-label="Steps" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
			{STEPS.map((s, i) => {
				const state = i < current ? 'done' : i === current ? 'current' : 'todo';
				return (
					<li key={s.id} aria-current={state === 'current' ? 'step' : undefined}
						className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${state === 'current' ? 'border-primary bg-primary-soft font-medium text-secondary-foreground' : 'border-border bg-card'} ${state === 'todo' ? 'text-muted-foreground' : ''}`}>
						<span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${state === 'done' ? 'bg-ok text-white' : state === 'current' ? 'bg-primary text-white' : 'border border-border'}`}>
							{state === 'done' ? <Check className="size-3" aria-label="done" /> : i + 1}
						</span>
						{s.label}
					</li>
				);
			})}
		</ol>
	);
}

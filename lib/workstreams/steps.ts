/** A workstream's six steps, in order. Safe to import in the browser. */
export const STEPS = [
	{ id: 'brief', label: 'Brief' },
	{ id: 'collect', label: 'Collect' },
	{ id: 'read', label: 'Read' },
	{ id: 'analyze', label: 'Analyze' },
	{ id: 'report', label: 'Report' },
	{ id: 'monitor', label: 'Monitor' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

/** "Collect · step 2 of 6" */
export function stepLine(step: StepId): string {
	const i = STEPS.findIndex((s) => s.id === step);
	return `${STEPS[i].label} · step ${i + 1} of ${STEPS.length}`;
}

/** "Due Dec 12", "Due today", "Overdue by 3 days", or null without a date */
export function dueLine(due: Date | null, now: Date = new Date()): string | null {
	if (!due) return null;
	const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	const days = Math.round((day(due) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
	if (days === 0) return 'Due today';
	if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
	return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
}

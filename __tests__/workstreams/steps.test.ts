import { describe, expect, it } from 'vitest';
import { STEPS, dueLine, stepLine } from '@/lib/workstreams/steps';
import { createWorkstreamSchema } from '@/lib/contracts/workstreams';

describe('workstream steps', () => {
	it('has the six steps in order', () => {
		expect(STEPS.map((s) => s.label)).toEqual(['Brief', 'Collect', 'Read', 'Analyze', 'Report', 'Monitor']);
		expect(stepLine('collect')).toBe('Collect · step 2 of 6');
	});
});

describe('dueLine', () => {
	const now = new Date(2026, 10, 26, 17, 0);
	it('says due, today or overdue', () => {
		expect(dueLine(new Date('2026-12-12'), now)).toBe('Due Dec 12');
		expect(dueLine(new Date('2026-11-26'), now)).toBe('Due today');
		expect(dueLine(new Date('2026-11-25'), now)).toBe('Overdue by 1 day');
		expect(dueLine(null, now)).toBeNull();
	});
});

describe('creating a workstream', () => {
	it('needs a name; goal and due date are optional', () => {
		expect(createWorkstreamSchema.safeParse({ name: '  ' }).success).toBe(false);
		expect(createWorkstreamSchema.parse({ name: ' EU vs Canada ', dueOn: '2026-12-12' })).toEqual({ name: 'EU vs Canada', dueOn: '2026-12-12' });
		expect(createWorkstreamSchema.safeParse({ name: 'x', dueOn: 'next week' }).success).toBe(false);
	});
});

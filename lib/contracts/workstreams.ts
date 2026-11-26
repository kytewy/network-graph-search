/** What creating a workstream accepts. Safe to import in the browser. */
import { z } from 'zod';

export const createWorkstreamSchema = z.object({
	name: z.string().trim().min(1, 'Give it a name').max(120),
	/** What the work is for: "Brief the risk committee on which rules are binding, and by when" */
	goal: z.string().trim().max(500).optional(),
	dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-12-12').optional(),
});

export type CreateWorkstream = z.infer<typeof createWorkstreamSchema>;

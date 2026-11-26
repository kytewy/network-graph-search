/** What "Add by link" accepts. Safe to import in the browser. */
import { z } from 'zod';
import taxonomy from '@/lib/config/document-taxonomy.json';

const values = (entries: { value: string }[]) => entries.map((e) => e.value) as [string, ...string[]];

export const linkPreviewRequestSchema = z.object({ url: z.string().trim().min(1).max(2000) });

export const addLinkRequestSchema = linkPreviewRequestSchema.extend({
	/** Overrides the page's own title */
	title: z.string().trim().min(1).max(300).optional(),
	publisher: z.enum(values(taxonomy.publishers)),
	documentType: z.enum(values(taxonomy.documentTypes)),
	country: z.string().trim().min(1).max(80).optional(),
	continent: z.string().trim().min(1).max(40).optional(),
});

export type AddLinkRequest = z.infer<typeof addLinkRequestSchema>;

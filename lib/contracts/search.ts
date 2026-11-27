/**
 * The search rulebook: what a valid search request and reply look like.
 * The route checks every request with it, and the app checks every reply,
 * so a bad request or an odd reply fails with a clear message instead of
 * breaking the graph further along.
 *
 * Safe to import in the browser: no server-only code here.
 */
import { z } from 'zod';

export const SEARCH_LIMITS = {
	/** Longest query accepted */
	MAX_QUERY_CHARS: 500,
	/** Most results per search; matches SEARCH_CONFIG.MAX_TOP_K in the UI */
	MAX_TOP_K: 100,
	DEFAULT_TOP_K: 10,
} as const;

const topKError = `topK must be a whole number from 1 to ${SEARCH_LIMITS.MAX_TOP_K}`;

export const searchRequestSchema = z.object({
	query: z
		.string({ error: 'Query parameter is required' })
		.trim()
		.min(1, { error: 'Query parameter is required' })
		.max(SEARCH_LIMITS.MAX_QUERY_CHARS, {
			error: `Query must be under ${SEARCH_LIMITS.MAX_QUERY_CHARS} characters`,
		}),
	// Older clients sent topK as text, so numbers in text are accepted too
	topK: z.coerce
		.number({ error: topKError })
		.int({ error: topKError })
		.min(1, { error: topKError })
		.max(SEARCH_LIMITS.MAX_TOP_K, { error: topKError })
		.default(SEARCH_LIMITS.DEFAULT_TOP_K),
	// Not sent by the app today (filters narrow the page in the browser);
	// kept for search-scope filters (P1-8)
	filters: z.record(z.string(), z.unknown()).optional(),
});

/** A passage of a document that matched the search: where it sits, its heading and its text */
export const passageMatchSchema = z.object({
	position: z.number(),
	heading: z.string().nullable(),
	start: z.number(),
	text: z.string(),
	score: z.number(),
});

/** One document as the search route sends it. */
export const apiNodeSchema = z.object({
	id: z.string(),
	label: z.string(),
	score: z.number(),
	similarity: z.number(),
	publisher: z.string(),
	documentType: z.string(),
	summary: z.string(),
	content: z.string(),
	continent: z.string(),
	country: z.string(),
	size: z.number(),
	url: z.string().optional(),
	tags: z.array(z.string()),
	/** Its best matching passages (at most 3), and how many matched in all */
	passages: z.array(passageMatchSchema).optional(),
	matches: z.number().optional(),
	/** When it was published, YYYY-MM-DD (from Postgres; missing when undated) */
	published: z.string().optional(),
	/** When it was added to Lantern, YYYY-MM-DD */
	added: z.string().optional(),
});

/** A link between two documents in the results. */
export const apiEdgeSchema = z.object({
	id: z.string(),
	source: z.string(),
	target: z.string(),
	label: z.string(),
	type: z.string(),
	weight: z.number(),
});

export const searchResponseSchema = z.object({
	nodes: z.array(apiNodeSchema),
	edges: z.array(apiEdgeSchema),
});

export type SearchRequest = z.input<typeof searchRequestSchema>;
export type ApiNode = z.infer<typeof apiNodeSchema>;
export type PassageMatch = z.infer<typeof passageMatchSchema>;
export type ApiEdge = z.infer<typeof apiEdgeSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;

type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

/** Checks a request body; on failure returns the first problem in plain words. */
export function parseSearchRequest(body: unknown): Parsed<z.infer<typeof searchRequestSchema>> {
	const result = searchRequestSchema.safeParse(body ?? {});
	if (result.success) return { ok: true, data: result.data };
	return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid search request' };
}

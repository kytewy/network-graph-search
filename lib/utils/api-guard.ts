/**
 * API guard helpers: rate limiting, input limits and safe error responses.
 *
 * The app is deployed as a public demo, and several routes call paid
 * services (OpenAI, Pinecone) or write data. These helpers keep a single
 * visitor from running up costs or tying up the server.
 *
 * The rate limiter is in-memory, so it is per server instance. That is
 * enough for a single Render instance; use a shared store (e.g. Redis)
 * if the app is scaled out.
 */
import { NextRequest, NextResponse } from 'next/server';
import { captureServerError } from '@/lib/observability/posthog-server';
import { log } from '@/lib/observability/logger';
import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';

export const LIMITS = {
	/** Max nodes sent to an LLM in one request */
	MAX_NODES_LLM: PROMPT_CONFIG.MAX_NODES_PER_REQUEST,
	/** Max nodes accepted for clustering */
	MAX_NODES_CLUSTER: 500,
	/** Content per node is truncated to this many characters */
	MAX_CONTENT_CHARS: 20_000,
	/** Max length of a user-written prompt */
	MAX_PROMPT_CHARS: 2_000,
	/** Max length of a search query */
	MAX_QUERY_CHARS: 500,
	/** Matches SEARCH_CONFIG.MAX_TOP_K in the UI */
	MAX_TOP_K: 100,
	/** Max documents changed by one tag request */
	MAX_TAG_DOCS: 100,
	/** Max length of a tag */
	MAX_TAG_CHARS: 50,
	/** Python clustering is killed after this long */
	PYTHON_TIMEOUT_MS: 30_000,
} as const;

/** Requests allowed per IP per window, by route group */
export const RATE_LIMITS = {
	llm: { limit: 20, windowMs: 60_000 },
	cluster: { limit: 10, windowMs: 60_000 },
	search: { limit: 60, windowMs: 60_000 },
	tags: { limit: 30, windowMs: 60_000 },
} as const;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	return request.headers.get('x-real-ip') ?? 'unknown';
}

function pruneExpired(now: number) {
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}

/**
 * Fixed-window rate limit per IP.
 * Returns a 429 response when the caller is over the limit, otherwise null.
 */
export function rateLimit(
	request: NextRequest,
	group: keyof typeof RATE_LIMITS
): NextResponse | null {
	const { limit, windowMs } = RATE_LIMITS[group];
	const now = Date.now();
	const key = `${group}:${clientIp(request)}`;
	const bucket = buckets.get(key);

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		if (buckets.size > 10_000) pruneExpired(now);
		return null;
	}

	bucket.count += 1;
	if (bucket.count > limit) {
		const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
		// Only the first blocked request per window, so a flood doesn't flood the logs
		if (bucket.count === limit + 1) log.warn('Rate limit hit', { group });
		return NextResponse.json(
			{ error: 'Too many requests. Please wait a moment and try again.' },
			{ status: 429, headers: { 'Retry-After': String(retryAfter) } }
		);
	}
	return null;
}

/** Test helper: clears all rate-limit state. */
export function resetRateLimits() {
	buckets.clear();
}

export function badRequest(message: string) {
	return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Logs the real error on the server and returns a generic message,
 * so internal details (stack traces, provider errors) never reach the browser.
 */
export function serverError(
	context: string,
	error: unknown,
	message = 'Internal server error'
) {
	console.error(`[${context}]`, error);
	// Routes catch their own errors, so Next.js never sees them: report here
	captureServerError(error, { context });
	log.error(message, { context, error: error instanceof Error ? error.message : String(error) });
	return NextResponse.json({ error: message }, { status: 500 });
}

/** Truncates long string fields so oversized payloads can't blow up prompts or memory. */
export function truncate(value: unknown, maxChars: number): string {
	if (typeof value !== 'string') return '';
	return value.length > maxChars ? value.slice(0, maxChars) : value;
}

/**
 * Tag writes change data in Pinecone. They are allowed in development,
 * and in production only when ALLOW_TAG_WRITES=true is set.
 */
export function tagWritesAllowed(): boolean {
	return (
		process.env.NODE_ENV !== 'production' ||
		process.env.ALLOW_TAG_WRITES === 'true'
	);
}

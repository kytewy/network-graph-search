/**
 * What the Sources page shows: every document in Postgres, how it arrived, and counts per source.
 * Server only (reads the database).
 */
import { db } from '@/lib/db/client';

export const SOURCES = ['index', 'link', 'upload', 'web'] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = { index: 'Index', link: 'Link', upload: 'Upload', web: 'Web' };

export type SourceRow = {
	id: string;
	title: string;
	url: string | null;
	source: Source;
	publisher: string | null;
	country: string | null;
	bodyLength: number;
	addedAt: Date;
	publishedAt: Date | null;
};

export type SortKey = 'added' | 'published';
export type SourceFilters = { q: string; source: Source | null; sort: SortKey; dir: 'asc' | 'desc' };

export const PAGE_SIZE = 200;

/** Reads ?q= and ?source= from the page's search params, ignoring anything unexpected. */
export function parseFilters(params: Record<string, string | string[] | undefined>): SourceFilters {
	const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
	const q = one(params.q).trim().slice(0, 200);
	const s = one(params.source);
	return {
		q,
		source: (SOURCES as readonly string[]).includes(s) ? (s as Source) : null,
		sort: one(params.sort) === 'published' ? 'published' : 'added',
		dir: one(params.dir) === 'asc' ? 'asc' : 'desc',
	};
}

/** How many documents came from each source (all four, zeros included). */
export async function sourceCounts(): Promise<Record<Source, number>> {
	const rows = await db()<{ source: Source; n: number }[]>`
		SELECT source, count(*)::int AS n FROM documents GROUP BY source`;
	const counts = { index: 0, link: 0, upload: 0, web: 0 };
	for (const r of rows) counts[r.source] = r.n;
	return counts;
}

/** The newest documents matching the filters, at most PAGE_SIZE. */
export async function listSources({ q, source, sort, dir }: SourceFilters): Promise<SourceRow[]> {
	const sql = db();
	const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
	return sql<SourceRow[]>`
		SELECT id, title, url, source, publisher, country, body_length AS "bodyLength", added_at AS "addedAt",
			published_at AS "publishedAt"
		FROM documents
		WHERE ${source ? sql`source = ${source}` : sql`true`}
		  AND ${q ? sql`(title ILIKE ${like} OR publisher ILIKE ${like})` : sql`true`}
		ORDER BY ${sql.unsafe(ORDER[sort][dir])}, title
		LIMIT ${PAGE_SIZE}`;
}

// Whitelisted ORDER BY clauses (never built from the request); undated documents always last
const ORDER: Record<SortKey, Record<'asc' | 'desc', string>> = {
	added: { asc: 'added_at ASC', desc: 'added_at DESC' },
	published: { asc: 'published_at ASC NULLS LAST', desc: 'published_at DESC NULLS LAST' },
};

/** A publication date, e.g. "Jul 12, 2024" (dates are stored without a time, so read them as UTC) */
export function formatPublished(date: Date | null): string {
	return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—';
}

/** The exact moment a document was added, for the hover text */
export function formatAddedExact(date: Date): string {
	return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Yesterday", or a short date like "Nov 20". */
export function formatAdded(date: Date, now: Date = new Date()): string {
	const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const diff = Math.round((day(now) - day(date)) / 86_400_000);
	if (diff === 0) return 'Today';
	if (diff === 1) return 'Yesterday';
	const sameYear = date.getFullYear() === now.getFullYear();
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

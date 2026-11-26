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
};

export type SourceFilters = { q: string; source: Source | null };

export const PAGE_SIZE = 200;

/** Reads ?q= and ?source= from the page's search params, ignoring anything unexpected. */
export function parseFilters(params: Record<string, string | string[] | undefined>): SourceFilters {
	const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
	const q = one(params.q).trim().slice(0, 200);
	const s = one(params.source);
	return { q, source: (SOURCES as readonly string[]).includes(s) ? (s as Source) : null };
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
export async function listSources({ q, source }: SourceFilters): Promise<SourceRow[]> {
	const sql = db();
	const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
	return sql<SourceRow[]>`
		SELECT id, title, url, source, publisher, country, body_length AS "bodyLength", added_at AS "addedAt"
		FROM documents
		WHERE ${source ? sql`source = ${source}` : sql`true`}
		  AND ${q ? sql`(title ILIKE ${like} OR publisher ILIKE ${like})` : sql`true`}
		ORDER BY added_at DESC, title
		LIMIT ${PAGE_SIZE}`;
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

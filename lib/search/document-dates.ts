import { db } from '@/lib/db/client';

export type DocumentDates = { published?: string; added?: string };

/** Each document's publication date and when it was added (YYYY-MM-DD), from Postgres; none if it can't be reached */
export async function documentDates(ids: string[]): Promise<Map<string, DocumentDates>> {
	if (ids.length === 0) return new Map();
	try {
		const sql = db();
		const rows = await sql<{ id: string; published: string | null; added: string }[]>`
			SELECT id, to_char(published_at, 'YYYY-MM-DD') AS published, to_char(added_at, 'YYYY-MM-DD') AS added
			FROM documents WHERE id IN ${sql(ids)}`;
		return new Map(rows.map((r) => [r.id, { ...(r.published && { published: r.published }), added: r.added }]));
	} catch {
		// Search still works without Postgres; the timelines just have no dates
		return new Map();
	}
}

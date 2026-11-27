import { db } from '@/lib/db/client';

/** Each document's publication date (YYYY-MM-DD) from Postgres; none if the database can't be reached */
export async function publishedDates(ids: string[]): Promise<Map<string, string>> {
	if (ids.length === 0) return new Map();
	try {
		const sql = db();
		const rows = await sql<{ id: string; published: string }[]>`
			SELECT id, to_char(published_at, 'YYYY-MM-DD') AS published
			FROM documents WHERE id IN ${sql(ids)} AND published_at IS NOT NULL`;
		return new Map(rows.map((r) => [r.id, r.published]));
	} catch {
		// Search still works without Postgres; the timeline just has no dates
		return new Map();
	}
}

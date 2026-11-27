/** Setting a document's publication date: in Postgres, and in Pinecone so a search can keep to dates */
import { Pinecone } from '@pinecone-database/pinecone';
import { db } from '@/lib/db/client';
import { passagesNamespace } from '@/lib/passages/passages.mjs';
import { aiDate } from './find-date';

export type PublishedBy = 'index' | 'page' | 'ai' | 'you';

/** Most undated documents one press of "Find missing dates" checks (each is one AI call) */
export const FIND_DATES_PER_RUN = 15;

/** YYYY-MM-DD → 202407, as Pinecone keeps it */
const monthOf = (date: string) => Number(date.slice(0, 4)) * 100 + Number(date.slice(5, 7));

function index() {
	const { PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_INDEX_HOST } = process.env;
	if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) throw new Error('Pinecone configuration missing');
	return new Pinecone({ apiKey: PINECONE_API_KEY }).index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST || undefined);
}

/** Saves the date, then labels the document's search record and its passages with its month */
export async function setPublished(id: string, date: string, by: PublishedBy): Promise<void> {
	const sql = db();
	await sql`UPDATE documents SET published_at = ${date}, published_by = ${by} WHERE id = ${id}`;
	const passages = await sql<{ position: number }[]>`SELECT position FROM passages WHERE document_id = ${id}`;
	const metadata = { published_month: monthOf(date) };
	const pinecone = index();
	await pinecone.namespace(process.env.PINECONE_NAMESPACE || 'example-namespace').update({ id, metadata });
	const inPassages = pinecone.namespace(passagesNamespace());
	for (const p of passages) await inPassages.update({ id: `${id}#p${p.position}`, metadata });
}

/** Documents with no publication date, and how many of those the AI hasn't looked at yet */
export async function undatedCounts(): Promise<{ undated: number; unchecked: number }> {
	const [row] = await db()<{ undated: number; unchecked: number }[]>`
		SELECT count(*)::int AS undated, count(*) FILTER (WHERE published_by IS NULL)::int AS unchecked
		FROM documents WHERE published_at IS NULL`;
	return row ?? { undated: 0, unchecked: 0 };
}

/** The AI's first pass over undated documents it hasn't checked yet, newest first; returns what it found */
export async function findMissingDates(): Promise<{ checked: number; found: { id: string; title: string; date: string }[] }> {
	const docs = await db()<{ id: string; title: string; url: string | null; body: string }[]>`
		SELECT id, title, url, body FROM documents
		WHERE published_at IS NULL AND published_by IS NULL AND body IS NOT NULL AND body <> ''
		ORDER BY added_at DESC LIMIT ${FIND_DATES_PER_RUN}`;
	const found: { id: string; title: string; date: string }[] = [];
	for (const doc of docs) {
		const date = await aiDate(doc);
		// Checked and nothing found: marked so the next run moves on (you can still set it by hand)
		if (!date) {
			await db()`UPDATE documents SET published_by = 'ai' WHERE id = ${doc.id}`;
			continue;
		}
		await setPublished(doc.id, date, 'ai');
		found.push({ id: doc.id, title: doc.title, date });
	}
	return { checked: docs.length, found };
}

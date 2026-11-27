/**
 * Saves a fetched article: the full text in Postgres (the system of record), then a search copy in
 * Pinecone so it shows up in search and on the graph. Adding the same link again returns the first copy.
 */
import { createHash } from 'node:crypto';
import { Pinecone } from '@pinecone-database/pinecone';
import { db } from '@/lib/db/client';
import type { AddLinkRequest } from '@/lib/contracts/sources';
import type { Article } from './extract';
import { indexPassages } from '@/lib/passages/store';
import { aiDate } from './find-date';

/** Pinecone keeps a cut copy: the embedding sees the start, metadata stays under its 40 KB limit */
export const SEARCH_COPY = { chunkChars: 10_000, contentChars: 15_000, summaryChars: 2_000 } as const;

/** The same link always gets the same id (query string kept, #fragment and trailing slash dropped) */
export function linkId(url: string): string {
	const u = new URL(url);
	u.hash = '';
	const key = u.toString().replace(/\/$/, '').toLowerCase();
	return `link-${createHash('sha256').update(key).digest('hex').slice(0, 16)}`;
}

/** YYYY-MM-DD → 202407, as Pinecone keeps it */
const monthOf = (date: string) => Number(date.slice(0, 4)) * 100 + Number(date.slice(5, 7));

/** The record Pinecone stores, shaped like the scraped index's records */
export function searchRecord(id: string, url: string, title: string, article: Article, labels: AddLinkRequest, published: string | null = null) {
	const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}... [Content truncated]` : s);
	return {
		_id: id,
		chunk_text: `${title}. ${article.text}`.slice(0, SEARCH_COPY.chunkChars),
		label: title,
		summary: article.excerpt.slice(0, SEARCH_COPY.summaryChars),
		content: cut(article.text, SEARCH_COPY.contentChars),
		publisher: labels.publisher,
		documentType: labels.documentType,
		...(labels.country && { country: labels.country }),
		...(labels.continent && { continent: labels.continent }),
		url,
		source: 'link',
		...(published && { published_month: monthOf(published) }),
	};
}

export type SavedLink = { id: string; title: string; created: boolean };

export async function saveLink(url: string, article: Article, labels: AddLinkRequest): Promise<SavedLink> {
	const id = linkId(url);
	const title = labels.title ?? article.title;
	const sql = db();
	// The date the page states; if none, the AI's first pass (no date beats a failed add)
	const fromAi = article.published ? null : await aiDate({ title, url, body: article.text }).catch(() => null);
	const published = article.published ?? fromAi;
	const by = article.published ? 'page' : 'ai';
	const inserted = await sql`
		INSERT INTO documents (id, title, url, source, publisher, document_type, country, continent, summary, body, published_at, published_by)
		VALUES (${id}, ${title}, ${url}, 'link', ${labels.publisher}, ${labels.documentType}, ${labels.country ?? null},
			${labels.continent ?? null}, ${article.excerpt}, ${article.text}, ${published}, ${by})
		ON CONFLICT (id) DO NOTHING RETURNING id`;
	if (inserted.length === 0) {
		const [existing] = await sql<{ title: string }[]>`SELECT title FROM documents WHERE id = ${id}`;
		return { id, title: existing?.title ?? title, created: false };
	}
	try {
		await pineconeNamespace().upsertRecords([searchRecord(id, url, title, article, labels, published)]);
		await indexPassages({ ...labels, id, title, body: article.text, url, source: 'link', publishedMonth: published ? monthOf(published) : null });
	} catch (error) {
		// Not searchable means not added: take the row (and its passages) back out so a retry starts clean
		await sql`DELETE FROM documents WHERE id = ${id}`;
		throw error;
	}
	return { id, title, created: true };
}

function pineconeNamespace() {
	const { PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_INDEX_HOST } = process.env;
	if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) throw new Error('Pinecone configuration missing');
	// Same index and namespace as search (lib/services/vector_search.ts)
	const index = new Pinecone({ apiKey: PINECONE_API_KEY }).index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST || undefined);
	return index.namespace(process.env.PINECONE_NAMESPACE || 'example-namespace');
}

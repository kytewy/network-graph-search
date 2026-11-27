/**
 * Saves a document's passages: in Postgres (the text and where each starts) and in Pinecone's
 * passages namespace (for search). Server only. The import script does the same in bulk.
 */
import { Pinecone } from '@pinecone-database/pinecone';
import { db } from '@/lib/db/client';
import { passageRecord, passagesNamespace, splitPassages } from './passages.mjs';

export type PassageDoc = {
	id: string;
	title: string;
	body: string;
	url?: string | null;
	publisher?: string | null;
	documentType?: string | null;
	country?: string | null;
	continent?: string | null;
	source: string;
	publishedMonth?: number | null;
};

/** Pinecone takes at most 96 records per upsert with integrated embedding */
export const UPSERT_BATCH = 90;

export async function indexPassages(doc: PassageDoc): Promise<number> {
	const passages = splitPassages(doc.body);
	const sql = db();
	await sql.begin(async (tx) => {
		await tx`DELETE FROM passages WHERE document_id = ${doc.id}`;
		if (passages.length === 0) return;
		const rows = passages.map((p) => ({ document_id: doc.id, position: p.position, heading: p.heading, start_char: p.start, body: p.text }));
		await tx`INSERT INTO passages ${tx(rows)}`;
	});
	const records = passages.map((p) => passageRecord(doc, p, passages.length));
	const namespace = pinecone().namespace(passagesNamespace());
	for (let i = 0; i < records.length; i += UPSERT_BATCH) await namespace.upsertRecords(records.slice(i, i + UPSERT_BATCH));
	return passages.length;
}

function pinecone() {
	const { PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_INDEX_HOST } = process.env;
	if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) throw new Error('Pinecone configuration missing');
	return new Pinecone({ apiKey: PINECONE_API_KEY }).index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST || undefined);
}

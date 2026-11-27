#!/usr/bin/env node
/**
 * Copies each document's publication month from Postgres into Pinecone (published_month, e.g. 202407),
 * on the document's record and on its passages, so a search can keep to a range of dates.
 *
 *   npm run db:index-dates        (or: docker compose run --rm migrate node scripts/index-dates.mjs)
 *
 * Only updates metadata (nothing is embedded again). Safe to run again.
 */
import postgres from 'postgres';
import { Pinecone } from '@pinecone-database/pinecone';
import { passagesNamespace } from '../lib/passages/passages.mjs';

const AT_ONCE = 8;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One metadata update, waiting and retrying when Pinecone says to slow down */
async function update(namespace, id, month, tries = 5) {
	for (let attempt = 1; ; attempt++) {
		try {
			return await namespace.update({ id, metadata: { published_month: month } });
		} catch (error) {
			if (attempt >= tries || !/429|rate|Too Many/i.test(String(error?.message ?? error))) throw error;
			await sleep(2000 * attempt);
		}
	}
}

/** Runs the updates a few at a time */
async function updateAll(namespace, pairs) {
	for (let i = 0; i < pairs.length; i += AT_ONCE) {
		await Promise.all(pairs.slice(i, i + AT_ONCE).map(([id, month]) => update(namespace, id, month)));
	}
}

async function main() {
	try {
		process.loadEnvFile?.();
	} catch {}
	const { DATABASE_URL, PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_INDEX_HOST, PINECONE_NAMESPACE } = process.env;
	if (!DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example)');
	if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) throw new Error('PINECONE_API_KEY and PINECONE_INDEX_NAME must be set');
	const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
	const index = new Pinecone({ apiKey: PINECONE_API_KEY }).index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST || undefined);
	try {
		const docs = await sql`
			SELECT id, to_char(published_at, 'YYYYMM')::int AS month FROM documents WHERE published_at IS NOT NULL`;
		const passages = await sql`
			SELECT p.document_id || '#p' || p.position AS id, to_char(d.published_at, 'YYYYMM')::int AS month
			FROM passages p JOIN documents d ON d.id = p.document_id WHERE d.published_at IS NOT NULL`;
		await updateAll(index.namespace(PINECONE_NAMESPACE || 'example-namespace'), docs.map((d) => [d.id, d.month]));
		await updateAll(index.namespace(passagesNamespace()), passages.map((p) => [p.id, p.month]));
		console.log(`Dated ${docs.length} documents and ${passages.length} passages`);
	} finally {
		await sql.end();
	}
}

main().catch((error) => {
	console.error(error.message ?? error);
	process.exit(1);
});

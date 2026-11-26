#!/usr/bin/env node
/**
 * Splits every document in Postgres into passages and indexes them for search.
 *
 *   npm run db:index-passages        (or: docker compose run --rm migrate node scripts/index-passages.mjs)
 *
 * Safe to run again: each document's passages are replaced, in Postgres and in Pinecone.
 */
import postgres from 'postgres';
import { Pinecone } from '@pinecone-database/pinecone';
import { passageRecord, passagesNamespace, splitPassages } from '../lib/passages/passages.mjs';

const BATCH = 90;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Upserts one batch, waiting and retrying when Pinecone says to slow down */
async function upsert(namespace, records, tries = 5) {
	for (let attempt = 1; ; attempt++) {
		try {
			return await namespace.upsertRecords(records);
		} catch (error) {
			if (attempt >= tries || !/429|rate|Too Many/i.test(String(error?.message ?? error))) throw error;
			await sleep(2000 * attempt);
		}
	}
}

async function main() {
	try {
		process.loadEnvFile?.();
	} catch {}
	const { DATABASE_URL, PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_INDEX_HOST } = process.env;
	if (!DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example)');
	if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) throw new Error('PINECONE_API_KEY and PINECONE_INDEX_NAME must be set');
	const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
	const namespace = new Pinecone({ apiKey: PINECONE_API_KEY }).index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST || undefined).namespace(passagesNamespace());
	try {
		const docs = await sql`
			SELECT id, title, body, url, publisher, document_type AS "documentType", country, continent, source
			FROM documents WHERE body IS NOT NULL AND body <> ''`;
		let total = 0;
		let pending = [];
		for (const doc of docs) {
			const passages = splitPassages(doc.body);
			await sql.begin(async (tx) => {
				await tx`DELETE FROM passages WHERE document_id = ${doc.id}`;
				if (passages.length) await tx`INSERT INTO passages ${tx(passages.map((p) => ({ document_id: doc.id, position: p.position, heading: p.heading, start_char: p.start, body: p.text })))}`;
			});
			// Old passages past the new last one would linger in search: remove them by id prefix
			const old = [];
			for (let page = await namespace.listPaginated({ prefix: `${doc.id}#p` }); ; page = await namespace.listPaginated({ prefix: `${doc.id}#p`, paginationToken: page.pagination.next })) {
				old.push(...(page.vectors ?? []).map((v) => v.id).filter((id) => Number(id.split('#p')[1]) >= passages.length));
				if (!page.pagination?.next) break;
			}
			if (old.length) await namespace.deleteMany(old);
			pending.push(...passages.map((p) => passageRecord(doc, p, passages.length)));
			total += passages.length;
			while (pending.length >= BATCH) {
				await upsert(namespace, pending.splice(0, BATCH));
				await sleep(500);
			}
		}
		if (pending.length) await upsert(namespace, pending);
		console.log(`indexed ${total} passages from ${docs.length} documents into "${passagesNamespace()}"`);
	} finally {
		await sql.end();
	}
}

if (process.argv[1]?.endsWith('index-passages.mjs')) {
	main().catch((error) => {
		console.error(error.message ?? error);
		process.exit(1);
	});
}

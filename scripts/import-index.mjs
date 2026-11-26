#!/usr/bin/env node
/**
 * Loads the scraped index into Postgres with its full text and dates.
 *
 *   python scripts/upload_all_data.py --export   # writes scripts/data/index-export.json
 *   npm run db:import-index                      # reads it into the documents table
 *
 * Safe to run again: rows are updated in place, and each keeps the date it was first added.
 */
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const FILE = new URL('./data/index-export.json', import.meta.url);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** One exported record → one documents row (Pinecone's field names → the table's) */
export function toRow(record) {
	const date = (value) => (typeof value === 'string' && DATE.test(value) ? value : null);
	return {
		id: String(record._id),
		title: record.label,
		url: record.url ?? null,
		publisher: record.publisher ?? null,
		document_type: record.documentType ?? null,
		country: record.country ?? null,
		continent: record.continent ?? null,
		summary: record.summary ?? null,
		body: record.content ?? record.chunk_text ?? null,
		published_at: date(record.published_at),
		effective_at: date(record.effective_at),
	};
}

async function main() {
	try {
		process.loadEnvFile?.();
	} catch {}
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');
	const records = JSON.parse(await readFile(FILE, 'utf8').catch(() => {
		throw new Error('No export yet: run  python scripts/upload_all_data.py --export  first');
	}));
	const rows = records.map(toRow);
	const sql = postgres(url, { max: 1, onnotice: () => {} });
	try {
		const columns = Object.keys(rows[0]);
		const result = await sql`
			INSERT INTO documents ${sql(rows, columns)}
			ON CONFLICT (id) DO UPDATE SET
				title = EXCLUDED.title, url = EXCLUDED.url, publisher = EXCLUDED.publisher,
				document_type = EXCLUDED.document_type, country = EXCLUDED.country, continent = EXCLUDED.continent,
				summary = EXCLUDED.summary, body = EXCLUDED.body,
				published_at = EXCLUDED.published_at, effective_at = EXCLUDED.effective_at
			WHERE documents.source = 'index'
			RETURNING (xmax = 0) AS inserted`;
		const added = result.filter((r) => r.inserted).length;
		console.log(`imported ${rows.length} index documents: ${added} new, ${result.length - added} updated`);
	} finally {
		await sql.end();
	}
}

if (process.argv[1]?.endsWith('import-index.mjs')) {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}

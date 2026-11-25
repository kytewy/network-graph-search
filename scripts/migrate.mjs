#!/usr/bin/env node
/**
 * Applies new SQL files from db/migrations, in file-name order, each once.
 * Which ones have run is kept in the _migrations table.
 *
 *   DATABASE_URL=postgres://… node scripts/migrate.mjs
 *
 * Docker Compose runs this (the "migrate" service) before the app starts.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

const DIR = new URL('../db/migrations/', import.meta.url).pathname;

/** The migration files still to run, in order */
export function pending(files, applied) {
	const done = new Set(applied);
	return files.filter((f) => /^\d{4}_.+\.sql$/.test(f) && !done.has(f)).sort();
}

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set');
	const sql = postgres(url, { max: 1, onnotice: () => {} });
	try {
		await sql`CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
		const applied = (await sql`SELECT name FROM _migrations`).map((r) => r.name);
		const todo = pending(await readdir(DIR), applied);
		for (const file of todo) {
			const text = await readFile(join(DIR, file), 'utf8');
			// Each file runs in a transaction, so a failure leaves nothing half done
			await sql.begin(async (tx) => {
				await tx.unsafe(text);
				await tx`INSERT INTO _migrations (name) VALUES (${file})`;
			});
			console.log(`migrated ${file}`);
		}
		if (todo.length === 0) console.log('database up to date');
	} finally {
		await sql.end();
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}

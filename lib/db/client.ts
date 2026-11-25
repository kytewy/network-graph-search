/**
 * The app's one Postgres connection pool, for server code only (route handlers, scripts). Postgres is the
 * system of record; Pinecone keeps vectors and filter fields only.
 */
import postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;

// Kept on globalThis so hot reload in development doesn't open a new pool each time
const globalForDb = globalThis as unknown as { sql?: Sql };

/** The pool, opened on first use; throws a clear error when DATABASE_URL isn't set */
export function db(): Sql {
	if (!globalForDb.sql) {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set: start the database with docker compose');
		globalForDb.sql = postgres(url, { max: 10, idle_timeout: 30, onnotice: () => {} });
	}
	return globalForDb.sql;
}

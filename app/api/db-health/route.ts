import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { debugLog } from '@/lib/utils/debug';

const TABLES = ['workstreams', 'documents', 'searches', 'chats', 'reports'] as const;

/** Is the database reachable and set up? Answers with each table's row count */
export async function GET() {
	try {
		const sql = db();
		const counts = Object.fromEntries(
			await Promise.all(TABLES.map(async (t) => [t, Number((await sql`SELECT count(*)::int AS n FROM ${sql(t)}`)[0].n)] as const))
		);
		return NextResponse.json({ ok: true, counts });
	} catch (error) {
		debugLog('db-health', error);
		return NextResponse.json({ ok: false, error: 'Database not reachable or not set up' }, { status: 503 });
	}
}

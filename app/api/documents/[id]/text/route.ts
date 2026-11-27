import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { rateLimit } from '@/lib/utils/api-guard';

export const runtime = 'nodejs';

/** A document's full text from Postgres, so reading mode can show (and jump to) any passage */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const limited = rateLimit(request, 'search');
	if (limited) return limited;
	const { id } = await params;
	try {
		const [row] = await db()<{ body: string | null }[]>`SELECT body FROM documents WHERE id = ${id}`;
		if (!row?.body) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		return NextResponse.json({ body: row.body });
	} catch {
		// No database: reading mode falls back to the text it already has
		return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
	}
}

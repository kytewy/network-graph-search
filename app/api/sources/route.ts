import { NextRequest, NextResponse } from 'next/server';
import { addLinkRequestSchema } from '@/lib/contracts/sources';
import { extractArticle } from '@/lib/sources/extract';
import { LinkError, fetchPage } from '@/lib/sources/fetch-page';
import { saveLink } from '@/lib/sources/save-link';
import { badRequest, rateLimit, serverError, tagWritesAllowed } from '@/lib/utils/api-guard';

export const runtime = 'nodejs';

/** Adds a web page by link: fetch, keep the article text, save to Postgres, index in Pinecone */
export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'sources');
	if (limited) return limited;
	// Writes change Postgres and Pinecone: same switch as tag editing (on in development)
	if (!tagWritesAllowed()) return NextResponse.json({ error: 'Adding documents is turned off on this deployment' }, { status: 403 });
	const parsed = addLinkRequestSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid request');
	try {
		const page = await fetchPage(parsed.data.url);
		const article = extractArticle(page.html, page.url);
		const saved = await saveLink(page.url, article, parsed.data);
		return NextResponse.json({ ...saved, length: article.text.length }, { status: saved.created ? 201 : 200 });
	} catch (error) {
		if (error instanceof LinkError) return badRequest(error.message);
		return serverError('sources/add', error, 'Couldn’t add that link');
	}
}

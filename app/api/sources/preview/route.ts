import { NextRequest, NextResponse } from 'next/server';
import { linkPreviewRequestSchema } from '@/lib/contracts/sources';
import { extractArticle } from '@/lib/sources/extract';
import { LinkError, fetchPage } from '@/lib/sources/fetch-page';
import { badRequest, rateLimit, serverError } from '@/lib/utils/api-guard';

export const runtime = 'nodejs';

/** Fetches a link and shows what would be added (title, site, length, first lines). Saves nothing. */
export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'sources');
	if (limited) return limited;
	const parsed = linkPreviewRequestSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return badRequest('Send { url } with the link to preview');
	try {
		const page = await fetchPage(parsed.data.url);
		const article = extractArticle(page.html, page.url);
		return NextResponse.json({
			url: page.url,
			title: article.title,
			siteName: article.siteName,
			length: article.text.length,
			excerpt: article.excerpt,
		});
	} catch (error) {
		if (error instanceof LinkError) return badRequest(error.message);
		return serverError('sources/preview', error, 'Couldn’t preview that link');
	}
}

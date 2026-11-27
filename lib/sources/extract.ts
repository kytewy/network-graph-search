/** Pulls the readable article out of a page (Firefox Reader View's engine), dropping menus, ads and footers */
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { LinkError } from './fetch-page';
import { cleanDate, pageDate } from './find-date';

/** published: the date the page states (YYYY-MM-DD), if it states one */
export type Article = { title: string; text: string; excerpt: string; siteName: string | null; published: string | null };

/** Too little text to be worth adding (a login wall, an error page) */
export const MIN_TEXT_CHARS = 200;

export function extractArticle(html: string, url: string): Article {
	const { document } = parseHTML(html);
	// Readability resolves relative links against the page's address
	if (!document.querySelector('base')) document.head?.insertAdjacentHTML('afterbegin', `<base href="${url.replace(/"/g, '&quot;')}">`);
	const article = new Readability(document as unknown as Document).parse();
	const text = (article?.textContent ?? '').replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*(\n\s*)+/g, '\n\n').trim();
	if (text.length < MIN_TEXT_CHARS) throw new LinkError('No readable article text was found on that page');
	const title = (article?.title || document.title || new URL(url).hostname).trim().slice(0, 300);
	const published = cleanDate(article?.publishedTime) ?? pageDate(html);
	return { title, text, excerpt: (article?.excerpt || text.slice(0, 280)).trim(), siteName: article?.siteName?.trim() || null, published };
}

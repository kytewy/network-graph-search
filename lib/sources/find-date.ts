/** When a document was published: from the page's own tags, or an AI first pass over its text */
import { openai, parseJSONObject } from '@/lib/utils/openai-client';
import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';

/** How much text the AI reads: the start (where dates usually are) and the end (footers, "last updated") */
export const AI_DATE = { headChars: 4_000, tailChars: 1_500 } as const;

/** "2024-07-12", "2024-07" or "2024" → YYYY-MM-DD (first of the month or year); nothing before 1990 or in the future */
export function cleanDate(value: unknown, today = new Date()): string | null {
	const m = typeof value === 'string' ? value.trim().match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/) : null;
	if (!m) return null;
	const date = `${m[1]}-${m[2] ?? '01'}-${m[3] ?? '01'}`;
	const at = new Date(`${date}T00:00:00Z`);
	if (Number.isNaN(at.getTime()) || at.getUTCFullYear() < 1990 || at > today) return null;
	return date;
}

/** The publication date a page states in its tags (article:published_time, JSON-LD datePublished, <time>) */
export function pageDate(html: string): string | null {
	const patterns = [
		/<meta[^>]+(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|datePublished|date|dc\.date|DC\.date\.issued|citation_publication_date)["'][^>]*content=["']([^"']+)/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|datePublished)["']/i,
		/"datePublished"\s*:\s*"([^"]+)"/i,
		/<time[^>]+datetime=["']([^"']+)/i,
	];
	for (const p of patterns) {
		const date = cleanDate(html.match(p)?.[1]);
		if (date) return date;
	}
	return null;
}

/** Asks the model for the date the document itself was published (not dates it mentions); null when unsure */
export async function aiDate(doc: { title: string; url?: string | null; body: string }): Promise<string | null> {
	const text = doc.body.length > AI_DATE.headChars + AI_DATE.tailChars
		? `${doc.body.slice(0, AI_DATE.headChars)}\n[…]\n${doc.body.slice(-AI_DATE.tailChars)}`
		: doc.body;
	const response = await openai.chat.completions.create({
		model: PROMPT_CONFIG.MODEL,
		temperature: 0,
		max_tokens: 30,
		response_format: { type: 'json_object' },
		messages: [
			{
				role: 'system',
				content:
					'You find when a document was published or released. Use only a publication, release or "last updated" date stated in the text or the web address, ' +
					'never the dates of events, deadlines or laws it mentions. Reply as JSON: {"date": "YYYY-MM-DD"} (or "YYYY-MM" or "YYYY" if that is all it says), or {"date": null} if it does not say.',
			},
			{ role: 'user', content: `Title: ${doc.title}\nAddress: ${doc.url ?? 'none'}\n\n${text}` },
		],
	});
	return cleanDate(parseJSONObject(response.choices[0].message.content).date);
}

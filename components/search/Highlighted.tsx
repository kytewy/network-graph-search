import { Fragment } from 'react';

/** The query's words (3+ letters), for highlighting */
export function queryWords(query: string): string[] {
	return [...new Set(query.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]{2,}/gu) ?? [])];
}

/** Text with the search words marked in amber ("lit"), case-insensitive */
export function Highlighted({ text, query }: { text: string; query: string }) {
	const words = queryWords(query);
	if (words.length === 0) return <>{text}</>;
	const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
	return (
		<>
			{text.split(pattern).map((part, i) =>
				i % 2 === 1 ? <mark key={i} className="rounded-sm bg-lit-soft px-0.5 text-foreground">{part}</mark> : <Fragment key={i}>{part}</Fragment>
			)}
		</>
	);
}

/** "3 key sections · start: Model Inventory" (or the passage's first words when it has no heading) */
export function matchLine(matches: number, heading: string | null, text: string): string {
	const best = heading ?? `${text.split(/\s+/).slice(0, 5).join(' ')}…`;
	return matches > 1 ? `${matches} key sections · start: ${best}` : `Key section: ${best}`;
}

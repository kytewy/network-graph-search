/**
 * Turning an AI answer into a document: its title, the documents it cites
 * (names in [square brackets]), and links for those citations.
 */

export interface CitableDoc {
	id: string;
	label: string;
}

const CITE_PREFIX = '#cite-';

/** "[EU AI Act]" but not markdown links "[x](url)", images "![x]" or checkboxes "[ ]" / "[x]" */
const BRACKETS = /(?<![!\]\\])\[([^\[\]\n]{2,200})\](?![(:\[])/g;

const normalise = (text: string) =>
	text
		.toLowerCase()
		.replace(/[*_`"“”'’]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

/** Every name the answer cites, once each, in the order they first appear */
export function findCitations(markdown: string): string[] {
	const seen = new Set<string>();
	for (const [, name] of markdown.matchAll(BRACKETS)) {
		const clean = name.trim();
		if (clean.toLowerCase() !== 'x') seen.add(clean);
	}
	return [...seen];
}

/**
 * The document a cited name refers to: the same title, or one that starts
 * with the other (answers often shorten long titles, or add the subtitle).
 */
export function matchCitation(name: string, docs: readonly CitableDoc[]): CitableDoc | null {
	const n = normalise(name);
	if (n.length < 2) return null;
	return (
		docs.find((d) => normalise(d.label) === n) ??
		docs.find((d) => {
			const label = normalise(d.label);
			return label.length >= 4 && (label.startsWith(n) || n.startsWith(label));
		}) ??
		null
	);
}

/** The answer's first heading, or else the question, as a short title */
export function documentTitle(answer: string, question: string): string {
	const heading = answer.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m)?.[1];
	const title = (heading ?? question).replace(/[*_`]/g, '').trim();
	return title.length > 70 ? `${title.slice(0, 67)}…` : title;
}

/** Rewrites each matched citation as a link the document view can recognise */
export function linkCitations(markdown: string, docs: readonly CitableDoc[]): string {
	return markdown.replace(BRACKETS, (whole, name: string) => {
		const doc = matchCitation(name, docs);
		return doc ? `[${name}](${CITE_PREFIX}${encodeURIComponent(doc.id)})` : whole;
	});
}

/** The document id in a citation link's href, or null for an ordinary link */
export function citedId(href: string | undefined): string | null {
	return href?.startsWith(CITE_PREFIX) ? decodeURIComponent(href.slice(CITE_PREFIX.length)) : null;
}

/** A plain-text copy for "Download as text": markdown marks removed, links kept as their words */
export function toPlainText(markdown: string): string {
	return markdown
		.replace(/^\s{0,3}#{1,6}\s+/gm, '')
		.replace(/\*\*(.+?)\*\*|__(.+?)__/g, '$1$2')
		.replace(/(?<![*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

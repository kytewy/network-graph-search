/** Reading mode's paragraphs, each knowing where it sits in the text, so passages can be found and lit */
import type { PassageMatch } from '@/lib/contracts/search';

export type Paragraph = { text: string; start: number; end: number };

/** One paragraph per line, with its place in the text */
export function paragraphsOf(text: string): Paragraph[] {
	const out: Paragraph[] = [];
	let start = 0;
	for (const line of text.split('\n')) {
		out.push({ text: line, start, end: start + line.length });
		start += line.length + 1;
	}
	return out;
}

/** Whether a paragraph is part of a passage (they overlap in the text) */
export function inPassage(p: Paragraph, passage: Pick<PassageMatch, 'start' | 'text'>): boolean {
	return p.end > passage.start && p.start < passage.start + passage.text.length && p.text.trim().length > 0;
}

/** A match's label: its heading, or its first words */
export function matchLabel(passage: Pick<PassageMatch, 'heading' | 'text'>): string {
	return passage.heading ?? `${passage.text.split(/\s+/).slice(0, 6).join(' ')}…`;
}

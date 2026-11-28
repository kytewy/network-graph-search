/**
 * Key sections (P3): for each question, search ranks the sections of the chat's documents and sends each
 * document's best match; the AI also gets an outline of every document's sections and can ask for more
 * with read_section, giving a short reason each time. Server only (Postgres and Pinecone).
 */
import { db } from '@/lib/db/client';
import { searchPassages } from '@/lib/services/vector_search';
import { matchCitation } from './citations';
import type { ReceiptSection } from './receipt';

export const KEY_SECTIONS = {
	/** A best match below this score isn't sent: nothing in the document answers the question */
	minScore: 0.3,
	/** Most sections listed per document in the outline (the best-scoring, in reading order) */
	outlinePerDoc: 25,
	/** Most characters of one section sent */
	sectionChars: 2_200,
	/** Most sections the AI may ask for per answer */
	maxRequests: 12,
	/** Characters of a section kept in the receipt, enough to show and to light it in reading view */
	receiptSnippet: 300,
} as const;

export interface Section {
	position: number;
	heading: string | null;
	start: number;
	body: string;
	/** How well it answers the question, 0–1; missing when the search didn't rank it */
	score?: number;
}

/** Every chat document's sections (with scores for the question), and the best match of each */
export interface SectionPlan {
	byDoc: Map<string, Section[]>;
	best: Map<string, Section>;
	/** The search couldn't score sections this time: the outline has headings only */
	unscored: boolean;
}

/** Loads the documents' sections from Postgres and has the search score them for the question */
export async function planSections(question: string, ids: string[]): Promise<SectionPlan> {
	const plan: SectionPlan = { byDoc: new Map(), best: new Map(), unscored: false };
	if (ids.length === 0) return plan;
	try {
		const sql = db();
		const rows = await sql<{ document_id: string; position: number; heading: string | null; start: number; body: string }[]>`
			SELECT document_id, position, heading, start_char AS start, body FROM passages
			WHERE document_id IN ${sql(ids)} ORDER BY document_id, position`;
		for (const r of rows) plan.byDoc.set(r.document_id, [...(plan.byDoc.get(r.document_id) ?? []), { position: r.position, heading: r.heading, start: r.start, body: r.body }]);
	} catch {
		return plan; // No database: every document sends its opening, as before
	}
	const hits = question.trim() ? await searchPassages(question, 34, { document_id: { $in: ids } }) : [];
	if (hits.length === 0) plan.unscored = true;
	for (const hit of hits as { _score?: number; fields?: Record<string, unknown> }[]) {
		const section = plan.byDoc.get(String(hit.fields?.document_id))?.find((s) => s.position === Number(hit.fields?.position));
		if (section) section.score = hit._score ?? 0;
	}
	for (const [id, sections] of plan.byDoc) {
		const best = sections.reduce<Section | null>((b, s) => ((s.score ?? -1) > (b?.score ?? -1) ? s : b), null);
		// A one-section document goes whole, whatever its score
		if (sections.length === 1) plan.best.set(id, sections[0]);
		else if (best && (best.score ?? 0) >= KEY_SECTIONS.minScore) plan.best.set(id, best);
	}
	return plan;
}

/** A section's name in the outline: its heading, or its first words */
export const sectionLabel = (s: Pick<Section, 'heading' | 'body'>) => s.heading ?? `${s.body.split(/\s+/).slice(0, 8).join(' ')}…`;

/** The outline the AI chooses from: each document's sections, numbered, with their match to the question */
export function outlineText(docs: { id: string; title: string }[], plan: SectionPlan): string {
	const parts = docs.flatMap(({ id, title }) => {
		const sections = plan.byDoc.get(id);
		if (!sections || sections.length < 2) return [];
		const shown = sections.length <= KEY_SECTIONS.outlinePerDoc ? sections
			: [...sections].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, KEY_SECTIONS.outlinePerDoc).sort((a, b) => a.position - b.position);
		const lines = shown.map((s) => `  ${s.position + 1}. ${sectionLabel(s).slice(0, 80)}${s.score === undefined ? '' : ` (match ${Math.round(s.score * 100)}%)`}${plan.best.get(id) === s ? ' [included below]' : ''}`);
		return [`[${title}]\n${lines.join('\n')}`];
	});
	if (parts.length === 0) return '';
	return `Outline of the documents' sections${plan.unscored ? '' : ', with how well each matches the question'}:\n\n${parts.join('\n\n')}\n\n` +
		'Each document below comes with its best matching section (or its opening). If another section would help you answer, ' +
		'ask for it with read_section: the document title, the section number, and a reason of under 12 words. Ask only for what the question needs.';
}

export const READ_SECTION_TOOL = {
	type: 'function' as const,
	function: {
		name: 'read_section',
		description: 'Read one numbered section of a listed document, from the outline, when it would help answer the question.',
		parameters: {
			type: 'object',
			properties: {
				title: { type: 'string', description: 'The document title exactly as listed in bold brackets' },
				section: { type: 'integer', description: 'The section number from the outline' },
				why: { type: 'string', description: 'Why this section helps, in under 12 words' },
			},
			required: ['title', 'section', 'why'],
		},
	},
};

/** The receipt's record of one section sent */
export const receiptSection = (s: Section, by: ReceiptSection['by'], why?: string): ReceiptSection => ({
	position: s.position,
	heading: s.heading,
	start: s.start,
	text: s.body.slice(0, KEY_SECTIONS.receiptSnippet),
	chars: Math.min(s.body.length, KEY_SECTIONS.sectionChars),
	...(s.score !== undefined && { score: s.score }),
	by,
	...(why && { why: why.trim().slice(0, 120) }),
});

/**
 * Answers one read_section call: the section's text, recorded in `picked` for the receipt.
 * `left` is how many characters the reading budget still allows.
 */
export function serveSection(argumentsJson: string, docs: { id: string; label: string }[], plan: SectionPlan, picked: Map<string, ReceiptSection[]>, left: number): string {
	let args: { title?: unknown; section?: unknown; why?: unknown } = {};
	try {
		args = JSON.parse(argumentsJson) ?? {};
	} catch {
		// fall through: nothing asked
	}
	const doc = typeof args.title === 'string' ? matchCitation(args.title, docs) : null;
	if (!doc) return 'No document with that title is in the list.';
	const section = plan.byDoc.get(doc.id)?.find((s) => s.position === Number(args.section) - 1);
	if (!section) return 'That document has no section with that number.';
	const already = picked.get(doc.id) ?? [];
	if (already.some((s) => s.position === section.position)) return 'You already have this section above.';
	if ([...picked.values()].flat().filter((s) => s.by === 'ai').length >= KEY_SECTIONS.maxRequests || left <= 0) {
		return 'No more sections can be read for this answer. Answer from what you have.';
	}
	picked.set(doc.id, [...already, receiptSection(section, 'ai', typeof args.why === 'string' ? args.why : undefined)]);
	return `${sectionLabel(section)}\n${section.body.slice(0, Math.min(KEY_SECTIONS.sectionChars, left))}`;
}

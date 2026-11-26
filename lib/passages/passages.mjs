/**
 * Splits a document's text into passages, and shapes the search record Pinecone keeps for each.
 * Plain JavaScript so both the app and the import script (scripts/index-passages.mjs) use it.
 *
 * A passage is a run of whole paragraphs of about PASSAGE.target characters. A heading starts a new
 * passage and is remembered as the passage's heading; a paragraph longer than PASSAGE.max is split
 * at sentence ends. Each passage keeps its exact place in the text (start), for highlighting.
 */

export const PASSAGE = { target: 1500, max: 2200, min: 300, searchChars: 4000 };

/** @typedef {{ position: number, heading: string | null, start: number, text: string }} Passage */

/**
 * A short single line with no closing punctuation reads as a heading ("A.2 Scope", "Model inventory").
 * List items ("- size", "(a) …", "1) …") don't count, however short.
 */
export function isHeading(paragraph) {
	const line = paragraph.trim();
	if (line.startsWith('#')) return true;
	if (/^([-*•–]|\(?[a-z0-9]{1,3}\))\s/i.test(line)) return false;
	return line.length > 0 && line.length <= 80 && !line.includes('\n') && /[A-Za-z]/.test(line) && !/[.!?:;,]$/.test(line);
}

/** The text's paragraphs (each line; scraped and extracted text puts one paragraph per line), with where each starts and ends */
function paragraphs(text) {
	const out = [];
	const gap = /\n(?:[ \t]*\n)*/g;
	let from = 0;
	for (let m = gap.exec(text); ; m = gap.exec(text)) {
		const to = m ? m.index : text.length;
		const raw = text.slice(from, to);
		const lead = raw.length - raw.trimStart().length;
		if (raw.trim()) out.push({ start: from + lead, end: from + lead + raw.trim().length });
		if (!m) break;
		from = m.index + m[0].length;
	}
	return out;
}

/** A long paragraph's sentence runs, each up to PASSAGE.target characters */
function sentenceRuns(text, start, end) {
	const runs = [];
	const ends = /[.!?]["')\]]?\s+/g;
	ends.lastIndex = start;
	let from = start;
	let cut = start;
	for (let m = ends.exec(text); m && m.index < end; m = ends.exec(text)) {
		const stop = m.index + m[0].length;
		if (stop - from > PASSAGE.target && cut > from) {
			runs.push({ start: from, end: cut });
			from = cut;
		}
		cut = stop;
	}
	runs.push({ start: from, end });
	// A run still too long (one very long sentence, or none to break on) is cut at spaces
	return runs.flatMap((r) => {
		const parts = [];
		for (let s = r.start; s < r.end; ) {
			let e = Math.min(r.end, s + PASSAGE.max);
			if (e < r.end) e = Math.max(s + PASSAGE.min, text.lastIndexOf(' ', e));
			parts.push({ start: s, end: e });
			s = e;
		}
		return parts;
	});
}

/** @returns {Passage[]} */
export function splitPassages(text) {
	if (!text || !text.trim()) return [];
	const passages = [];
	let heading = null;
	let current = null; // { start, end, heading, body: has a paragraph that isn't a heading }
	const flush = () => {
		if (current) passages.push({ position: passages.length, heading: current.heading, start: current.start, text: text.slice(current.start, current.end).trim() });
		current = null;
	};
	for (const p of paragraphs(text)) {
		const size = p.end - p.start;
		if (isHeading(text.slice(p.start, p.end))) {
			// A new section starts a new passage, unless nothing but headings came before it
			if (current?.body) flush();
			heading = text.slice(p.start, p.end).replace(/^#+\s*/, '').trim();
			current = current ? { ...current, end: p.end, heading } : { start: p.start, end: p.end, heading, body: false };
			continue;
		}
		if (size > PASSAGE.max) {
			flush();
			for (const run of sentenceRuns(text, p.start, p.end)) passages.push({ position: passages.length, heading, start: run.start, text: text.slice(run.start, run.end).trim() });
			continue;
		}
		if (current && current.end - current.start + size > PASSAGE.target && current.end - current.start >= PASSAGE.min) flush();
		current = current ? { ...current, end: p.end, body: true } : { start: p.start, end: p.end, heading, body: true };
	}
	flush();
	return passages.filter((p) => p.text).map((p, position) => ({ ...p, position }));
}

/** The passage's search record, shaped like the documents' records so the same filters work */
export function passageRecord(doc, passage, total) {
	const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''));
	return defined({
		_id: `${doc.id}#p${passage.position}`,
		chunk_text: `${doc.title}${passage.heading ? ` · ${passage.heading}` : ''}\n${passage.text}`.slice(0, PASSAGE.searchChars),
		document_id: doc.id,
		position: passage.position,
		passages: total,
		start: passage.start,
		heading: passage.heading,
		label: doc.title,
		url: doc.url,
		publisher: doc.publisher,
		documentType: doc.documentType,
		country: doc.country,
		continent: doc.continent,
		source: doc.source,
	});
}

/**
 * Where passages live in Pinecone: their own namespace, beside the documents'
 * @param {Record<string, string | undefined>} [env]
 */
export function passagesNamespace(env = process.env) {
	return env.PINECONE_PASSAGES_NAMESPACE || `${env.PINECONE_NAMESPACE || 'example-namespace'}-passages`;
}

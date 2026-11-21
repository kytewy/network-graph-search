import taxonomy from './document-taxonomy.json';

/**
 * Who published a document (`publisher`) and what kind of document it is
 * (`documentType`). The lists live in document-taxonomy.json, which the
 * upload script also reads, so the app and the data can't drift apart.
 */
export interface TaxonomyEntry {
	value: string;
	color: string;
	description: string;
}

export const PUBLISHERS: readonly TaxonomyEntry[] = taxonomy.publishers;
export const DOCUMENT_TYPES: readonly TaxonomyEntry[] = taxonomy.documentTypes;

/** Colour for anything missing or not in the lists (e.g. data uploaded before the rename). */
export const UNKNOWN_COLOR = '#9ca3af';

const colorOf = (entries: readonly TaxonomyEntry[], value: string | undefined) =>
	entries.find((entry) => entry.value === value)?.color ?? UNKNOWN_COLOR;

export const publisherColor = (publisher: string | undefined) => colorOf(PUBLISHERS, publisher);
export const documentTypeColor = (documentType: string | undefined) =>
	colorOf(DOCUMENT_TYPES, documentType);

/**
 * Legend rows for the values actually on screen, in the taxonomy's order,
 * plus one "Unknown" row if any node has a missing or unrecognised value.
 */
export function legendEntries(
	entries: readonly TaxonomyEntry[],
	valuesOnScreen: readonly (string | undefined)[]
): { label: string; color: string }[] {
	const present = new Set(valuesOnScreen);
	const rows = entries
		.filter((entry) => present.has(entry.value))
		.map((entry) => ({ label: entry.value, color: entry.color }));
	const known = new Set(entries.map((entry) => entry.value));
	if (valuesOnScreen.some((value) => !value || !known.has(value))) {
		rows.push({ label: 'Unknown', color: UNKNOWN_COLOR });
	}
	return rows;
}

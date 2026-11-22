/** A short preview of a document's text, cut at a word near `maxLength`. */
export function contentPreview(content: string, maxLength: number): string {
	const trimmed = (content || '').trim();
	if (!trimmed) return 'No content available';
	if (trimmed.length <= maxLength) return trimmed;

	const cut = trimmed.substring(0, maxLength);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > maxLength * 0.8 ? cut.substring(0, lastSpace) : cut) + '...';
}

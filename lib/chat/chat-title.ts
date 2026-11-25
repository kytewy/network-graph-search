/** The longest chat name kept */
export const MAX_TITLE = 60;

/** Tidies an AI-written chat name: no quotes, no full stop, one line, not too long */
export function chatTitle(raw: string): string {
	const title = raw
		.split('\n')[0]
		.replace(/^["'“”‘’*#\s]+|["'“”‘’*\s]+$/g, '')
		.replace(/\.$/, '')
		.trim();
	return title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1)}…` : title;
}

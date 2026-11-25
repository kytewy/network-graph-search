/**
 * Lantern's colours, for code that can't read CSS variables (the graph draws
 * with WebGL). The light theme in app/globals.css uses the same values, and
 * __tests__/config/palette.test.ts keeps the two in step.
 *
 * Purple is for doing (buttons, selection, clusters). Amber ("lit") is for
 * what the AI was sent, read or cited. Grey is everything else.
 */
export const PALETTE = {
	page: '#ffffff',
	ink: '#1c1b22',
	muted: '#5e5c69',
	border: '#e4e3ea',
	sidebar: '#f3f2ee',
	primary: '#5b3fd9',
	primarySoft: '#ece9fc',
	lit: '#c77f00',
	litSoft: '#fce7b2',
	litInk: '#7a4a00',
	ok: '#14555a',
	warn: '#b4462f',
} as const;

/** CSS variable in globals.css (:root) → the palette entry it must equal. */
export const CSS_TOKENS: Readonly<Record<string, keyof typeof PALETTE>> = {
	'--background': 'page',
	'--foreground': 'ink',
	'--muted-foreground': 'muted',
	'--border': 'border',
	'--sidebar': 'sidebar',
	'--primary': 'primary',
	'--primary-soft': 'primarySoft',
	'--lit': 'lit',
	'--lit-soft': 'litSoft',
	'--lit-foreground': 'litInk',
	'--ok': 'ok',
	'--warn': 'warn',
};

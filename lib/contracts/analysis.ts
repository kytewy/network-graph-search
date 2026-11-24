/**
 * The chat rulebook: what a valid question to the AI looks like. The route
 * checks every request with it. A question can carry the last few turns of
 * the conversation so follow-ups ("and for Canada?") make sense.
 *
 * Safe to import in the browser: no server-only code here.
 */
import { z } from 'zod';

export const CHAT_LIMITS = {
	/** Questions and answers remembered for follow-ups */
	MEMORY_TURNS: 6,
	/** Longest question */
	MAX_PROMPT_CHARS: 2_000,
	/** Each remembered message is cut to this, so memory can't crowd out the documents */
	MAX_MEMORY_CHARS: 4_000,
} as const;

export interface ChatTurn {
	prompt: string;
	response: string;
}

const memoryMessage = z.object({
	role: z.enum(['user', 'assistant']),
	content: z.string().max(CHAT_LIMITS.MAX_MEMORY_CHARS),
});

export const analyzeRequestSchema = z.object({
	// Each document's fields are checked by the prompt builder
	nodes: z.array(z.record(z.string(), z.unknown()), { error: 'Invalid nodes provided' }),
	customPrompt: z
		.string()
		.max(CHAT_LIMITS.MAX_PROMPT_CHARS, { error: `Prompt must be text under ${CHAT_LIMITS.MAX_PROMPT_CHARS} characters` })
		.optional(),
	/** The workspace's goal ("…so I can brief the board Friday"), so answers stay aimed at it */
	goal: z.string().max(300, { error: 'Goal must be under 300 characters' }).optional(),
	/** What the answer may suggest changing (see chat actions below); none = no suggestions */
	// Suggestions are extras: options that don't fit are dropped, never a reason to refuse the question
	actionOptions: z.lazy(() => actionOptionsSchema).optional().catch(undefined),
	/** Send live updates (one line per document read) instead of one reply at the end */
	stream: z.boolean().optional(),
	history: z
		.array(memoryMessage)
		.max(CHAT_LIMITS.MEMORY_TURNS * 2, { error: `Send at most ${CHAT_LIMITS.MEMORY_TURNS} earlier turns` })
		.default([]),
});

export type AnalyzeRequest = z.input<typeof analyzeRequestSchema>;
export type MemoryMessage = z.infer<typeof memoryMessage>;

/**
 * The last few finished turns as chat messages, oldest first. Long messages
 * are cut so they always pass the rulebook.
 */
export function chatMemory(turns: readonly ChatTurn[], maxTurns: number = CHAT_LIMITS.MEMORY_TURNS): MemoryMessage[] {
	const cut = (text: string) => text.slice(0, CHAT_LIMITS.MAX_MEMORY_CHARS);
	return turns
		.slice(-maxTurns)
		.flatMap((t) => [
			{ role: 'user' as const, content: cut(t.prompt) },
			{ role: 'assistant' as const, content: cut(t.response) },
		]);
}

/*
 * Chat actions: an answer can suggest up to 3 buttons that change the view
 * ("Filter to Europe", "Colour by search", "Add OSFI E-23 to context").
 * The browser says what's available; the AI picks only from that; the
 * server checks every suggestion. Nothing changes until the user clicks.
 */
export const MAX_ACTIONS = 3;
/** Longest name or title an option can carry (document titles can be long) */
export const NAME_MAX = 300;
/** How many of each list the browser may send */
export const OPTION_LIMITS = { continents: 20, countries: 80, publishers: 30, searches: 20, colorModes: 20, clusterModes: 20, titles: 200 } as const;
const label = z.string().min(1).max(60);

export const chatActionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('filter'), filter: z.enum(['continents', 'countries', 'publishers', 'searches']), values: z.array(z.string().max(NAME_MAX)).min(1).max(10), label }),
	z.object({ type: z.literal('color'), mode: z.string().max(40), label }),
	z.object({ type: z.literal('cluster'), mode: z.string().max(40), label }),
	z.object({ type: z.literal('context'), titles: z.array(z.string().max(300)).min(1).max(10), label }),
]);
export type ChatAction = z.infer<typeof chatActionSchema>;

const names = (max: number) => z.array(z.string().max(NAME_MAX)).max(max).default([]);
export const actionOptionsSchema = z.object({
	continents: names(OPTION_LIMITS.continents),
	countries: names(OPTION_LIMITS.countries),
	publishers: names(OPTION_LIMITS.publishers),
	/** The workspace's searches: "1" = #1, "2+" = found by 2+ searches */
	searches: z.array(z.object({ value: z.string().max(4), query: z.string().max(NAME_MAX) })).max(OPTION_LIMITS.searches).default([]),
	colorModes: names(OPTION_LIMITS.colorModes),
	clusterModes: names(OPTION_LIMITS.clusterModes),
	titles: names(OPTION_LIMITS.titles),
});
export type ActionOptions = z.infer<typeof actionOptionsSchema>;

/** The instruction that tells the AI which actions it may suggest */
export function actionsInstruction(o: ActionOptions): string {
	const list = (xs: readonly string[]) => (xs.length ? xs.map((x) => JSON.stringify(x)).join(', ') : '(none)');
	return [
		'After your answer, if a change to the view would clearly help the user follow up, add at most 3 suggestions in a fenced block:',
		'```actions',
		'[{"type":"filter","filter":"continents","values":["Europe"],"label":"Filter to Europe"}]',
		'```',
		'Types: "filter" (filter: continents | countries | publishers | searches; values from the lists below),',
		'"color" (mode) and "cluster" (mode) to change how the graph is coloured or grouped, "context" (titles: documents to add to the analysis context).',
		'Labels are short buttons (under 6 words). Use only these values; leave the block out if nothing fits.',
		`continents: ${list(o.continents)}`,
		`countries: ${list(o.countries)}`,
		`publishers: ${list(o.publishers)}`,
		`searches: ${o.searches.length ? o.searches.map((s) => `${JSON.stringify(s.value)} (${s.query})`).join(', ') : '(none)'}`,
		`color modes: ${list(o.colorModes)}`,
		`cluster modes: ${list(o.clusterModes)}`,
		`titles: ${list(o.titles.slice(0, 60))}`,
	].join('\n');
}

const ACTIONS_BLOCK = /```actions\s*([\s\S]*?)```/;

/**
 * Splits an answer into its text and its suggested actions. Suggestions that
 * break the rules or name something that isn't available are dropped.
 */
export function extractActions(answer: string, o: ActionOptions): { text: string; actions: ChatAction[] } {
	const match = answer.match(ACTIONS_BLOCK);
	if (!match) return { text: answer, actions: [] };
	const text = answer.replace(ACTIONS_BLOCK, '').trim();
	let raw: unknown;
	try {
		raw = JSON.parse(match[1]);
	} catch {
		return { text, actions: [] };
	}
	const allowed: Record<string, readonly string[]> = {
		continents: o.continents,
		countries: o.countries,
		publishers: o.publishers,
		searches: o.searches.map((s) => s.value),
	};
	const valid = (a: ChatAction) =>
		a.type === 'filter'
			? a.values.every((v) => allowed[a.filter].includes(v))
			: a.type === 'color'
				? o.colorModes.includes(a.mode)
				: a.type === 'cluster'
					? o.clusterModes.includes(a.mode)
					: a.titles.length > 0;
	const actions = (Array.isArray(raw) ? raw : [])
		.map((a) => chatActionSchema.safeParse(a))
		.flatMap((r) => (r.success && valid(r.data) ? [r.data] : []))
		.slice(0, MAX_ACTIONS);
	return { text, actions };
}

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

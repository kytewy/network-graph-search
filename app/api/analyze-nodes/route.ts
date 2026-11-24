import { NextRequest, NextResponse } from 'next/server';
import { llmError, openai } from '@/lib/utils/openai-client';
import { buildAnalyzeNodesPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { LIMITS, badRequest, rateLimit } from '@/lib/utils/api-guard';
import { actionsInstruction, analyzeRequestSchema, extractActions } from '@/lib/contracts/analysis';
import { buildReceipt } from '@/lib/chat/receipt';
import { BUDGET_CHARS, charsRead, READ_LIMITS, READ_TOOL, serveRead } from '@/lib/chat/read-document';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'llm');
	if (limited) return limited;

	try {
		const parsed = analyzeRequestSchema.safeParse(await request.json().catch(() => null));
		if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid request');
		const { nodes, customPrompt, history, goal, actionOptions } = parsed.data;

		if (nodes.length === 0 || nodes.length > LIMITS.MAX_NODES_LLM) {
			return badRequest(`Send between 1 and ${LIMITS.MAX_NODES_LLM} nodes`);
		}

		// Build prompt using centralized prompt library
		const prompt = buildAnalyzeNodesPrompt({
			nodes: nodes as unknown as Parameters<typeof buildAnalyzeNodesPrompt>[0]['nodes'],
			customPrompt,
			charLimitPerDoc: PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS,
		});

		// Earlier turns first, so follow-ups make sense; the documents ride
		// with the newest question, so they're always the current context
		const messages: ChatCompletionMessageParam[] = [
			...(goal?.trim() ? [{ role: 'system' as const, content: `The user's research goal: ${goal.trim()}\nKeep every answer aimed at this goal.` }] : []),
			...history,
			// What the answer may suggest changing, as buttons the user can click
			...(actionOptions ? [{ role: 'system' as const, content: actionsInstruction(actionOptions) }] : []),
			{ role: 'user' as const, content: prompt },
		];
		// The AI may read whole documents before answering (read_document), as
		// many rounds as it needs within the reading budget
		const read = new Map<string, number>();
		const refused = { count: 0 };
		const ask = (final: boolean) =>
			openai.chat.completions.create({
				model: PROMPT_CONFIG.MODEL,
				messages,
				temperature: PROMPT_CONFIG.TEMPERATURE_ANALYSIS,
				max_tokens: PROMPT_CONFIG.MAX_TOKENS_ANALYSIS,
				tools: [READ_TOOL],
				tool_choice: final ? 'none' : 'auto',
			});
		let response = await ask(false);
		let rounds = 0;
		for (let round = 1; response.choices[0].message.tool_calls?.length; round++) {
			rounds = round;
			const message = response.choices[0].message;
			messages.push(message);
			for (const call of message.tool_calls ?? []) {
				const args = call.type === 'function' ? call.function.arguments : '';
				messages.push({ role: 'tool', tool_call_id: call.id, content: serveRead(args, nodes, read, refused) });
			}
			// The AI decides when to stop; the last round or a spent budget makes it answer
			response = await ask(round >= READ_LIMITS.MAX_ROUNDS || charsRead(read) >= BUDGET_CHARS);
		}

		// Exactly what went to the AI, shown as the answer's receipt
		const receipt = buildReceipt({
			nodes,
			messages: messages.map((m) => ({ content: typeof m.content === 'string' ? m.content : '' })),
			question: customPrompt,
			goal,
			suggestions: Boolean(actionOptions),
			memoryTurns: history.length / 2,
			read,
			readsRefused: refused.count,
			readRounds: rounds,
		});

		const answer = response.choices[0].message.content || 'No analysis generated';
		// Suggested actions are checked against what's available; the rest is the answer
		const { text, actions } = actionOptions ? extractActions(answer, actionOptions) : { text: answer, actions: [] };

		return NextResponse.json({ summary: text, actions, receipt });
	} catch (error) {
		return llmError('analyze-nodes', error, 'Failed to analyze nodes');
	}
}

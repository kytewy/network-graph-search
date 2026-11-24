import { NextRequest, NextResponse } from 'next/server';
import { llmError, openai } from '@/lib/utils/openai-client';
import { buildAnalyzeNodesPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { LIMITS, badRequest, rateLimit } from '@/lib/utils/api-guard';
import { actionsInstruction, analyzeRequestSchema, extractActions } from '@/lib/contracts/analysis';

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

		// Call GPT-4o-mini
		const response = await openai.chat.completions.create({
			model: PROMPT_CONFIG.MODEL,
			// Earlier turns first, so follow-ups make sense; the documents ride
			// with the newest question, so they're always the current context
			messages: [
				...(goal?.trim() ? [{ role: 'system' as const, content: `The user's research goal: ${goal.trim()}\nKeep every answer aimed at this goal.` }] : []),
				...history,
				// What the answer may suggest changing, as buttons the user can click
				...(actionOptions ? [{ role: 'system' as const, content: actionsInstruction(actionOptions) }] : []),
				{ role: 'user', content: prompt },
			],
			temperature: PROMPT_CONFIG.TEMPERATURE_ANALYSIS,
			max_tokens: PROMPT_CONFIG.MAX_TOKENS_ANALYSIS,
		});

		const answer = response.choices[0].message.content || 'No analysis generated';
		// Suggested actions are checked against what's available; the rest is the answer
		const { text, actions } = actionOptions ? extractActions(answer, actionOptions) : { text: answer, actions: [] };

		return NextResponse.json({ summary: text, actions });
	} catch (error) {
		return llmError('analyze-nodes', error, 'Failed to analyze nodes');
	}
}

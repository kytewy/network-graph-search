import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/utils/openai-client';
import { buildAnalyzeNodesPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { LIMITS, badRequest, rateLimit, serverError } from '@/lib/utils/api-guard';

export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'llm');
	if (limited) return limited;

	try {
		const { nodes, customPrompt } = await request.json();

		// Validate input
		if (!nodes || !Array.isArray(nodes)) {
			return NextResponse.json(
				{ error: 'Invalid nodes provided' },
				{ status: 400 }
			);
		}

		if (nodes.length === 0 || nodes.length > LIMITS.MAX_NODES_LLM) {
			return badRequest(`Send between 1 and ${LIMITS.MAX_NODES_LLM} nodes`);
		}

		if (
			customPrompt !== undefined &&
			(typeof customPrompt !== 'string' || customPrompt.length > LIMITS.MAX_PROMPT_CHARS)
		) {
			return badRequest(`Prompt must be text under ${LIMITS.MAX_PROMPT_CHARS} characters`);
		}

		// Build prompt using centralized prompt library
		const prompt = buildAnalyzeNodesPrompt({
			nodes,
			customPrompt,
			charLimitPerDoc: PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS,
		});

		// Call GPT-4o-mini
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
			temperature: PROMPT_CONFIG.TEMPERATURE_ANALYSIS,
			max_tokens: PROMPT_CONFIG.MAX_TOKENS_ANALYSIS,
		});

		const summary = response.choices[0].message.content || 'No analysis generated';

		return NextResponse.json({
			summary,
		});
	} catch (error) {
		return serverError('analyze-nodes', error, 'Failed to analyze nodes');
	}
}

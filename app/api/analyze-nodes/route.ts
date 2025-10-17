import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/utils/openai-client';
import { buildAnalyzeNodesPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';

export async function POST(request: NextRequest) {
	try {
		const { nodes, analysisType, customPrompt } = await request.json();

		// Validate input
		if (!nodes || !Array.isArray(nodes)) {
			return NextResponse.json(
				{ error: 'Invalid nodes provided' },
				{ status: 400 }
			);
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
		console.error('Error analyzing nodes:', error);
		return NextResponse.json(
			{ error: 'Failed to analyze nodes', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/utils/openai-client';

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

		// Extract text from nodes (limit to save tokens)
		const nodeTexts = nodes
			.map((node: any, idx: number) => {
				const text = node.text || node.content || node.summary || node.name || '';
				return `Document ${idx + 1} (${node.name || node.id}):\n${text.substring(0, 800)}...`;
			})
			.join('\n\n---\n\n');

		// Create prompt for GPT-4o-mini
		const prompt = `You are an expert analyst reviewing documents about AI regulations and legal frameworks.

${customPrompt || 'Please provide a detailed analysis of these documents.'}

Documents to analyze:

${nodeTexts}

Provide a comprehensive, structured analysis.`;

		// Call GPT-4o-mini
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 1000,
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

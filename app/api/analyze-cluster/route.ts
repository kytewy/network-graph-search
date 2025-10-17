import { NextRequest, NextResponse } from 'next/server';
import { getJSONCompletion } from '@/lib/utils/openai-client';
import { buildClusterNamingPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';

export async function POST(request: NextRequest) {
	try {
		const { clusterNodes, clusterIndex } = await request.json();

		// Validate input
		if (!clusterNodes || !Array.isArray(clusterNodes)) {
			return NextResponse.json(
				{ error: 'Invalid cluster nodes provided' },
				{ status: 400 }
			);
		}

		// Sample first 10 documents from cluster
		const sampleNodes = clusterNodes.slice(0, 10);

		// Build prompt using centralized prompt library
		const prompt = buildClusterNamingPrompt({
			clusterNodes: sampleNodes,
			totalClusterSize: clusterNodes.length,
			charLimitPerDoc: PROMPT_CONFIG.CHAR_LIMIT_CLUSTER_NAMING,
		});

		// Call GPT-4o-mini
		const result = await getJSONCompletion(prompt);

		return NextResponse.json({
			clusterName: result.clusterName || `Cluster ${clusterIndex}`,
			description: result.description || 'No description available',
		});
	} catch (error) {
		console.error('Error analyzing cluster:', error);
		return NextResponse.json(
			{ error: 'Failed to analyze cluster', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

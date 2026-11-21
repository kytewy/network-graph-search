import { NextRequest, NextResponse } from 'next/server';
import { getJSONCompletion, llmError } from '@/lib/utils/openai-client';
import { buildClusterNamingPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { LIMITS, badRequest, rateLimit } from '@/lib/utils/api-guard';

export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'llm');
	if (limited) return limited;

	try {
		const { clusterNodes, clusterIndex } = await request.json();

		// Validate input
		if (!clusterNodes || !Array.isArray(clusterNodes)) {
			return NextResponse.json(
				{ error: 'Invalid cluster nodes provided' },
				{ status: 400 }
			);
		}

		if (clusterNodes.length > LIMITS.MAX_NODES_CLUSTER) {
			return badRequest(`A cluster can have at most ${LIMITS.MAX_NODES_CLUSTER} nodes`);
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

		const text = (value: unknown, fallback: string) =>
			typeof value === 'string' && value.trim() ? value : fallback;

		return NextResponse.json({
			clusterName: text(result.clusterName, `Cluster ${clusterIndex}`),
			description: text(result.description, 'No description available'),
		});
	} catch (error) {
		return llmError('analyze-cluster', error, 'Failed to analyze cluster');
	}
}

import { NextRequest, NextResponse } from 'next/server';
import { getJSONCompletion } from '@/lib/utils/openai-client';

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

		// Extract text (limit to 500 chars per doc to save tokens)
		const sampleTexts = sampleNodes
			.map((node: any, idx: number) => {
				const text = node.fields?.full_text || node.content || node.label;
				return `Document ${idx + 1}:\n${text.substring(0, 500)}...`;
			})
			.join('\n\n---\n\n');

		// Create prompt for GPT-4o-mini
		const prompt = `You are analyzing a cluster of ${clusterNodes.length} legal/regulatory documents.

Sample documents from this cluster:

${sampleTexts}

Please analyze this cluster and provide:
1. A descriptive 2-4 word name that captures the main theme
2. A single sentence description (max 20 words)

Return your analysis as JSON:
{
  "clusterName": "GDPR Privacy Rights",
  "description": "Documents focused on GDPR Article 5 data protection principles"
}`;

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

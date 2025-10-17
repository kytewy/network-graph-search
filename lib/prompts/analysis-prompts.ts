/**
 * Centralized prompt library for all LLM analysis operations
 * 
 * This file contains all prompts used across the application for:
 * - General document analysis
 * - Cluster naming and description
 * - Detailed cluster analysis
 * - Quick action prompts
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyzeNodesParams {
	nodes: Array<{
		id: string;
		name?: string;
		text?: string;
		content?: string;
		summary?: string;
		type?: string;
		country?: string;
		sourceType?: string;
	}>;
	customPrompt?: string;
	charLimitPerDoc?: number;
}

export interface ClusterNamingParams {
	clusterNodes: Array<{
		id: string;
		label: string;
		fields?: {
			full_text?: string;
		};
		content?: string;
	}>;
	totalClusterSize: number;
	charLimitPerDoc?: number;
}

export interface ClusterAnalysisParams {
	clusterName: string;
	description: string;
	size: number;
	topTerms: string[];
	sampleDocLabels: string[];
	remainingCount: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PROMPT_CONFIG = {
	// Character limits per document
	CHAR_LIMIT_GENERAL_ANALYSIS: 800,
	CHAR_LIMIT_CLUSTER_NAMING: 500,
	
	// LLM settings
	TEMPERATURE_ANALYSIS: 0.7,
	TEMPERATURE_NAMING: 0.7,
	MAX_TOKENS_ANALYSIS: 1000,
	MAX_TOKENS_NAMING: 500,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format nodes for inclusion in prompts with optional metadata
 */
export function formatNodesForPrompt(
	nodes: AnalyzeNodesParams['nodes'],
	charLimit: number = PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS
): string {
	return nodes
		.map((node, idx) => {
			const text = node.text || node.content || node.summary || node.name || '';
			const metadata = [
				node.type && `Type: ${node.type}`,
				node.country && `Country: ${node.country}`,
				node.sourceType && `Source: ${node.sourceType}`,
			]
				.filter(Boolean)
				.join(' | ');

			return `Document ${idx + 1}: ${node.name || node.id}
${metadata ? `Metadata: ${metadata}` : ''}
Content: ${text.substring(0, charLimit)}...`;
		})
		.join('\n\n---\n\n');
}

/**
 * Format sample nodes for cluster naming (simpler format)
 */
export function formatClusterSampleNodes(
	nodes: ClusterNamingParams['clusterNodes'],
	charLimit: number = PROMPT_CONFIG.CHAR_LIMIT_CLUSTER_NAMING
): string {
	return nodes
		.map((node, idx) => {
			const text = node.fields?.full_text || node.content || node.label;
			return `Document ${idx + 1}:\n${text.substring(0, charLimit)}...`;
		})
		.join('\n\n---\n\n');
}

// ============================================================================
// MAIN PROMPTS
// ============================================================================

/**
 * PROMPT 1: General document analysis
 * Used by: /api/analyze-nodes
 * Purpose: Analyze selected network nodes with custom or default prompt
 */
export function buildAnalyzeNodesPrompt(params: AnalyzeNodesParams): string {
	const { nodes, customPrompt, charLimitPerDoc } = params;
	const nodeTexts = formatNodesForPrompt(nodes, charLimitPerDoc);

	return `You are an expert analyst reviewing documents about AI regulations and legal frameworks.

${customPrompt || 'Please provide a detailed analysis of these documents.'}

Documents to analyze:

${nodeTexts}

Provide a comprehensive, structured analysis.`;
}

/**
 * PROMPT 2: Cluster naming and description
 * Used by: /api/analyze-cluster
 * Purpose: Generate a short name and description for a document cluster
 */
export function buildClusterNamingPrompt(params: ClusterNamingParams): string {
	const { clusterNodes, totalClusterSize, charLimitPerDoc } = params;
	const sampleTexts = formatClusterSampleNodes(clusterNodes, charLimitPerDoc);

	return `You are analyzing a cluster of ${totalClusterSize} legal/regulatory documents.

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
}

/**
 * PROMPT 3: Detailed cluster analysis
 * Used by: ClusteringInterface (sent to chat)
 * Purpose: Deep-dive analysis of a specific cluster
 */
export function buildClusterAnalysisPrompt(params: ClusterAnalysisParams): string {
	const { clusterName, description, size, topTerms, sampleDocLabels, remainingCount } = params;

	const documentList = sampleDocLabels.map((label, idx) => `  ${idx + 1}. ${label}`).join('\n');
	const moreText = remainingCount > 0 ? `  ...and ${remainingCount} more documents` : '';

	return `Analyze this cluster in detail:

Cluster: ${clusterName}
Size: ${size} documents
Description: ${description}

Top Terms: ${topTerms.join(', ')}

Sample Documents:
${documentList}
${moreText}

Please provide:
1. Main themes and key topics across these documents
2. Document quality and relevance assessment
3. Any outliers or unexpected documents in this cluster
4. Actionable insights from this grouping`;
}

// ============================================================================
// QUICK ACTION PROMPTS
// ============================================================================

/**
 * Quick action prompts for the chat interface pill buttons
 * Used by: ChatInterface
 */
export const QUICK_PROMPTS = {
	summary: {
		withSelection: 'Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships.',
		withoutSelection: 'Provide an overview of the entire network structure and main components.',
	},
	businessImpact: {
		withSelection: 'Analyze the business impact and implications of the selected network nodes.',
		withoutSelection: 'Analyze the overall business impact represented in this network.',
	},
} as const;

/**
 * Get a quick action prompt based on context
 */
export function getQuickPrompt(
	action: keyof typeof QUICK_PROMPTS,
	hasSelection: boolean
): string {
	const prompt = QUICK_PROMPTS[action];
	return hasSelection ? prompt.withSelection : prompt.withoutSelection;
}

// ============================================================================
// PROMPT PLACEHOLDERS
// ============================================================================

/**
 * Placeholder text for the chat interface
 */
export const CHAT_PLACEHOLDERS = {
	default: 'Ask about AI regulations....',
	summary: 'What key points should I summarize from the network?',
	businessImpact: 'How might this network configuration affect business operations?',
} as const;

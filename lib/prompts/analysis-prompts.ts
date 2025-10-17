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
	sampleDocuments: Array<{
		label: string;
		content?: string;
		summary?: string;
		text?: string;
	}>;
	remainingCount: number;
	charLimitPerDoc?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PROMPT_CONFIG = {
	// Character limits per document
	CHAR_LIMIT_GENERAL_ANALYSIS: 800,
	CHAR_LIMIT_CLUSTER_NAMING: 500,

	// LLM settings
	TEMPERATURE_ANALYSIS: 0.2,
	TEMPERATURE_NAMING: 0.2,
	MAX_TOKENS_ANALYSIS: 2500, // Increased for structured output with multiple documents
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
		.map((node) => {
			const text = node.text || node.content || node.summary || node.name || '';
			const metadata = [
				node.type && `Type: ${node.type}`,
				node.country && `Country: ${node.country}`,
				node.sourceType && `Source: ${node.sourceType}`,
			]
				.filter(Boolean)
				.join(' | ');

			return `**[${node.name || node.id}]**
${metadata ? `Metadata: ${metadata}` : ''}
Content: ${text.substring(0, charLimit)}${text.length > charLimit ? '...' : ''}`;
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

	// Default structured prompt if no custom prompt provided
	const defaultPrompt = `Analyze these ${nodes.length} documents from a network graph. Identify patterns, themes, and relationships between them. Pay attention to any metadata provided (type, country, source).

Provide your analysis in the following format:

**Executive Summary** (2-3 sentences)
[Overview of the document set with key citations]

**Key Themes**
- [Theme 1 with supporting citations]
- [Theme 2 with supporting citations]  
- [Theme 3 with supporting citations]

**Document Relationships**
[How these documents connect or relate to each other, cite specific documents]

**Notable Patterns**
[Interesting patterns, clusters, or outliers based on content or metadata, with citations]

**Insights**
[Actionable findings or recommendations supported by evidence from specific documents]

**Important:** When making claims or observations, cite the relevant document(s) using their actual titles in brackets, e.g., [Article 76: Supervision Testing in Real World Conditions by Market Surveillance Authorities].`;

	return `You are an expert document analyst specializing in network analysis and pattern recognition.

Context: You are analyzing ${
		nodes.length
	} documents selected from a network graph visualization.

${customPrompt || defaultPrompt}

Documents to analyze:

${nodeTexts}`;
}

/**
 * PROMPT 2: Cluster naming and description
 * Used by: /api/analyze-cluster
 * Purpose: Generate a short name and description for a document cluster
 */
export function buildClusterNamingPrompt(params: ClusterNamingParams): string {
	const { clusterNodes, totalClusterSize, charLimitPerDoc } = params;
	const sampleTexts = formatClusterSampleNodes(clusterNodes, charLimitPerDoc);

	return `You are analyzing a cluster of ${totalClusterSize} similar documents from a network graph.

Sample documents from this cluster (showing ${clusterNodes.length} of ${totalClusterSize}):

${sampleTexts}

Task: Create a concise name and description for this cluster.

Requirements:
1. **Cluster Name**: 2-4 words maximum, specific and descriptive
   - Be specific, not generic (avoid "General Documents", "Various Topics", "Miscellaneous")
   - Focus on the common theme that unites these documents
   - Use domain-specific terminology when appropriate

2. **Description**: One clear sentence (10-20 words)
   - Capture the essence of what these documents have in common
   - Mention key topics or themes present across documents

Return your analysis as JSON:
{
  "clusterName": "Data Privacy Regulations",
  "description": "Documents covering data protection laws and privacy compliance frameworks"
}`;
}

/**
 * PROMPT 3: Detailed cluster analysis
 * Used by: ClusteringInterface (sent to chat)
 * Purpose: Deep-dive analysis of a specific cluster
 */
export function buildClusterAnalysisPrompt(
	params: ClusterAnalysisParams
): string {
	const {
		clusterName,
		description,
		size,
		topTerms,
		sampleDocuments,
		remainingCount,
		charLimitPerDoc = 600,
	} = params;

	// Format documents with content for citations using actual titles
	const documentList = sampleDocuments
		.map((doc) => {
			const content = doc.content || doc.text || doc.summary || '';
			const excerpt = content.substring(0, charLimitPerDoc);
			return `**[${doc.label}]**\n${excerpt}${content.length > charLimitPerDoc ? '...' : ''}`;
		})
		.join('\n\n');
	
	const moreText =
		remainingCount > 0 ? `\n\n*...and ${remainingCount} more documents in this cluster*` : '';

	return `## Cluster Analysis Request

### Cluster Information

**Name:** ${clusterName}  
**Size:** ${size} documents  
**Description:** ${description}

**Top Terms:** ${topTerms.join(', ')}

### Documents with Content
${documentList}${moreText}

---

### Analysis Instructions

Provide a detailed analysis covering:

1. **Main Themes & Topics**
   - What are the core themes across these documents?
   - How do they relate to each other?
   - **Cite specific documents** using their actual titles

2. **Quality & Relevance**
   - Are all documents well-grouped?
   - Is the cluster cohesive or diverse?
   - **Cite examples** from the documents above

3. **Outliers & Anomalies**
   - Any documents that seem out of place?
   - Unexpected patterns or connections?
   - **Reference specific documents** that stand out

4. **Actionable Insights**
   - What can we learn from this grouping?
   - Recommendations or next steps?
   - **Support with evidence** from the documents

**Important:** When making claims, cite the relevant document(s) using their actual titles in brackets, e.g., [Article 76: Supervision Testing in Real World Conditions by Market Surveillance Authorities].`;
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
		withSelection:
			'Provide a comprehensive summary of the selected nodes, highlighting their key themes, relationships, and how they connect within the network.',
		withoutSelection:
			'Provide an overview of the entire network structure, identifying main topic clusters, central themes, and how different areas relate to each other.',
	},
	businessImpact: {
		withSelection:
			'Analyze the strategic implications of these selected nodes. What patterns, opportunities, or risks do they reveal? Consider both the content and their network position.',
		withoutSelection:
			'Analyze the strategic implications revealed by this network. What are the key patterns, central topics, and potential opportunities or risks?',
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
	default: 'Ask questions about your network data...',
	summary: 'What key themes and patterns should I highlight?',
	businessImpact: 'What strategic insights can I extract from this network?',
} as const;

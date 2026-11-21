import { LIMITS, truncate } from '@/lib/utils/api-guard';

/** The fields backend/clustering/analyzer.py reads for each document. */
export interface ClusterInputNode {
	id: string;
	label: string;
	content: string;
	summary: string;
	documentType: string;
}

/**
 * Shapes untrusted request nodes for the clustering script.
 * Document text may arrive as `content` or `text`; the analyzer reads
 * `content`, so both map there. Long text is truncated.
 */
export function toClusterInput(nodes: Array<Record<string, unknown>>): ClusterInputNode[] {
	return nodes.map((node) => ({
		id: truncate(node?.id, 200),
		label: truncate(node?.label, 500),
		content: truncate(node?.content || node?.text, LIMITS.MAX_CONTENT_CHARS),
		summary: truncate(node?.summary, LIMITS.MAX_CONTENT_CHARS),
		documentType: truncate(node?.documentType, 100),
	}));
}

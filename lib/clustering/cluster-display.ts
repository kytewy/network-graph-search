/**
 * How each cluster ring looks on the graph: its name, and how much of it is
 * in the user's context (grey = none, light purple = some, purple = all).
 */

export type ContextLevel = 'none' | 'some' | 'all';

interface ClusterableNode {
	id: string;
	data?: Record<string, unknown>;
}

/** For each cluster on the graph, how much of it is in context. */
export function clusterContextLevels(
	nodes: readonly ClusterableNode[],
	attribute: string | undefined,
	contextIds: ReadonlySet<string>
): Record<string, ContextLevel> {
	if (!attribute) return {};
	const counts: Record<string, { total: number; inContext: number }> = {};
	for (const node of nodes) {
		const cluster = node.data?.[attribute];
		if (typeof cluster !== 'string' || !cluster) continue;
		const count = (counts[cluster] ??= { total: 0, inContext: 0 });
		count.total += 1;
		if (contextIds.has(node.id)) count.inContext += 1;
	}
	const levels: Record<string, ContextLevel> = {};
	for (const [cluster, { total, inContext }] of Object.entries(counts)) {
		levels[cluster] = inContext === 0 ? 'none' : inContext === total ? 'all' : 'some';
	}
	return levels;
}

/** The AI's name for a cluster, or "Cluster 1" for cluster_0 until it arrives. */
export function clusterDisplayName(
	clusterId: string,
	names: Readonly<Record<string, string>>
): string {
	if (names[clusterId]) return names[clusterId];
	const match = /^cluster_(\d+)$/.exec(clusterId);
	return match ? `Cluster ${Number(match[1]) + 1}` : clusterId;
}

/** Suggestions are stored by the cluster's position; key them by cluster id. */
export function namesFromSuggestions(
	clusters: readonly { cluster_id: string }[],
	suggestions: ReadonlyMap<number, { clusterName?: string }>
): Record<string, string> {
	const names: Record<string, string> = {};
	clusters.forEach((cluster, index) => {
		const name = suggestions.get(index)?.clusterName?.trim();
		if (name) names[cluster.cluster_id] = name;
	});
	return names;
}

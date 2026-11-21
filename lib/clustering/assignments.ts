import type { Node } from '@/lib/config/types';

/**
 * AI cluster assignments, keyed by node id (e.g. { doc1: 'cluster_0' }).
 * Kept apart from the nodes so clustering never edits search results,
 * and so a re-search that returns the same documents keeps their clusters.
 */
export type ClusterAssignments = Readonly<Record<string, string>>;

export const NO_CLUSTERS: ClusterAssignments = Object.freeze({});

/** Copy and freeze the API's assignments so nothing can change them later. */
export function toAssignments(raw: Record<string, string> | undefined): ClusterAssignments {
	return Object.freeze({ ...(raw || {}) });
}

/** True when at least one of the shown nodes has a cluster. */
export function hasClustersFor(nodes: Node[], assignments: ClusterAssignments): boolean {
	return nodes.some((node) => Boolean(assignments[node.id]));
}

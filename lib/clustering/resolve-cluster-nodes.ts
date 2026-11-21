import type { Node } from '@/lib/config/types';

export interface ClusterMember {
	id: string;
	label: string;
	/** The full node, if it's loaded; undefined if filtered off the page */
	node?: Node;
}

/**
 * Turns a cluster's node ids into titled members, in cluster order. Looks
 * in the nodes on the page first, then the context nodes; an id that's in
 * neither (e.g. filtered off the page) is shown as-is.
 */
export function resolveClusterNodes(
	nodeIds: readonly string[],
	pageNodes: readonly Node[],
	contextNodes: readonly Node[] = []
): ClusterMember[] {
	const byId = new Map<string, Node>();
	for (const node of contextNodes) byId.set(node.id, node);
	for (const node of pageNodes) byId.set(node.id, node);

	return nodeIds.map((id) => {
		const node = byId.get(id);
		return { id, label: node?.label || id, node };
	});
}

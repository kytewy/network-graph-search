import { useCallback } from 'react';
import type { GraphNode } from 'reagraph';
import type { Node } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';

/**
 * Clicking a node on the graph adds its document to the context, and
 * clicking it again takes it out.
 */
export function useToggleContextOnClick() {
	const addNodesToContext = useContextStore((s) => s.addNodesToContext);
	const removeNodeFromContext = useContextStore((s) => s.removeNodeFromContext);

	return useCallback(
		(node: GraphNode) => {
			if (!node.data) return;
			// The graph adds its own fields (the AI cluster); keep only the document
			const { ai_clusters: _graphOnly, ...doc } = node.data as Node & { ai_clusters?: string };
			const inContext = useContextStore.getState().contextNodes.some((n) => n.id === node.id);
			if (inContext) removeNodeFromContext(node.id);
			else addNodesToContext([doc as Node]);
		},
		[addNodesToContext, removeNodeFromContext]
	);
}

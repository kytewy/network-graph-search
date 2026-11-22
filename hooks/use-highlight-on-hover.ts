import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/stores/app-state';

/**
 * Hover (or keyboard focus) on a document row highlights its node on the
 * graph; leaving clears it. Used by search results, context nodes and
 * cluster cards. The graph reads `highlightedNodes` from the network store
 * and passes it to reagraph's `actives`, which recolours without re-layout.
 *
 * Usage: const highlight = useHighlightOnHover(); <div {...highlight(node.id)}>
 */
export function useHighlightOnHover() {
	const setHighlightedNodes = useAppStore((state) => state.setHighlightedNodes);
	const ownId = useRef<string | null>(null);

	const clear = useCallback(() => {
		ownId.current = null;
		setHighlightedNodes([]);
	}, [setHighlightedNodes]);

	// When the list unmounts mid-hover, don't leave a node stuck highlighted.
	// Only clear a highlight this list set, not one from another list.
	useEffect(
		() => () => {
			const highlighted = useAppStore.getState().highlightedNodes;
			if (ownId.current && highlighted.length === 1 && highlighted[0] === ownId.current) {
				useAppStore.getState().setHighlightedNodes([]);
			}
		},
		[]
	);

	return useCallback(
		(nodeId: string) => {
			const start = () => {
				ownId.current = nodeId;
				setHighlightedNodes([nodeId]);
			};
			return { onMouseEnter: start, onMouseLeave: clear, onFocus: start, onBlur: clear };
		},
		[setHighlightedNodes, clear]
	);
}

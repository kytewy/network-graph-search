import { useMemo } from 'react';
import { GRAPH_LAYOUT_CONFIG } from '@/lib/config/graph-config';

/**
 * Layout settings for reagraph, kept as the same object between renders.
 * Reagraph re-runs the whole layout (and forgets dragged positions) when
 * this object changes identity, so a fresh `{...}` on every render made the
 * graph jump on unrelated updates such as a hover highlight.
 */
export function useLayoutOverrides(clustered: boolean) {
	return useMemo(
		() => ({
			clusterStrength: clustered ? GRAPH_LAYOUT_CONFIG.clusterStrength : 0,
			linkDistance: GRAPH_LAYOUT_CONFIG.linkDistance,
			nodeStrength: GRAPH_LAYOUT_CONFIG.nodeStrength,
		}),
		[clustered]
	);
}

import { lightTheme, type Theme } from 'reagraph';
import { CLUSTER_RING_COLORS, HIGHLIGHT_COLOR, HIGHLIGHT_LABEL_COLOR } from '@/lib/config/graph-colors';

/** Reagraph's light theme, with our purple for anything highlighted. */
export const GRAPH_THEME: Theme = {
	...lightTheme,
	node: {
		...lightTheme.node,
		activeFill: HIGHLIGHT_COLOR,
		label: { ...lightTheme.node.label, activeColor: HIGHLIGHT_LABEL_COLOR },
	},
	ring: { ...lightTheme.ring, activeFill: HIGHLIGHT_COLOR },
	edge: { ...lightTheme.edge, activeFill: HIGHLIGHT_COLOR },
	arrow: { ...lightTheme.arrow, activeFill: HIGHLIGHT_COLOR },
	cluster: lightTheme.cluster && { ...lightTheme.cluster, stroke: CLUSTER_RING_COLORS.none },
};

import type { ContextLevel } from '@/lib/clustering/cluster-display';

/** Hovered nodes, and the nodes in your context, are drawn in this purple. */
export const HIGHLIGHT_COLOR = '#7c3aed';

/** Cluster rings: grey = none in context, light purple = some, purple = all. */
export const CLUSTER_RING_COLORS: Readonly<Record<ContextLevel, string>> = {
	none: '#d1d5db',
	some: '#c4b5fd',
	all: HIGHLIGHT_COLOR,
};

/** How long a cluster's new name takes to fade in. */
export const CLUSTER_NAME_FADE_MS = 500;

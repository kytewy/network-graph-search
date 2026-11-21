import type { ContextLevel } from '@/lib/clustering/cluster-display';

/** Hovered nodes, and the nodes in your context, are drawn in this purple. */
export const HIGHLIGHT_COLOR = '#7c3aed';

/** Cluster rings, soft purples that deepen as more of the cluster is in context. */
export const CLUSTER_RING_COLORS: Readonly<Record<ContextLevel, string>> = {
	none: '#ede9fe', // palest: nothing added yet
	some: '#c4b5fd', // light: some added
	all: '#a78bfa', // medium: all added (softer than the node purple)
};

/** How long a cluster's new name takes to fade in. */
export const CLUSTER_NAME_FADE_MS = 500;

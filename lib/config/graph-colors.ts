import type { ContextLevel } from '@/lib/clustering/cluster-display';

/** Hovered nodes are drawn in this purple. */
export const HIGHLIGHT_COLOR = '#7c3aed';

/** Cluster rings, soft purples that deepen as more of the cluster is in context. */
export const CLUSTER_RING_COLORS: Readonly<Record<ContextLevel, string>> = {
	none: '#ede9fe', // palest: nothing added yet
	some: '#c4b5fd', // light: some added
	all: '#a78bfa', // medium: all added (softer than the node purple)
};

/** How long a cluster's new name takes to fade in. */
export const CLUSTER_NAME_FADE_MS = 500;

/** The ring around every node: thin grey, or thicker black once it's in context. */
export const NODE_RING = {
	notInContext: { color: '#d1d5db', strokeWidth: 2 },
	inContext: { color: '#111827', strokeWidth: 4 },
} as const;

export function nodeRingStyle(inContext: boolean) {
	return inContext ? NODE_RING.inContext : NODE_RING.notInContext;
}

/** A node's ball: purple while hovered, otherwise its own colour. */
export function nodeFill(hovered: boolean, ownColor: string | undefined, fallback: string): string {
	return hovered ? HIGHLIGHT_COLOR : (ownColor ?? fallback);
}

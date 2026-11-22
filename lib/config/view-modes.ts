/**
 * The one list of view modes: how nodes can be coloured, sized and
 * clustered, and the graph layouts. The controls, the graph, the legend and
 * the web address all read from here, so adding a mode means editing this
 * file only.
 */
import type { Node } from '@/lib/stores/app-state';
import {
	DOCUMENT_TYPES,
	PUBLISHERS,
	UNKNOWN_COLOR,
	documentTypeColor,
	legendEntries,
	publisherColor,
} from '@/lib/config/document-taxonomy';

type LegendEntry = { label: string; color: string };
const fixed = (entries: LegendEntry[], other: string): LegendEntry[] => [...entries, { label: other, color: UNKNOWN_COLOR }];
const lookup = (entries: LegendEntry[]) => (value?: string) =>
	entries.find((e) => e.label === value)?.color ?? UNKNOWN_COLOR;

const CONTINENTS: LegendEntry[] = [
	{ label: 'North America', color: '#4f46e5' },
	{ label: 'Europe', color: '#10b981' },
	{ label: 'Asia', color: '#f59e0b' },
	{ label: 'Africa', color: '#ef4444' },
	{ label: 'South America', color: '#a855f7' },
];
const COUNTRIES: LegendEntry[] = [
	{ label: 'USA', color: '#1e40af' },
	{ label: 'Canada', color: '#ef4444' },
	{ label: 'European Union', color: '#60a5fa' },
];
/** Highest first; a score falls in the first bucket whose minimum it reaches. */
const SIMILARITY: (LegendEntry & { min: number })[] = [
	{ min: 81, label: 'Very high (81-100%)', color: '#22c55e' },
	{ min: 61, label: 'High (61-80%)', color: '#84cc16' },
	{ min: 41, label: 'Medium (41-60%)', color: '#eab308' },
	{ min: 20, label: 'Low (20-40%)', color: '#f97316' },
	{ min: 0, label: 'Very low (0-19%)', color: '#ef4444' },
];

const continentColor = lookup(CONTINENTS);
const countryColor = lookup(COUNTRIES);

interface ColorModeDef {
	id: string;
	label: string;
	colorOf: (node: Node) => string;
	/** Legend entries; `onScreen` lets a legend show only what's on the graph */
	legend: (onScreen: readonly Node[]) => LegendEntry[];
}

export const COLOR_MODES = [
	{
		id: 'continent',
		label: 'Continent',
		colorOf: (n) => continentColor(n.continent),
		legend: () => fixed(CONTINENTS, 'Unknown'),
	},
	{
		id: 'country',
		label: 'Country',
		colorOf: (n) => countryColor(n.country),
		legend: () => fixed(COUNTRIES, 'Other'),
	},
	{
		id: 'publisher',
		label: 'Publisher',
		colorOf: (n) => publisherColor(n.publisher),
		legend: (onScreen) => legendEntries(PUBLISHERS, onScreen.map((n) => n.publisher)),
	},
	{
		id: 'documentType',
		label: 'Document type',
		colorOf: (n) => documentTypeColor(n.documentType),
		legend: (onScreen) => legendEntries(DOCUMENT_TYPES, onScreen.map((n) => n.documentType)),
	},
	{
		id: 'similarityRange',
		label: 'Similarity range',
		colorOf: (n) => {
			if (n.score === undefined) return UNKNOWN_COLOR;
			const percent = Math.round(n.score * 100);
			return (SIMILARITY.find((b) => percent >= b.min) ?? SIMILARITY[SIMILARITY.length - 1]).color;
		},
		legend: () => SIMILARITY.map(({ label, color }) => ({ label, color })),
	},
] as const satisfies readonly ColorModeDef[];

/** `inControls: false`: supported (e.g. in a link) but not offered in the menu. */
export const SIZE_MODES = [
	{ id: 'none', label: 'None', inControls: true },
	{ id: 'similarity', label: 'Similarity', inControls: true },
	{ id: 'contentLength', label: 'Content length', inControls: true },
	{ id: 'summaryLength', label: 'Summary length', inControls: false },
] as const;

/** `needsAiClusters`: offered only after clustering has run. */
export const CLUSTER_MODES = [
	{ id: 'none', label: 'None', needsAiClusters: false },
	{ id: 'documentType', label: 'Document type', needsAiClusters: false },
	{ id: 'continent', label: 'Continent', needsAiClusters: false },
	{ id: 'country', label: 'Country', needsAiClusters: false },
	{ id: 'publisher', label: 'Publisher', needsAiClusters: false },
	{ id: 'ai_clusters', label: 'AI clusters', needsAiClusters: true },
] as const;

/** Layout ids as the network store keeps them. */
export const LAYOUT_IDS = ['forceDirected2d', 'circular2d', 'treeTd2d', 'treeLr2d', 'radialOut2d', 'forceatlas2'] as const;

export type ColorMode = (typeof COLOR_MODES)[number]['id'];
export type NodeSizeMode = (typeof SIZE_MODES)[number]['id'];
export type ClusterMode = (typeof CLUSTER_MODES)[number]['id'];
export type NetworkLayout = (typeof LAYOUT_IDS)[number];

export const ids = <T extends { id: string }>(modes: readonly T[]) => modes.map((m) => m.id) as T['id'][];

export function modeLabel<T extends { id: string; label: string }>(modes: readonly T[], id: T['id']): string {
	return modes.find((m) => m.id === id)?.label ?? '';
}

export function colorOfNode(node: Node, mode: ColorMode): string {
	const def: ColorModeDef = COLOR_MODES.find((m) => m.id === mode) ?? COLOR_MODES[0];
	return def.colorOf(node);
}

export function colorLegend(mode: ColorMode, onScreen: readonly Node[]): LegendEntry[] {
	const def: ColorModeDef = COLOR_MODES.find((m) => m.id === mode) ?? COLOR_MODES[0];
	return def.legend(onScreen);
}

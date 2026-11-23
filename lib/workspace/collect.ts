/**
 * Collecting several searches into one workspace: each search is a "round"
 * (#1, #2, …). Their results merge into one set of documents with no
 * duplicates, and every document remembers which rounds found it.
 *
 * Scores from different searches don't compare (0.8 for one question isn't
 * 0.8 for another), so each round keeps its own scores and a document's
 * size and colour use its best one.
 */
import type { Link, Node } from '@/lib/config/types';

export interface SearchRound {
	/** 1, 2, 3… in the order the searches were added */
	n: number;
	query: string;
	topK: number;
	/** Each found document's score in this search */
	scores: Record<string, number>;
}

export function makeRound(n: number, query: string, topK: number, nodes: readonly Node[]): SearchRound {
	return { n, query, topK, scores: Object.fromEntries(nodes.map((d) => [d.id, d.score])) };
}

/** True when this search is already a round (same words, ignoring case and spaces, same size) */
export function hasRound(rounds: readonly SearchRound[], query: string, topK: number): boolean {
	const q = query.trim().toLowerCase();
	return rounds.some((r) => r.query.trim().toLowerCase() === q && r.topK === topK);
}

/**
 * The documents and links of two result sets together: each document once
 * (its best score kept), each link once.
 */
export function mergeResults(
	current: { nodes: readonly Node[]; links: readonly Link[] },
	added: { nodes: readonly Node[]; links: readonly Link[] }
): { nodes: Node[]; links: Link[] } {
	const byId = new Map(current.nodes.map((d) => [d.id, d]));
	for (const d of added.nodes) {
		const existing = byId.get(d.id);
		byId.set(d.id, existing && existing.score >= d.score ? existing : { ...(existing ?? {}), ...d });
	}
	const linkKey = (l: Link) => [l.source, l.target].sort().join('→');
	const links = new Map(current.links.map((l) => [linkKey(l), l]));
	for (const l of added.links) if (!links.has(linkKey(l))) links.set(linkKey(l), l);
	return { nodes: [...byId.values()], links: [...links.values()] };
}

/** For each document, the rounds that found it, in order (e.g. [1, 3]) */
export function foundBy(rounds: readonly SearchRound[]): Record<string, number[]> {
	const out: Record<string, number[]> = {};
	for (const r of rounds) for (const id of Object.keys(r.scores)) (out[id] ??= []).push(r.n);
	return out;
}

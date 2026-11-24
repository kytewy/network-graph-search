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

/**
 * The documents with `foundBy` set from the rounds, and each score the best
 * any remaining round gave it. Documents no round found are dropped.
 */
export function stampRounds(nodes: readonly Node[], rounds: readonly SearchRound[]): Node[] {
	const by = foundBy(rounds);
	return nodes
		.filter((d) => by[d.id])
		.map((d) => ({ ...d, foundBy: by[d.id], score: Math.max(...rounds.filter((r) => d.id in r.scores).map((r) => r.scores[d.id])) }));
}

/** The group a document falls in when clustering by search: its search, or the overlap */
export function searchGroup(foundBy: readonly number[] | undefined, queries: Readonly<Record<number, string>>): string {
	if (!foundBy?.length) return 'Other';
	if (foundBy.length > 1) return '★ Found by 2+ searches';
	return `#${foundBy[0]} ${queries[foundBy[0]] ?? ''}`.trim();
}

/** For each document, the rounds that found it, in order (e.g. [1, 3]) */
export function foundBy(rounds: readonly SearchRound[]): Record<string, number[]> {
	const out: Record<string, number[]> = {};
	for (const r of rounds) for (const id of Object.keys(r.scores)) (out[id] ??= []).push(r.n);
	return out;
}

/** A search's documents, best first, optionally only the top few */
export function roundTopIds(round: SearchRound, count = Infinity): string[] {
	return Object.entries(round.scores)
		.sort(([, a], [, b]) => b - a)
		.slice(0, count)
		.map(([id]) => id);
}

export interface ContextGroup {
	/** The search, or null for documents no search in the workspace found */
	round: SearchRound | null;
	/** Context documents listed here: each appears once, under the first search that found it */
	ids: string[];
}

/** The documents in context, grouped by the first search that found them */
export function groupBySearch(contextIds: readonly string[], rounds: readonly SearchRound[]): ContextGroup[] {
	const by = foundBy(rounds);
	const groups: ContextGroup[] = rounds.map((round) => ({ round, ids: contextIds.filter((id) => by[id]?.[0] === round.n) }));
	const other = contextIds.filter((id) => !by[id]);
	return other.length ? [...groups, { round: null, ids: other }] : groups;
}


/**
 * Cluster assignments live in their own map, keyed by node id.
 *
 * Before, clustering wrote `ai_clusters` onto the node objects in the
 * store. React couldn't see that change, and a new search (now on every
 * filter click) produced fresh node objects, silently wiping the clusters.
 */

import { renderHook } from '@testing-library/react';
import { toAssignments, hasClustersFor } from '@/lib/clustering/assignments';
import { useGraphData } from '@/hooks/use-graph-data';
import type { Node } from '@/lib/config/types';

const node = (id: string): Node => ({ id, label: id, score: 0.9 } as Node);

describe('toAssignments', () => {
	it('copies the API result and freezes it', () => {
		const raw = { a: 'cluster_0' };
		const assignments = toAssignments(raw);
		raw.a = 'changed';

		expect(assignments.a).toBe('cluster_0');
		expect(Object.isFrozen(assignments)).toBe(true);
	});
});

describe('hasClustersFor', () => {
	it('is true only when a shown node has a cluster', () => {
		const assignments = toAssignments({ a: 'cluster_0' });
		expect(hasClustersFor([node('a'), node('b')], assignments)).toBe(true);
		expect(hasClustersFor([node('b')], assignments)).toBe(false);
		expect(hasClustersFor([node('a')], toAssignments({}))).toBe(false);
	});
});

describe('useGraphData with cluster assignments', () => {
	const options = { colorMode: 'continent' as const, nodeSizeMode: 'none' as const };

	it('reads clusters from the map without changing the nodes', () => {
		const nodes = [node('a'), node('b')];
		const aiClusters = toAssignments({ a: 'cluster_0', b: 'cluster_1' });
		const { result } = renderHook(() => useGraphData(nodes, [], { ...options, aiClusters }));

		expect(result.current.graphNodes.map((n: any) => n.ai_clusters)).toEqual(['cluster_0', 'cluster_1']);
		expect(nodes[0]).not.toHaveProperty('ai_clusters');
	});

	it('keeps clusters when a re-search returns new node objects', () => {
		const aiClusters = toAssignments({ a: 'cluster_0' });
		const { result, rerender } = renderHook(
			({ nodes }) => useGraphData(nodes, [], { ...options, aiClusters }),
			{ initialProps: { nodes: [node('a')] } }
		);
		rerender({ nodes: [node('a'), node('c')] });

		expect(result.current.graphNodes.map((n: any) => n.ai_clusters)).toEqual(['cluster_0', undefined]);
	});

	it('updates the graph when new clusters arrive', () => {
		const nodes = [node('a')];
		const { result, rerender } = renderHook(
			({ aiClusters }) => useGraphData(nodes, [], { ...options, aiClusters }),
			{ initialProps: { aiClusters: toAssignments({}) } }
		);
		rerender({ aiClusters: toAssignments({ a: 'cluster_2' }) });

		expect((result.current.graphNodes[0] as any).ai_clusters).toBe('cluster_2');
	});
});

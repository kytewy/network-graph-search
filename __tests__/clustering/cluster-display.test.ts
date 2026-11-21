import {
	clusterContextLevels,
	clusterDisplayName,
	namesFromSuggestions,
} from '@/lib/clustering/cluster-display';

const node = (id: string, cluster: string) => ({ id, data: { ai_clusters: cluster } });
const nodes = [node('a', 'cluster_0'), node('b', 'cluster_0'), node('c', 'cluster_1'), { id: 'd' }];

describe('clusterContextLevels', () => {
	it('is none, some or all depending on how much of each cluster is in context', () => {
		expect(clusterContextLevels(nodes, 'ai_clusters', new Set())).toEqual({
			cluster_0: 'none',
			cluster_1: 'none',
		});
		expect(clusterContextLevels(nodes, 'ai_clusters', new Set(['a']))).toEqual({
			cluster_0: 'some',
			cluster_1: 'none',
		});
		expect(clusterContextLevels(nodes, 'ai_clusters', new Set(['a', 'b', 'c']))).toEqual({
			cluster_0: 'all',
			cluster_1: 'all',
		});
	});

	it('works for any grouping, not only AI clusters', () => {
		const byPublisher = [
			{ id: 'a', data: { publisher: 'Regulator' } },
			{ id: 'b', data: { publisher: 'Law firm' } },
		];
		expect(clusterContextLevels(byPublisher, 'publisher', new Set(['b']))).toEqual({
			Regulator: 'none',
			'Law firm': 'all',
		});
	});

	it('is empty when nothing is clustered', () => {
		expect(clusterContextLevels(nodes, undefined, new Set(['a']))).toEqual({});
	});
});

describe('clusterDisplayName', () => {
	it('uses the AI name once it has arrived', () => {
		expect(clusterDisplayName('cluster_0', { cluster_0: 'Privacy laws' })).toBe('Privacy laws');
	});

	it('shows a friendly placeholder until then', () => {
		expect(clusterDisplayName('cluster_0', {})).toBe('Cluster 1');
		expect(clusterDisplayName('cluster_4', {})).toBe('Cluster 5');
	});

	it('leaves other groupings as they are', () => {
		expect(clusterDisplayName('Law firm', {})).toBe('Law firm');
	});
});

describe('namesFromSuggestions', () => {
	it('matches each suggestion to its cluster by position', () => {
		const clusters = [{ cluster_id: 'cluster_0' }, { cluster_id: 'cluster_1' }, { cluster_id: 'cluster_2' }];
		const suggestions = new Map([
			[0, { clusterName: 'Privacy laws' }],
			[2, { clusterName: '  ' }],
		]);
		expect(namesFromSuggestions(clusters, suggestions)).toEqual({ cluster_0: 'Privacy laws' });
	});
});

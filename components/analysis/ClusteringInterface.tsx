'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';

interface ClusteringInterfaceProps {
	contextNodes: any[];
	rightPanelExpanded: boolean;
}

interface ClusterResult {
	cluster_id: string;
	size: number;
	top_terms: string[];
}

interface ClusterAnalysisResponse {
	cluster_assignments: Record<string, string>; // nodeId -> clusterId
	clusters: ClusterResult[];
	executive_summary: string;
}

export default function ClusteringInterface({
	contextNodes,
	rightPanelExpanded,
}: ClusteringInterfaceProps) {
	const { applyAiClusters, clearAiClusters } = useNetworkGraph();
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [clusterResults, setClusterResults] = useState<ClusterAnalysisResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleAnalyzeClusters = async () => {
		if (contextNodes.length === 0) {
			setError('No nodes in context! Add nodes to analyze.');
			return;
		}

		setIsAnalyzing(true);
		setError(null);

		try {
			// Prepare node data for clustering
			const nodeData = contextNodes.map((node) => ({
				id: node.id,
				label: node.label || node.id,
				text: node.content || node.summary || node.label || '',
			}));

			console.log('[Clustering] Sending nodes to API:', nodeData.length);

			// Call clustering API
			const response = await fetch('/api/cluster-analysis', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nodes: nodeData }),
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const data: ClusterAnalysisResponse = await response.json();
			console.log('[Clustering] Received results:', data);
			console.log('[Clustering] Cluster assignments:', data.cluster_assignments);

			// Apply cluster assignments to the graph
			applyAiClusters(data.cluster_assignments);
			setClusterResults(data);
		} catch (err) {
			console.error('[Clustering] Error:', err);
			setError(err instanceof Error ? err.message : 'Failed to analyze clusters');
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleClearClusters = () => {
		clearAiClusters();
		setClusterResults(null);
		setError(null);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h4 className="text-xl font-semibold text-gray-900 mb-2">
					Cluster Analysis
				</h4>
				<p className="text-sm text-gray-600">
					Group nodes by content similarity using TF-IDF + KMeans clustering
				</p>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-2">
				<Button
					onClick={handleAnalyzeClusters}
					disabled={isAnalyzing || contextNodes.length === 0}
					className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white">
					{isAnalyzing ? 'Analyzing...' : 'Analyze Clusters'}
				</Button>
				{clusterResults && (
					<Button
						variant="outline"
						onClick={handleClearClusters}
						disabled={isAnalyzing}>
						Clear Clusters
					</Button>
				)}
			</div>

			{/* Node Count */}
			<div className="text-sm text-gray-600">
				<strong>{contextNodes.length}</strong> nodes in context
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{/* Cluster Results */}
			{clusterResults && (
				<div className="space-y-4">
					{/* Executive Summary */}
					{clusterResults.executive_summary && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h5 className="font-semibold text-blue-900 mb-2">Summary</h5>
							<p className="text-sm text-blue-800 whitespace-pre-wrap">
								{clusterResults.executive_summary}
							</p>
						</div>
					)}

					{/* Clusters */}
					<div className="space-y-3">
						<h5 className="font-semibold text-gray-900">
							Clusters ({clusterResults.clusters.length})
						</h5>
						{clusterResults.clusters.map((cluster) => (
							<div
								key={cluster.cluster_id}
								className="bg-white border border-gray-200 rounded-lg p-4">
								<div className="flex items-center justify-between mb-2">
									<h6 className="font-semibold text-gray-900">
										{cluster.cluster_id}
									</h6>
									<span className="text-xs text-gray-500">
										{cluster.size} {cluster.size === 1 ? 'node' : 'nodes'}
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{cluster.top_terms && cluster.top_terms.length > 0 ? (
										cluster.top_terms.map((term, idx) => (
											<span
												key={idx}
												className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
												{term}
											</span>
										))
									) : (
										<span className="text-xs text-gray-500 italic">
											No top terms available
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

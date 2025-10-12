'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, BarChart4, Tag, Check } from 'lucide-react';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { useContextStore } from '@/lib/stores/context-store';

interface ClusteringInterfaceProps {
	contextNodes: any[];
	rightPanelExpanded: boolean;
}

interface ClusterResult {
	cluster_id: string;
	size: number;
	top_terms?: string[]; // Optional since backend might not always include it
	node_ids?: string[]; // Optional to handle cases where it might be missing
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
	const [error, setError] = useState<string | null>(null);
	
	// Tag management state
	const [tagInputVisible, setTagInputVisible] = useState<string | null>(null);
	const [tagInput, setTagInput] = useState('');
	const [isTagging, setIsTagging] = useState(false);
	const [tagSuccess, setTagSuccess] = useState<string | null>(null);
	
	// Use persistent store for clustering results
	const clusterResults = useContextStore((state) => state.clusterResults);
	const expandedClusters = useContextStore((state) => state.expandedClusters);
	const setClusterResults = useContextStore((state) => state.setClusterResults);
	const toggleClusterExpansion = useContextStore((state) => state.toggleClusterExpansion);
	const clearClusterResults = useContextStore((state) => state.clearClusterResults);

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

			// Log what we received from API
			console.log('[Clustering] API Response:', {
				cluster_count: data.clusters?.length,
				clusters_with_node_ids: data.clusters?.map(c => ({
					id: c.cluster_id,
					node_ids_count: c.node_ids?.length || 0,
					actual_node_ids: c.node_ids
				}))
			});

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
		clearClusterResults();
		setError(null);
	};

	const handleAddTag = async (cluster: ClusterResult) => {
		if (!tagInput.trim()) {
			setError('Tag name cannot be empty');
			return;
		}

		// Validate node_ids
		if (!cluster.node_ids || !Array.isArray(cluster.node_ids) || cluster.node_ids.length === 0) {
			setError('No nodes found in this cluster');
			console.error('[Tagging] Invalid node_ids:', cluster.node_ids);
			return;
		}

		setIsTagging(true);
		setError(null);

		console.log('[Tagging] Adding tag to cluster:', {
			cluster_id: cluster.cluster_id,
			node_ids: cluster.node_ids,
			tag: tagInput.trim()
		});

		try {
			const response = await fetch('/api/documents/tags', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentIds: cluster.node_ids,
					tag: tagInput.trim(),
					action: 'add',
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				console.error('[Tagging] API error response:', errorData);
				throw new Error(errorData.error || `Failed to add tag: ${response.status}`);
			}

			const data = await response.json();
			
			// Show success message
			setTagSuccess(cluster.cluster_id);
			setTimeout(() => setTagSuccess(null), 3000);
			
			// Clear input and hide form
			setTagInput('');
			setTagInputVisible(null);
		} catch (err) {
			console.error('[Tagging] Error:', err);
			setError(err instanceof Error ? err.message : 'Failed to add tag');
		} finally {
			setIsTagging(false);
		}
	};

	// Helper function to format the executive summary with better structure
	const formatSummary = (summary: string) => {
		// Split by lines and process each line
		const lines = summary.split('\n').filter(line => line.trim());
		
		return lines.map((line, index) => {
			// Check if line starts with "Found X clusters"
			if (line.includes('Found') && line.includes('clusters')) {
				return (
					<div key={index} className="text-lg font-semibold text-blue-900 mb-3">
						{line}
					</div>
				);
			}
			
			// Check if line starts with "- **Cluster"
			if (line.startsWith('- **Cluster')) {
				const parts = line.split('): ');
				if (parts.length === 2) {
					const clusterPart = parts[0] + '):';
					const termsPart = parts[1];
					
					return (
						<div key={index} className="mb-2 p-2 bg-white rounded border border-blue-100">
							<div className="font-medium text-blue-800 mb-1">
								{clusterPart}
							</div>
							<div className="text-sm text-gray-700 ml-2">
								<span className="font-medium">Key terms:</span> {termsPart}
							</div>
						</div>
					);
				}
			}
			
			// Default formatting for other lines
			return (
				<div key={index} className="text-sm text-blue-800 mb-1">
					{line}
				</div>
			);
		});
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
					className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
							<h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
								<BarChart4 className="h-4 w-4" />
								Cluster Analysis
							</h5>
							<div className="space-y-2">
								{formatSummary(clusterResults.executive_summary)}
							</div>
						</div>
					)}

					{/* Clusters */}
					<div className="space-y-3">
						<h5 className="font-semibold text-gray-900">
							Clusters ({clusterResults.clusters.length})
						</h5>
						{clusterResults.clusters.map((cluster) => {
							const isExpanded = expandedClusters.has(cluster.cluster_id);
							return (
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
									{/* Top Terms */}
									<div className="mb-3">
										<p className="text-xs font-medium text-gray-600 mb-1">Top Terms:</p>
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

									{/* Node IDs with Dropdown */}
									{cluster.node_ids && cluster.node_ids.length > 0 && (
										<div>
											<button
												onClick={() => toggleClusterExpansion(cluster.cluster_id)}
												className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1 hover:text-gray-800 transition-colors">
												<span>Nodes:</span>
												{isExpanded ? (
													<ChevronUp className="h-3 w-3" />
												) : (
													<ChevronDown className="h-3 w-3" />
												)}
											</button>
											{isExpanded && (
												<div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
													{cluster.node_ids.map((nodeId) => (
														<span
															key={nodeId}
															className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono">
															{nodeId}
														</span>
													))}
												</div>
											)}
											{!isExpanded && (
												<div className="text-xs text-gray-500 italic">
													Click to view {cluster.node_ids.length} nodes
												</div>
											)}
										</div>
									)}

									{/* Add Tag Section */}
									<div className="mt-3 pt-3 border-t border-gray-200">
										{tagSuccess === cluster.cluster_id ? (
											<div className="flex items-center gap-2 text-green-600 text-sm">
												<Check className="h-4 w-4" />
												<span>Tag added successfully!</span>
											</div>
										) : tagInputVisible === cluster.cluster_id ? (
											<div className="space-y-2">
												<div className="flex gap-2">
													<Input
														type="text"
														placeholder="Enter tag name..."
														value={tagInput}
														onChange={(e) => setTagInput(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === 'Enter') handleAddTag(cluster);
															if (e.key === 'Escape') {
																setTagInputVisible(null);
																setTagInput('');
															}
														}}
														disabled={isTagging}
														className="flex-1 text-sm"
														autoFocus
													/>
													<Button
														size="sm"
														onClick={() => handleAddTag(cluster)}
														disabled={isTagging || !tagInput.trim()}
														className="bg-primary hover:bg-primary/90">
														{isTagging ? 'Adding...' : 'Add'}
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															setTagInputVisible(null);
															setTagInput('');
														}}
														disabled={isTagging}>
														Cancel
													</Button>
												</div>
												<p className="text-xs text-gray-500">
													This will add the tag to all {cluster.node_ids?.length || 0} nodes in this cluster
												</p>
											</div>
										) : (
											<Button
												size="sm"
												variant="outline"
												onClick={() => setTagInputVisible(cluster.cluster_id)}
												className="w-full">
												<Tag className="h-3 w-3 mr-2" />
												Add Tag to Cluster
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

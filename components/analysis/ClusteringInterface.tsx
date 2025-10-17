'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	ChevronDown,
	ChevronUp,
	BarChart4,
	Tag,
	Check,
	Loader2,
	ArrowRight,
	Plus,
	CheckCircle,
} from 'lucide-react';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import { useContextStore } from '@/lib/stores/context-store';
import { buildClusterAnalysisPrompt } from '@/lib/prompts/analysis-prompts';

interface ClusteringInterfaceProps {
	contextNodes: any[];
	rightPanelExpanded: boolean;
	onSwitchToChat: () => void;
	allNodes?: any[]; // All available nodes from network
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
	onSwitchToChat,
	allNodes = [],
}: ClusteringInterfaceProps) {
	const { applyAiClusters, clearAiClusters } = useNetworkGraph();
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// DEBUG: Log received props
	console.log('[ClusteringInterface] Received props:', {
		allNodes_count: allNodes?.length || 0,
		allNodes_type: typeof allNodes,
		allNodes_isArray: Array.isArray(allNodes),
		allNodes_sample: allNodes?.slice(0, 3).map(n => ({ id: n?.id, label: n?.label })),
		contextNodes_count: contextNodes?.length || 0
	});

	// Tag management state
	const [tagInputVisible, setTagInputVisible] = useState<string | null>(null);
	const [tagInput, setTagInput] = useState('');
	const [isTagging, setIsTagging] = useState(false);
	const [tagSuccess, setTagSuccess] = useState<string | null>(null);

	// Use persistent store for clustering results
	const clusterResults = useContextStore((state) => state.clusterResults);
	const expandedClusters = useContextStore((state) => state.expandedClusters);
	const setClusterResults = useContextStore((state) => state.setClusterResults);
	const toggleClusterExpansion = useContextStore(
		(state) => state.toggleClusterExpansion
	);
	const clearClusterResults = useContextStore(
		(state) => state.clearClusterResults
	);

	// LLM cluster suggestions
	const clusterSuggestions = useContextStore(
		(state) => state.clusterSuggestions
	);
	const setClusterSuggestions = useContextStore(
		(state) => state.setClusterSuggestions
	);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);

	// Context management functions
	const addNodesToContext = useContextStore((state) => state.addNodesToContext);
	const removeNodeFromContext = useContextStore(
		(state) => state.removeNodeFromContext
	);

	// Auto-generate cluster suggestions when clustering completes
	useEffect(() => {
		if (
			clusterResults &&
			clusterResults.clusters.length > 0 &&
			clusterSuggestions.size === 0
		) {
			generateClusterSuggestions();
		}
	}, [clusterResults]);

	const generateClusterSuggestions = async () => {
		if (!clusterResults) return;

		setLoadingSuggestions(true);
		const suggestions = new Map();

		try {
			// Process clusters in parallel
			const promises = clusterResults.clusters.map(async (cluster, index) => {
				// Get actual nodes for this cluster
				const clusterNodeIds = cluster.node_ids || [];
				const clusterNodes = contextNodes.filter((node) =>
					clusterNodeIds.includes(node.id)
				);

				const response = await fetch('/api/analyze-cluster', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						clusterNodes: clusterNodes.map((n) => ({
							id: n.id,
							label: n.label,
							fields: {
								full_text: n.content || n.summary || n.label,
							},
						})),
						clusterIndex: index,
					}),
				});

				if (!response.ok) {
					console.error(`Failed to analyze cluster ${index}:`, response.status);
					return { id: index, data: null };
				}

				const data = await response.json();
				return { id: index, data };
			});

			const results = await Promise.all(promises);

			results.forEach(({ id, data }) => {
				if (data) {
					suggestions.set(id, data);
				}
			});

			setClusterSuggestions(suggestions);
			console.log('[Clustering] Generated LLM suggestions:', suggestions);
		} catch (error) {
			console.error('[Clustering] Error generating suggestions:', error);
		} finally {
			setLoadingSuggestions(false);
		}
	};

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
				clusters_with_node_ids: data.clusters?.map((c) => ({
					id: c.cluster_id,
					node_ids_count: c.node_ids?.length || 0,
					actual_node_ids: c.node_ids,
				})),
			});

			// Apply cluster assignments to the graph
			applyAiClusters(data.cluster_assignments);
			setClusterResults(data);
			// Suggestions will be auto-generated by useEffect
		} catch (err) {
			console.error('[Clustering] Error:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to analyze clusters'
			);
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleClearClusters = () => {
		clearAiClusters();
		clearClusterResults();
		setError(null);
	};

	const sendClusterToChat = (cluster: ClusterResult, index: number) => {
		const suggestion = clusterSuggestions.get(index);
		const clusterNodeIds = cluster.node_ids || [];
		const clusterNodes = contextNodes.filter((node) =>
			clusterNodeIds.includes(node.id)
		);

		// Get first 5 documents with full content for citations
		const sampleDocuments = clusterNodes.slice(0, 5).map((n) => ({
			label: n.label,
			content: n.fields?.full_text || n.summary || n.content || '',
			summary: n.summary,
			text: n.fields?.full_text,
		}));
		const remainingCount = Math.max(0, clusterNodes.length - 5);

		// Use centralized prompt builder with document content
		const message = buildClusterAnalysisPrompt({
			clusterName: suggestion?.clusterName || cluster.cluster_id,
			description: suggestion?.description || 'No description available',
			size: cluster.size,
			topTerms: cluster.top_terms || [],
			sampleDocuments,
			remainingCount,
			charLimitPerDoc: 600, // Limit per document to manage prompt size
		});

		// Switch to Analysis tab first
		onSwitchToChat();

		// Then dispatch custom event to be picked up by ChatInterface
		setTimeout(() => {
			window.dispatchEvent(
				new CustomEvent('chat:send', {
					detail: {
						message,
						nodes: clusterNodes,
					},
				})
			);
		}, 100);

		console.log('[Clustering] Sent cluster to chat:', {
			cluster: suggestion?.clusterName || cluster.cluster_id,
			nodeCount: clusterNodes.length,
		});
	};

	// Helper function to check if all cluster nodes are in context
	const isClusterInContext = useMemo(() => {
		const contextNodeIds = new Set(contextNodes.map((node) => node.id));
		const clusterInContext = new Map<string, boolean>();

		if (clusterResults) {
			clusterResults.clusters.forEach((cluster) => {
				if (cluster.node_ids && cluster.node_ids.length > 0) {
					const allInContext = cluster.node_ids.every((nodeId) =>
						contextNodeIds.has(nodeId)
					);
					clusterInContext.set(cluster.cluster_id, allInContext);
				} else {
					clusterInContext.set(cluster.cluster_id, false);
				}
			});
		}

		return clusterInContext;
	}, [contextNodes, clusterResults]);

	// Toggle cluster in/out of context
	const toggleClusterContext = (cluster: ClusterResult) => {
		if (!cluster.node_ids || cluster.node_ids.length === 0) {
			setError('No nodes found in this cluster');
			return;
		}

		const isInContext = isClusterInContext.get(cluster.cluster_id);

		if (isInContext) {
			// Remove all cluster nodes from context
			cluster.node_ids.forEach((nodeId) => {
				removeNodeFromContext(nodeId);
			});
			console.log('[Clustering] Removed cluster from context:', cluster.cluster_id);
		} else {
			// Add cluster nodes to context - filter from ALL available nodes
			console.log('[Clustering] Attempting to add cluster:', {
				cluster_id: cluster.cluster_id,
				cluster_node_ids: cluster.node_ids,
				allNodes_count: allNodes.length,
				sample_allNodes_ids: allNodes.slice(0, 5).map(n => n.id)
			});
			
			const clusterNodes = allNodes.filter((node) =>
				cluster.node_ids?.includes(node.id)
			);
			
			if (clusterNodes.length === 0) {
				const errorMsg = `Could not find nodes for this cluster. Available nodes: ${allNodes.length}, Cluster expects: ${cluster.node_ids.length} nodes`;
				console.error('[Clustering] Error:', {
					error: errorMsg,
					cluster_node_ids: cluster.node_ids,
					available_node_ids: allNodes.map(n => n.id)
				});
				setError(errorMsg);
				return;
			}
			
			addNodesToContext(clusterNodes);
			console.log('[Clustering] Added cluster to context:', {
				cluster_id: cluster.cluster_id,
				nodes_added: clusterNodes.length,
				node_ids: clusterNodes.map(n => n.id)
			});
		}
	};

	const handleAddTag = async (cluster: ClusterResult) => {
		if (!tagInput.trim()) {
			setError('Tag name cannot be empty');
			return;
		}

		// Validate node_ids
		if (
			!cluster.node_ids ||
			!Array.isArray(cluster.node_ids) ||
			cluster.node_ids.length === 0
		) {
			setError('No nodes found in this cluster');
			console.error('[Tagging] Invalid node_ids:', cluster.node_ids);
			return;
		}

		setIsTagging(true);
		setError(null);

		console.log('[Tagging] Adding tag to cluster:', {
			cluster_id: cluster.cluster_id,
			node_ids: cluster.node_ids,
			tag: tagInput.trim(),
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
				const errorData = await response
					.json()
					.catch(() => ({ error: 'Unknown error' }));
				console.error('[Tagging] API error response:', errorData);
				throw new Error(
					errorData.error || `Failed to add tag: ${response.status}`
				);
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
		const lines = summary.split('\n').filter((line) => line.trim());

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
						<div
							key={index}
							className="mb-2 p-2 bg-white rounded border border-blue-100">
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
			<div className="border-t border-sidebar-border pt-6">
				<div className="mb-6">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-xl font-semibold text-gray-900">
							Cluster Analysis
						</h4>
						<span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
							{contextNodes.length} {contextNodes.length === 1 ? 'node' : 'nodes'}
						</span>
					</div>
					<p className="text-sm text-gray-600">
						Group nodes by content similarity using TF-IDF + KMeans clustering
					</p>
				</div>
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
						<div className="flex items-center justify-between flex-wrap gap-2">
							<div>
								<h5 className="font-semibold text-gray-900 mb-1">
									Clusters ({clusterResults.clusters.length})
								</h5>
								<p className="text-xs text-gray-600">
									Total: {clusterResults.clusters.reduce((sum, c) => sum + c.size, 0)} nodes across all clusters
								</p>
							</div>
							{loadingSuggestions && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Loader2 className="w-4 h-4 animate-spin" />
									Generating names...
								</div>
							)}
						</div>
						{clusterResults.clusters.map((cluster, index) => {
							const isExpanded = expandedClusters.has(cluster.cluster_id);
							const suggestion = clusterSuggestions.get(index);
							const inContext = isClusterInContext.get(cluster.cluster_id) || false;

							return (
								<div
									key={cluster.cluster_id}
									className={`rounded-lg p-4 relative transition-all duration-200 ${
										inContext
											? 'bg-primary/5 border-2 border-primary shadow-md'
											: 'bg-white border border-gray-200 hover:border-gray-300'
									}`}>
									{/* Context toggle button - top right */}
									<button
										onClick={() => toggleClusterContext(cluster)}
										className={`absolute top-3 right-12 p-2 rounded-full transition-all duration-200 ${
											inContext
												? 'bg-primary/10 hover:bg-primary/20 text-primary'
												: 'bg-gray-100 hover:bg-gray-200 text-gray-600'
										}`}
										title={inContext ? 'Remove from context' : 'Add to context'}>
										{inContext ? (
											<CheckCircle className="w-5 h-5" />
										) : (
											<Plus className="w-5 h-5" />
										)}
									</button>

									{/* Arrow button - send to chat */}
									<button
										onClick={() => sendClusterToChat(cluster, index)}
										className="absolute top-3 right-3 p-2 hover:bg-primary/10 rounded-full transition-colors"
										title="Send to chat for analysis">
										<ArrowRight className="w-5 h-5 text-primary" />
									</button>

									<div className="flex items-center justify-between mb-2 pr-20">
										<h6 className="font-semibold text-gray-900">
											{suggestion?.clusterName || cluster.cluster_id}
										</h6>
										<span className="text-xs text-gray-500">
											{cluster.size} {cluster.size === 1 ? 'node' : 'nodes'}
										</span>
									</div>

									{/* LLM Description */}
									{suggestion?.description && (
										<p className="text-sm text-muted-foreground italic mb-3">
											"{suggestion.description}"
										</p>
									)}
									{/* Top Terms */}
									<div className="mb-3">
										<p className="text-xs font-medium text-gray-600 mb-1">
											Top Terms:
										</p>
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
												onClick={() =>
													toggleClusterExpansion(cluster.cluster_id)
												}
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
													This will add the tag to all{' '}
													{cluster.node_ids?.length || 0} nodes in this cluster
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

'use client';
import { useAppStore } from '@/lib/stores/app-state';
import { cancelClustering, clusterDocuments, nameCluster } from '@/lib/api/analysis-client';
import { changeTag } from '@/lib/api/tags-client';
import { debugLog } from '@/lib/utils/debug';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	ChevronDown,
	ChevronUp,
	Tag,
	Check,
	Loader2,
	ArrowRight,
	Plus,
	CheckCircle,
} from 'lucide-react';
import { useContextStore } from '@/lib/stores/context-store';
import { buildClusterAnalysisPrompt } from '@/lib/prompts/analysis-prompts';
import { ClusterOverview } from './ClusterOverview';
import { createLatestRequest, isAbortError } from '@/lib/utils/latest-request';
import { reportError } from '@/lib/observability/capture-client';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';
import { resolveClusterNodes } from '@/lib/clustering/resolve-cluster-nodes';
import DocumentOverlay, { nodeToReadingItem } from '@/components/network/DocumentOverlay';
import type { Node } from '@/lib/config/types';
import type { ClusterAnalysisResponse } from '@/lib/stores/context-store';

interface ClusteringInterfaceProps {
	contextNodes: any[];
	rightPanelExpanded: boolean;
	onSwitchToChat: () => void;
	allNodes?: any[]; // All available nodes from network
	/** Cluster the documents as soon as the tab opens (the lasso's "Cluster these") */
	runOnOpen?: boolean;
	onRan?: () => void;
}

interface ClusterResult {
	cluster_id: string;
	size: number;
	top_terms?: string[]; // Optional since backend might not always include it
	node_ids?: string[]; // Optional to handle cases where it might be missing
}


export default function ClusteringInterface({
	contextNodes,
	rightPanelExpanded,
	onSwitchToChat,
	allNodes = [],
	runOnOpen = false,
	onRan,
}: ClusteringInterfaceProps) {
	const applyAiClusters = useAppStore((state) => state.applyAiClusters);
	const clearAiClusters = useAppStore((state) => state.clearAiClusters);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// DEBUG: Log received props
	debugLog('[ClusteringInterface] Received props:', {
		allNodes_count: allNodes?.length || 0,
		allNodes_type: typeof allNodes,
		allNodes_isArray: Array.isArray(allNodes),
		allNodes_sample: allNodes
			?.slice(0, 3)
			.map((n) => ({ id: n?.id, label: n?.label })),
		contextNodes_count: contextNodes?.length || 0,
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
	// One running request at a time for each; refs survive re-renders
	const clusterRequests = useRef(createLatestRequest());
	const suggestionRequests = useRef(createLatestRequest());

	// Context management functions
	const addNodesToContext = useContextStore((state) => state.addNodesToContext);
	const removeNodeFromContext = useContextStore(
		(state) => state.removeNodeFromContext
	);

	// Cluster card members: hover highlights the node, click opens read mode
	const highlight = useHighlightOnHover();
	const [readingNode, setReadingNode] = useState<Node | null>(null);
	const isInContext = (nodeId: string) => contextNodes.some((n) => n.id === nodeId);
	const toggleReadingNodeContext = () => {
		if (!readingNode) return;
		if (isInContext(readingNode.id)) removeNodeFromContext(readingNode.id);
		else addNodesToContext([readingNode]);
	};

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

		// New clusters replace the old ones, so their suggestions are cancelled
		const signal = suggestionRequests.current.next();
		setLoadingSuggestions(true);
		const suggestions = new Map();

		try {
			// Process clusters in parallel
			const promises = clusterResults.clusters.map(async (cluster, index) => {
				// Get actual nodes for this cluster
				const clusterNodeIds = Array.isArray(cluster.node_ids)
					? cluster.node_ids
					: [];
				const safeContextNodes = Array.isArray(contextNodes)
					? contextNodes
					: [];
				const clusterNodes = safeContextNodes.filter((node) =>
					clusterNodeIds.includes(node.id)
				);

				const payload = clusterNodes.map((n) => ({
					id: n.id,
					label: n.label,
					fields: { full_text: n.content || n.summary || n.label },
				}));
				try {
					// Remembered for the same documents, so re-running is instant
					return { id: index, data: await nameCluster(payload, index) };
				} catch (err) {
					if (!signal.aborted) reportError('cluster-suggestion', err, { clusterIndex: index });
					return { id: index, data: null };
				}
			});

			const results = await Promise.all(promises);
			if (signal.aborted) return;

			results.forEach(({ id, data }) => {
				if (data) {
					suggestions.set(id, data);
				}
			});

			setClusterSuggestions(suggestions);
			debugLog('[Clustering] Generated LLM suggestions:', suggestions);
		} catch (error) {
			if (isAbortError(error)) return;
			reportError('cluster-suggestions', error);
		} finally {
			if (!signal.aborted) setLoadingSuggestions(false);
		}
	};

	const handleAnalyzeClusters = async () => {
		if (contextNodes.length === 0) {
			setError('No nodes in context! Add nodes to analyze.');
			return;
		}

		// Running clustering again cancels the run still in flight
		const signal = clusterRequests.current.next();
		suggestionRequests.current.cancel();
		cancelClustering();
		setIsAnalyzing(true);
		setError(null);

		try {
			// Prepare node data for clustering
			const nodeData = contextNodes.map((node) => ({
				id: node.id,
				label: node.label || node.id,
				content: node.content || node.summary || node.label || '',
			}));

			// Remembered for the same documents, so re-running is instant
			const data: ClusterAnalysisResponse = await clusterDocuments(nodeData);
			if (signal.aborted) return;

			// Log what we received from API
			debugLog('[Clustering] API Response:', {
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
			if (signal.aborted || isAbortError(err)) return;
			reportError('clustering', err);
			setError(
				err instanceof Error ? err.message : 'Failed to analyze clusters'
			);
		} finally {
			if (!signal.aborted) setIsAnalyzing(false);
		}
	};

	// "Cluster these" from the lasso: run once the chat's documents are here
	useEffect(() => {
		if (!runOnOpen || contextNodes.length === 0) return;
		onRan?.();
		void handleAnalyzeClusters();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [runOnOpen, contextNodes]);

	const handleClearClusters = () => {
		clusterRequests.current.cancel();
		suggestionRequests.current.cancel();
		cancelClustering();
		setIsAnalyzing(false);
		setLoadingSuggestions(false);
		clearAiClusters();
		clearClusterResults();
		setError(null);
	};

	const sendClusterToChat = (cluster: ClusterResult, index: number) => {
		const suggestion = clusterSuggestions.get(index);
		const clusterNodeIds = Array.isArray(cluster.node_ids)
			? cluster.node_ids
			: [];
		const safeContextNodes = Array.isArray(contextNodes) ? contextNodes : [];
		const clusterNodes = safeContextNodes.filter((node) =>
			clusterNodeIds.includes(node.id)
		);

		// Get first 5 documents with full content for citations
		const sampleDocuments = clusterNodes.slice(0, 5).map((n) => ({
			label: n.label,
			content: n.summary || n.content || '',
			summary: n.summary,
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

		debugLog('[Clustering] Sent cluster to chat:', {
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
			debugLog(
				'[Clustering] Removed cluster from context:',
				cluster.cluster_id
			);
		} else {
			// Add cluster nodes to context - filter from ALL available nodes
			debugLog('[Clustering] Attempting to add cluster:', {
				cluster_id: cluster.cluster_id,
				cluster_node_ids: cluster.node_ids,
				allNodes_count: allNodes.length,
				sample_allNodes_ids: allNodes.slice(0, 5).map((n) => n.id),
			});

			const safeAllNodes = Array.isArray(allNodes) ? allNodes : [];
			const clusterNodeIds = Array.isArray(cluster.node_ids)
				? cluster.node_ids
				: [];
			const clusterNodes = safeAllNodes.filter((node) =>
				clusterNodeIds.includes(node.id)
			);

			if (clusterNodes.length === 0) {
				const errorMsg = `Could not find nodes for this cluster. Available nodes: ${allNodes.length}, Cluster expects: ${cluster.node_ids.length} nodes`;
				reportError('cluster-context', new Error('Cluster nodes not found among loaded nodes'), {
					availableNodes: allNodes.length,
					clusterNodes: cluster.node_ids.length,
				});
				setError(errorMsg);
				return;
			}

			addNodesToContext(clusterNodes);
			debugLog('[Clustering] Added cluster to context:', {
				cluster_id: cluster.cluster_id,
				nodes_added: clusterNodes.length,
				node_ids: clusterNodes.map((n) => n.id),
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
			reportError('cluster-tag', new Error('Cluster has no valid node ids'));
			return;
		}

		setIsTagging(true);
		setError(null);

		debugLog('[Tagging] Adding tag to cluster:', {
			cluster_id: cluster.cluster_id,
			node_ids: cluster.node_ids,
			tag: tagInput.trim(),
		});

		try {
			// Also updates the loaded results, so the list and tag filter show it
			await changeTag(cluster.node_ids, tagInput.trim(), 'add');

			// Show success message
			setTagSuccess(cluster.cluster_id);
			setTimeout(() => setTagSuccess(null), 3000);

			// Clear input and hide form
			setTagInput('');
			setTagInputVisible(null);
		} catch (err) {
			reportError('cluster-tag', err);
			setError(err instanceof Error ? err.message : 'Failed to add tag');
		} finally {
			setIsTagging(false);
		}
	};


	return (
		<div className="space-y-4">
			{/* What clustering does, in one line (the count is on the Context tab) */}
			<p className="text-xs text-muted-foreground">Groups documents by similar content (TF-IDF + KMeans).</p>

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
					{/* Count, a quick AI summary and one line per cluster */}
					<ClusterOverview
						clusters={clusterResults.clusters}
						suggestions={clusterSuggestions}
						namesLoading={loadingSuggestions}
						onJump={(id) => document.getElementById(`cluster-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
					/>

					{/* Clusters */}
					<div className="space-y-3">
						{clusterResults.clusters.map((cluster, index) => {
							const isExpanded = expandedClusters.has(cluster.cluster_id);
							const suggestion = clusterSuggestions.get(index);
							const inContext =
								isClusterInContext.get(cluster.cluster_id) || false;

							return (
								<div
									key={cluster.cluster_id}
									id={`cluster-card-${cluster.cluster_id}`}
									className={`scroll-mt-16 rounded-lg p-4 relative transition-all duration-200 ${
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
										title={
											inContext ? 'Remove from context' : 'Add to context'
										}>
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
													{resolveClusterNodes(cluster.node_ids, allNodes, contextNodes).map(
														(member) => (
															<button
																key={member.id}
																type="button"
																{...highlight(member.id)}
																disabled={!member.node}
																onClick={() => member.node && setReadingNode(member.node)}
																title={member.node ? `${member.label} (click to read)` : `${member.id} is filtered off the page`}
																className="inline-block max-w-[16rem] truncate bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-default">
																{member.label}
															</button>
														)
													)}
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
			{readingNode && (
				<DocumentOverlay
					document={nodeToReadingItem(readingNode)}
					onClose={() => setReadingNode(null)}
					isInContext={isInContext(readingNode.id)}
					onToggleContext={toggleReadingNodeContext}
				/>
			)}
		</div>
	);
}

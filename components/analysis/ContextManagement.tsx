'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
	Search,
	X,
	CheckSquare,
	Square,
	BarChart4,
	MessageSquare,
	Trash2,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useContextStore } from '@/lib/stores/context-store';
import { useAppStore } from '@/lib/stores/app-state';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';
import DocumentOverlay from '@/components/network/DocumentOverlay';
import ChatInterface from '@/components/analysis/ChatInterface';
import ClusteringInterface from '@/components/analysis/ClusteringInterface';

interface Node {
	id: string;
	label: string;
	summary?: string;
	content?: string;
	type?: string;
	continent?: string;
	country?: string;
	sourceType?: string;
	size?: number;
	color?: string;
	similarity?: number;
	stateProvince?: string;
}

interface NodeTypeStats {
	type: string;
	count: number;
	totalChars: number;
	totalTokens: number;
}

interface ContextStats {
	totalNodes: number;
	totalChars: number;
	totalTokens: number;
	averageCharsPerNode: number;
	averageTokensPerNode: number;
	typeDistribution: NodeTypeStats[];
	countryDistribution: { country: string; count: number }[];
}

interface ContextManagementProps {
	rightPanelExpanded: boolean;
	maxTokenLimit?: number; // Maximum token limit for context window
	networkState?: any;
	filterState?: any;
}

export default function ContextManagement({
	rightPanelExpanded,
	maxTokenLimit = 20000, // Default token limit
	networkState = {},
	filterState = {},
}: ContextManagementProps) {
	const [isClient, setIsClient] = useState(false);

	// Get all store state - MUST be called before conditional returns
	const showActiveNodes = useUIStore((state) => state.showActiveNodes);
	const setShowActiveNodes = useUIStore((state) => state.setShowActiveNodes);

	// Get nodes from NetworkGraph context (same source as the graph itself!)
	const { filteredResults } = useNetworkGraph();
	
	// Also get from app store for comparison
	const searchResults = useAppStore((state) => state.searchResults);

	// Get context nodes from context store
	const contextNodes = useContextStore((state) => state.contextNodes);
	const removeNodeFromContext = useContextStore(
		(state) => state.removeNodeFromContext
	);
	const clearContext = useContextStore((state) => state.clearContext);

	// ALL STATE HOOKS - MUST be called before conditional returns
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [showDocumentOverlay, setShowDocumentOverlay] = useState(false);
	const [isNodeInContext, setIsNodeInContext] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [activeTab, setActiveTab] = useState<
		'nodes' | 'analysis' | 'clustering'
	>('nodes');
	const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
		new Set()
	);
	const [selectAll, setSelectAll] = useState(false);
	const [sortByTokens, setSortByTokens] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	// ALL EFFECT HOOKS - MUST be called before conditional returns
	useEffect(() => {
		setIsClient(true);
	}, []);

	// DEBUG: Log when searchResults changes
	useEffect(() => {
		console.warn('🟡 [ContextManagement] searchResults CHANGED:', {
			count: searchResults?.length || 0,
			hasData: searchResults && searchResults.length > 0
		});
	}, [searchResults]);

	// ALL COMPUTED VALUES - MUST be called before conditional returns
	const itemsPerPage = 10; // Show 10 nodes per page

	// Calculate context statistics
	const calculateContextStats = useMemo((): ContextStats => {
		// Calculate total characters and tokens
		const totalChars = contextNodes.reduce(
			(sum, node) => sum + (node.content?.length || 0),
			0
		);

		// Rough token estimation (1 token ≈ 4 characters)
		const estimatedTokens = Math.ceil(totalChars / 4);

		// Count nodes by type
		const nodesByType = contextNodes.reduce((acc, node) => {
			const type = node.type || 'unknown';
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		// Calculate average content length
		const avgContentLength = contextNodes.length > 0 
			? Math.round(totalChars / contextNodes.length) 
			: 0;

		return {
			totalNodes: contextNodes.length,
			totalChars,
			totalTokens: estimatedTokens,
			averageCharsPerNode: avgContentLength,
			averageTokensPerNode: contextNodes.length > 0 ? Math.round(estimatedTokens / contextNodes.length) : 0,
			typeDistribution: [], // Will be implemented later if needed
			countryDistribution: [], // Will be implemented later if needed
		};
	}, [contextNodes, maxTokenLimit]);

	// Filter and sort nodes based on search query and sort options
	const filteredNodes = useMemo(() => {
		return contextNodes
			.filter((node) => {
				// Apply search query filter
				if (!searchQuery.trim()) return true;
				const query = searchQuery.toLowerCase();
				return (
					node.label?.toLowerCase().includes(query) ||
					node.summary?.toLowerCase().includes(query) ||
					node.content?.toLowerCase().includes(query) ||
					node.id.toLowerCase().includes(query)
				);
			})
			.sort((a, b) => {
				if (sortByTokens) {
					// Sort by content length (proxy for tokens)
					const aLength = a.content?.length || 0;
					const bLength = b.content?.length || 0;
					return bLength - aLength; // Descending order
				}
				// Default sort by label
				return (a.label || a.id).localeCompare(b.label || b.id);
			});
	}, [contextNodes, searchQuery, sortByTokens]);

	// Calculate paginated nodes
	const paginatedNodes = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredNodes.slice(startIndex, startIndex + itemsPerPage);
	}, [filteredNodes, currentPage, itemsPerPage]);

	// Effect to update selectAll state when selection changes
	useEffect(() => {
		if (selectedNodeIds.size === 0) {
			setSelectAll(false);
		} else if (
			selectedNodeIds.size === filteredNodes.length &&
			filteredNodes.length > 0
		) {
			setSelectAll(true);
		}
	}, [selectedNodeIds, filteredNodes]);

	// Reset selection when search changes
	useEffect(() => {
		setSelectedNodeIds(new Set());
		setSelectAll(false);
		setCurrentPage(1); // Reset to first page when search changes
	}, [searchQuery]);

	if (!isClient) {
		return (
			<div className="text-sm text-gray-500">Loading analysis workspace...</div>
		);
	}

	// DEBUG: Log both sources
	console.warn('🔴 [ContextManagement] COMPONENT RENDERED - Data sources:', {
		networkGraph_filteredResults_count: filteredResults?.length || 0,
		appStore_searchResults_count: searchResults?.length || 0,
		using_source: 'networkGraph_filteredResults'
	});

	// Function to check if a node is in context
	const checkIfNodeInContext = (nodeId: string) => {
		return contextNodes.some((node) => node.id === nodeId);
	};

	// Function to open the DocumentOverlay
	const openDocumentOverlay = (node: Node) => {
		setSelectedNode(node);
		setIsNodeInContext(true); // It's definitely in context when opened from here
		setShowDocumentOverlay(true);
	};

	// Function to handle toggling context
	const handleToggleContext = (nodeId: string) => {
		removeNodeFromContext(nodeId);
		setIsNodeInContext(false);
	};

	// Utility function to estimate tokens from character count (rough approximation)
	const estimateTokens = (text: string = '') => {
		// Approximate tokens as characters / 4 (rough estimate)
		return Math.ceil(text.length / 4);
	};

	// Handle bulk selection
	const toggleNodeSelection = (nodeId: string) => {
		setSelectedNodeIds((prev) => {
			const newSelection = new Set(prev);
			if (newSelection.has(nodeId)) {
				newSelection.delete(nodeId);
			} else {
				newSelection.add(nodeId);
			}
			return newSelection;
		});
	};

	// Toggle select all nodes
	const toggleSelectAll = () => {
		if (selectAll) {
			setSelectedNodeIds(new Set());
		} else {
			setSelectedNodeIds(new Set(filteredNodes.map((node) => node.id)));
		}
		setSelectAll(!selectAll);
	};

	// Toggle sort by tokens
	const toggleSortByTokens = () => {
		setSortByTokens(!sortByTokens);
		setCurrentPage(1); // Reset to first page when changing sort
	};

	// Pagination functions
	const goToNextPage = () => {
		if (currentPage < Math.ceil(filteredNodes.length / itemsPerPage)) {
			setCurrentPage(currentPage + 1);
		}
	};

	const goToPrevPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	// Remove selected nodes
	const removeSelectedNodes = () => {
		selectedNodeIds.forEach((id) => {
			removeNodeFromContext(id);
		});
		setSelectedNodeIds(new Set());
		setSelectAll(false);
	};

	// Create a simple summary object for the selected nodes
	const selectedNodesSummary = {
		nodes: contextNodes,
		allSelectedNodes: contextNodes,
		count: contextNodes.length,
	};

	return (
		<div className={rightPanelExpanded ? 'space-y-4' : 'space-y-4'}>
			<h4 className="text-lg font-semibold text-sidebar-foreground border-b border-sidebar-border pb-2">
				Context Management
			</h4>

			{/* Token/Character Limit Progress */}
			<div className="bg-muted/20 rounded p-3">
				<div className="flex items-center justify-between mb-1">
					<div className="text-sm font-medium text-sidebar-foreground/70">
						Token Usage
					</div>
					<div className="text-xs text-sidebar-foreground/50">
						{calculateContextStats.totalTokens?.toLocaleString() || '0'} /{' '}
						{maxTokenLimit.toLocaleString()}
					</div>
				</div>

				{/* Simple progress bar */}
				<div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
					<div
						className={`h-full ${
							(calculateContextStats.totalTokens || 0) > maxTokenLimit
								? 'bg-destructive/70'
								: 'bg-primary/70'
						}`}
						style={{
							width: `${Math.min(
								100,
								((calculateContextStats.totalTokens || 0) / maxTokenLimit) * 100
							)}%`,
						}}
					/>
				</div>
			</div>

			{/* Tab navigation for nodes/analysis/clustering views */}
			<Tabs
				value={activeTab}
				onValueChange={(value) =>
					setActiveTab(value as 'nodes' | 'analysis' | 'clustering')
				}
				className="mb-4">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger
						value="nodes"
						className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
						<CheckSquare className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Nodes</span>
					</TabsTrigger>
					<TabsTrigger
						value="analysis"
						className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
						<MessageSquare className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Analysis</span>
					</TabsTrigger>
					<TabsTrigger
						value="clustering"
						className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
						<BarChart4 className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Clustering</span>
					</TabsTrigger>
				</TabsList>

				{/* Nodes Tab Content */}
				<TabsContent value="nodes" className="mt-0">
					<div className="border-t border-sidebar-border pt-6">
						{/* Header */}
						<div className="mb-6">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-xl font-semibold text-gray-900">
									Context Nodes
								</h4>
								<span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
									{contextNodes.length} {contextNodes.length === 1 ? 'node' : 'nodes'}
								</span>
							</div>
							<p className="text-sm text-gray-600">
								Manage which nodes are included in your analysis context
							</p>
						</div>

						{/* Search bar */}
						<div className="flex flex-col gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search nodes..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
								{searchQuery && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSearchQuery('')}
										className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
										<X className="h-3 w-3" />
									</Button>
								)}
							</div>
						</div>
					</div>

					{/* Bulk operations toolbar */}
					<div className="flex flex-wrap items-center gap-2 mt-4">
						<Button
							variant="outline"
							size="sm"
							onClick={toggleSelectAll}
							className="text-xs h-7 px-2">
							{selectAll ? (
								<>
									<Square className="h-3 w-3 mr-1" />
									Deselect All
								</>
							) : (
								<>
									<CheckSquare className="h-3 w-3 mr-1" />
									Select All
								</>
							)}
						</Button>

						{/* Sort by tokens button */}
						<Button
							variant={sortByTokens ? 'default' : 'outline'}
							size="sm"
							onClick={toggleSortByTokens}
							className="text-xs h-7 px-2">
							<ArrowUpDown className="h-3 w-3 mr-1" />
							{sortByTokens ? 'By Tokens' : 'Sort by Tokens'}
						</Button>

						{selectedNodeIds.size > 0 && (
							<Button
								variant="destructive"
								size="sm"
								onClick={removeSelectedNodes}
								className="text-xs h-7 px-2 whitespace-nowrap">
								<Trash2 className="h-3 w-3 mr-1" />
								Remove {selectedNodeIds.size}{' '}
								{selectedNodeIds.size === 1 ? 'Node' : 'Nodes'}
							</Button>
						)}
					</div>

					{/* Node list */}
					<div className="mt-4">
						<div className="bg-muted/20 rounded p-2 max-h-[500px] overflow-y-auto">
							{filteredNodes.length > 0 ? (
								<table className="w-full text-xs">
									<thead>
										<tr className="border-b border-muted-foreground/20">
											<th className="w-6"></th>
											<th className="text-left py-1 font-medium text-muted-foreground">
												Node
											</th>
											<th className="text-right py-1 font-medium text-muted-foreground">
												Tokens
												{sortByTokens && (
													<ArrowUpDown className="inline h-3 w-3 ml-1" />
												)}
											</th>
											<th className="w-6"></th>
										</tr>
									</thead>
									<tbody>
										{paginatedNodes.map((node) => (
											<tr
												key={node.id}
												className={`hover:bg-muted/30 ${
													selectedNodeIds.has(node.id) ? 'bg-muted/20' : ''
												} cursor-pointer`}
												onClick={() => openDocumentOverlay(node)}>
												<td
													className="py-1"
													onClick={(e) => {
														e.stopPropagation();
														toggleNodeSelection(node.id);
													}}>
													<Button
														variant="ghost"
														size="sm"
														className="h-4 w-4 p-0">
														{selectedNodeIds.has(node.id) ? (
															<CheckSquare className="h-3 w-3 text-primary" />
														) : (
															<Square className="h-3 w-3 text-muted-foreground" />
														)}
													</Button>
												</td>
												<td className="py-1 pr-2 truncate max-w-[120px]">
													<div className="flex flex-col">
														<span className="font-medium">{node.label}</span>
														{node.type && (
															<span className="text-xs text-muted-foreground">
																{node.type}
															</span>
														)}
													</div>
												</td>
												<td className="py-1 pr-2 text-right text-muted-foreground/60">
													{estimateTokens(node.content).toLocaleString()}
												</td>
												<td
													className="py-1"
													onClick={(e) => {
														e.stopPropagation();
														removeNodeFromContext(node.id);
													}}>
													<Button
														variant="ghost"
														size="sm"
														className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive">
														×
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									{contextNodes.length > 0 ? (
										<p>No nodes match the search</p>
									) : (
										<div className="space-y-2">
											<p className="font-medium">No nodes in context yet</p>
											<p className="text-sm">Click nodes on the graph to add them to your analysis context</p>
										</div>
									)}
								</div>
							)}

							{/* Pagination Controls */}
							{filteredNodes.length > itemsPerPage && (
								<div className="flex items-center justify-between mt-3 text-xs">
									<div className="text-muted-foreground">
										Showing {(currentPage - 1) * itemsPerPage + 1}-
										{Math.min(currentPage * itemsPerPage, filteredNodes.length)}{' '}
										of {filteredNodes.length}
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="sm"
											onClick={goToPrevPage}
											disabled={currentPage === 1}
											className="h-6 w-6 p-0">
											<ChevronLeft className="h-3 w-3" />
										</Button>
										<span className="text-xs mx-2">
											{currentPage} /{' '}
											{Math.ceil(filteredNodes.length / itemsPerPage)}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={goToNextPage}
											disabled={
												currentPage >=
												Math.ceil(filteredNodes.length / itemsPerPage)
											}
											className="h-6 w-6 p-0">
											<ChevronRight className="h-3 w-3" />
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>
				</TabsContent>

				{/* Analysis Tab Content */}
				<TabsContent value="analysis" className="mt-0">
					<ChatInterface
						safeSelectedNodes={contextNodes.map((node) => node.id)}
						networkState={networkState}
						filterState={filterState}
						rightPanelExpanded={rightPanelExpanded}
						selectedNodesSummary={selectedNodesSummary}
					/>
				</TabsContent>

				{/* Clustering Tab Content */}
				<TabsContent value="clustering" className="mt-0">
					{(() => {
						// DEBUG: Log what we're about to pass
						console.warn(' [ContextManagement] Passing to ClusteringInterface:', {
							allNodes_being_passed_count: filteredResults?.length || 0,
							allNodes_source: 'NetworkGraph.filteredResults'
						});
						return null;
					})()}
					<ClusteringInterface
						contextNodes={contextNodes}
						rightPanelExpanded={rightPanelExpanded}
						onSwitchToChat={() => setActiveTab('analysis')}
						allNodes={filteredResults}
					/>
				</TabsContent>
			</Tabs>

			{/* Document Overlay */}
			{showDocumentOverlay && selectedNode && (
				<DocumentOverlay
					document={{
						id: selectedNode.id,
						title: selectedNode.label,
						description: selectedNode.summary || '',
						content: selectedNode.content || '',
						status: 'unread',
					}}
					onClose={() => setShowDocumentOverlay(false)}
					isInContext={isNodeInContext}
					onToggleContext={() => handleToggleContext(selectedNode.id)}
				/>
			)}
		</div>
	);
}

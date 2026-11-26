'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { PANEL_HEADER, PANEL_TAB } from '@/components/layout/PanelChrome';
import { ContextGroups, type ContextGrouping } from './ContextGroups';
import { useHasAiClusters } from '@/hooks/use-ai-clusters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
	Search,
	X,
	CheckSquare,
	Square,
	Network,
	MessageSquare,
	Trash2,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { useContextStore } from '@/lib/stores/context-store';
import { useAppStore } from '@/lib/stores/app-state';
import DocumentOverlay from '@/components/network/DocumentOverlay';
import ChatInterface from '@/components/analysis/ChatInterface';
import { CLUSTER_CHAT_EVENT, OPEN_CHAT_EVENT } from '@/lib/chat/new-chat';
import ClusteringInterface from '@/components/analysis/ClusteringInterface';
import { contextTokens, nodeTokens } from '@/lib/utils/llm-tokens';
import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';

interface Node {
	id: string;
	label: string;
	summary?: string;
	content?: string;
	documentType?: string;
	continent?: string;
	country?: string;
	publisher?: string;
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
	/** The panel's own buttons, either side of the tabs (widen, close) */
	headerStart?: ReactNode;
	headerEnd?: ReactNode;
	/** Spread onto the header: double-click to widen or narrow */
	headerProps?: { onDoubleClick: () => void; title: string };
	networkState?: any;
	filterState?: any;
}

export default function ContextManagement({
	rightPanelExpanded,
	headerStart,
	headerEnd,
	headerProps,
	networkState = {},
	filterState = {},
}: ContextManagementProps) {
	const [isClient, setIsClient] = useState(false);

	// Get all store state - MUST be called before conditional returns
	const highlight = useHighlightOnHover(); // Hover a row to highlight its node on the graph
	const showActiveNodes = useAppStore((state) => state.showActiveNodes);
	const setShowActiveNodes = useAppStore((state) => state.setShowActiveNodes);

	// Get nodes from NetworkGraph context (same source as the graph itself!)
	const filteredResults = useAppStore((state) => state.filteredResults);

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
	>('analysis');
	const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
		new Set()
	);
	const [selectAll, setSelectAll] = useState(false);
	const [sortByTokens, setSortByTokens] = useState(false);
	// The graph menus start a chat and ask for the Chat tab
	// …or for Clusters, clustering the open chat's documents as soon as it opens
	const [clusterOnOpen, setClusterOnOpen] = useState(false);
	useEffect(() => {
		const show = () => setActiveTab('analysis');
		const cluster = () => {
			setClusterOnOpen(true);
			setActiveTab('clustering');
		};
		window.addEventListener(OPEN_CHAT_EVENT, show);
		window.addEventListener(CLUSTER_CHAT_EVENT, cluster);
		return () => {
			window.removeEventListener(OPEN_CHAT_EVENT, show);
			window.removeEventListener(CLUSTER_CHAT_EVENT, cluster);
		};
	}, []);
	// Group the context by search (once there are two) or by AI cluster (once clustered)
	const [grouping, setGrouping] = useState<ContextGrouping | 'none'>('search');
	const hasSearches = useAppStore((s) => s.rounds.length > 1);
	const hasClusters = useHasAiClusters();
	const groupings = [...(hasSearches ? ['search' as const] : []), ...(hasClusters ? ['cluster' as const] : [])];
	const groupedBy = groupings.find((g) => g === grouping) ?? 'none';
	const [currentPage, setCurrentPage] = useState(1);

	// ALL EFFECT HOOKS - MUST be called before conditional returns
	useEffect(() => {
		setIsClient(true);
	}, []);

	// DEBUG: Log when searchResults changes
	useEffect(() => {
		console.warn('🟡 [ContextManagement] searchResults CHANGED:', {
			count: searchResults?.length || 0,
			hasData: searchResults && searchResults.length > 0,
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

		// Tokens of the prompt the AI actually receives (excerpts + instructions)
		const estimatedTokens = contextTokens(contextNodes);

		// Count nodes by document type
		const nodesByType = contextNodes.reduce((acc, node) => {
			const type = node.documentType || 'unknown';
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		// Calculate average content length
		const avgContentLength =
			contextNodes.length > 0
				? Math.round(totalChars / contextNodes.length)
				: 0;

		return {
			totalNodes: contextNodes.length,
			totalChars,
			totalTokens: estimatedTokens,
			averageCharsPerNode: avgContentLength,
			averageTokensPerNode:
				contextNodes.length > 0
					? Math.round(estimatedTokens / contextNodes.length)
					: 0,
			typeDistribution: [], // Will be implemented later if needed
			countryDistribution: [], // Will be implemented later if needed
		};
	}, [contextNodes]);

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
					// Most tokens sent first
					return nodeTokens(b) - nodeTokens(a);
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
		using_source: 'networkGraph_filteredResults',
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
	const MAX_NODES = PROMPT_CONFIG.MAX_NODES_PER_REQUEST;
	const overLimit = contextNodes.length > MAX_NODES;

	const selectedNodesSummary = {
		nodes: contextNodes,
		allSelectedNodes: contextNodes,
		count: contextNodes.length,
	};

	// What the AI will receive, in one line above the chat box (was its own box)
	const budgetLine = (
		<p className={`text-xs ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`} data-testid="context-budget">
			{overLimit
				? `${contextNodes.length} documents: the AI takes up to ${MAX_NODES}. Remove ${contextNodes.length - MAX_NODES} to ask.`
				: `${contextNodes.length} ${contextNodes.length === 1 ? 'document' : 'documents'} · ~${calculateContextStats.totalTokens.toLocaleString()} of ${PROMPT_CONFIG.CONTEXT_WINDOW_TOKENS.toLocaleString()} tokens`}
		</p>
	);


	// The open chat's documents: shown in the chat's documents strip (no separate Context tab)
	const documentsList = (
		<>
					{/* One slim row: search, and sort by size */}
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search this chat's documents"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-8 pl-8 text-sm"
							/>
							{searchQuery && (
								<button
									type="button"
									aria-label="Clear search"
									onClick={() => setSearchQuery('')}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
									<X className="h-3 w-3" />
								</button>
							)}
						</div>
						<button
							type="button"
							onClick={toggleSortByTokens}
							aria-pressed={sortByTokens}
							title={sortByTokens ? 'Sorted by tokens (largest first)' : 'Sort by tokens'}
							aria-label="Sort by tokens"
							className={`flex h-8 w-8 items-center justify-center rounded-md border ${sortByTokens ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50'}`}>
							<ArrowUpDown className="h-3.5 w-3.5" />
						</button>
					</div>

					{/* Selection, in words: Select all · 3 selected · Remove */}
					<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
						<button type="button" onClick={toggleSelectAll} className="hover:text-foreground">
							{selectAll ? 'Deselect all' : 'Select all'}
						</button>
						{selectedNodeIds.size > 0 && (
							<>
								<span>{selectedNodeIds.size} selected</span>
								<button type="button" onClick={removeSelectedNodes} className="text-red-600 hover:text-red-700">
									Remove from this chat
								</button>
							</>
						)}
					</div>

					{groupings.length > 0 && (
						<div className="mt-3 flex items-center gap-1 text-xs" role="group" aria-label="Group context">
							<span className="text-muted-foreground">Group:</span>
							{[...groupings, 'none' as const].map((g) => (
								<button
									key={g}
									type="button"
									aria-pressed={groupedBy === g}
									onClick={() => setGrouping(g)}
									className={`rounded px-2 py-0.5 capitalize ${groupedBy === g ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent/50'}`}>
									{g}
								</button>
							))}
						</div>
					)}

					{groupedBy !== 'none' ? (
						<div className="mt-3">
							<ContextGroups
								nodes={filteredNodes}
								by={groupedBy}
								onOpen={openDocumentOverlay}
								onAsk={(message) => {
									// Same hand-off as the Clusters tab: switch to Chat, then send
									setActiveTab('analysis');
									setTimeout(() => window.dispatchEvent(new CustomEvent('chat:send', { detail: { message } })), 100);
								}}
							/>
						</div>
					) : (
					/* Node list */
					<div className="mt-4">
						<div className="bg-muted/20 rounded p-2 max-h-[500px] overflow-y-auto">
							{filteredNodes.length > 0 ? (
								<table data-testid="context-table" className="w-full text-xs">
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
												{...highlight(node.id)}
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
														{node.documentType && (
															<span className="text-xs text-muted-foreground">
																{node.publisher ? `${node.publisher} · ` : ''}{node.documentType}
															</span>
														)}
													</div>
												</td>
												<td className="py-1 pr-2 text-right text-muted-foreground/60">
													{nodeTokens(node).toLocaleString()}
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
										<p>No documents match the search</p>
									) : (
										<div className="space-y-2">
											<p className="font-medium">No documents in this chat yet</p>
											<p className="text-sm">Click documents on the graph, turn on their switch in the results, or right-click to analyze a cluster</p>
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
					)}
		</>
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* The tabs are the panel's header, like Search | Filters on the left */}
			<Tabs
				value={activeTab}
				onValueChange={(value) =>
					setActiveTab(value as 'nodes' | 'analysis' | 'clustering')
				}
				className="flex min-h-0 flex-1 flex-col">
				<div data-panel-header="right" className={`${PANEL_HEADER} shrink-0 bg-sidebar`} {...headerProps}>
					{headerStart}
					{/* Stays a compact group in the middle when the panel is wide */}
					<TabsList className="grid flex-1 max-w-xs mx-auto grid-cols-2 bg-transparent p-0 h-auto gap-0">
						<TabsTrigger value="analysis" className={PANEL_TAB}>
							<MessageSquare className="h-3 w-3" />
							<span>Chat</span>
						</TabsTrigger>
						<TabsTrigger value="clustering" className={PANEL_TAB}>
							<Network className="h-3 w-3" />
							<span>Clusters</span>
						</TabsTrigger>
					</TabsList>
					{headerEnd}
				</div>
				{/* Only what's under the tabs scrolls, so the scrollbar starts below them */}
				<div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]" data-panel-scroll="right">
				<div className="p-4">

				{/* Analysis Tab Content */}
				<TabsContent value="analysis" className="mt-0">
					<ChatInterface
						safeSelectedNodes={contextNodes.map((node) => node.id)}
						networkState={networkState}
						filterState={filterState}
						rightPanelExpanded={rightPanelExpanded}
						selectedNodesSummary={selectedNodesSummary}
						contextSummary={budgetLine}
						documents={documentsList}
					/>
				</TabsContent>

				{/* Clustering Tab Content */}
				<TabsContent value="clustering" className="mt-0">
					<ClusteringInterface
						contextNodes={contextNodes}
						rightPanelExpanded={rightPanelExpanded}
						onSwitchToChat={() => setActiveTab('analysis')}
						runOnOpen={clusterOnOpen}
						onRan={() => setClusterOnOpen(false)}
						allNodes={filteredResults}
					/>
				</TabsContent>
				</div>
				</div>
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

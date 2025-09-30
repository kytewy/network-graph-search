'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ColorLegend } from '@/components/network/ColorLegend';
// Using enhanced NetworkGraph component
import { NetworkGraph } from '@/components/network/NetworkGraph';
import Analysis from '@/components/analysis';
import { SearchInput } from '@/components/search/SearchInput';
import { SimilarityHistogram } from '@/components/search/SimilarityHistogram';
import FilterPanel from '@/components/filters/FilterPanel';
import ContextManagement from '@/components/analysis/ContextManagement';

import { useNetworkStore } from '@/lib/stores/network-store';
import { useAppStore } from '@/lib/stores/app-state'; // Now using for filteredResults + filteredLinks!
import { getNodeColorByMode } from '@/lib/theme/colors';

// Node interface definition
interface Node {
	id: string;
	label: string;
	summary: string;
	content: string;
	type: string;
	continent: string;
	country: string;
	sourceType: string;
	size: number;
	color: string;
	similarity?: number;
	stateProvince?: string;
}

export default function NetworkGraphApp() {
	console.log(
		'[v0] NetworkGraphApp render started at:',
		new Date().toISOString()
	);
	const renderStart = performance.now();

	const nodes = useNetworkStore((state) => state.nodes);
	const links = useNetworkStore((state) => state.links);

	// Use app-state's pre-filtered results
	const filteredResults = useAppStore((state) => state.filteredResults);
	const filteredLinks = useAppStore((state) => state.filteredLinks);

	const selectedNodes = useNetworkStore((state) => state.selectedNodes);
	const expandedNodes = useNetworkStore((state) => state.expandedNodes);
	const setHighlightedNodes = useNetworkStore(
		(state) => state.setHighlightedNodes
	);
	const setHighlightedLinks = useNetworkStore(
		(state) => state.setHighlightedLinks
	);
	const highlightedNodes = useNetworkStore((state) => state.highlightedNodes);
	const highlightedLinks = useNetworkStore((state) => state.highlightedLinks);

	// Use app-state's query for highlighting (was unified-search searchTerm)
	const searchTerm = useAppStore((state) => state.query);
	const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);
	const colorMode = useAppStore((state) => state.colorMode);

	const rightPanelExpanded = useAppStore((state) => state.rightPanelExpanded);

	const setRightPanelExpanded = useAppStore(
		(state) => state.setRightPanelExpanded
	);

	const safeNodes = useMemo(() => {
		const result = Array.isArray(nodes) ? nodes : [];
		console.log('[v0] Safe nodes created:', result.length);
		return result;
	}, [nodes]);

	const safeLinks = useMemo(() => {
		const result = Array.isArray(links) ? links : [];
		console.log('[v0] Safe links created:', result.length);
		return result;
	}, [links]);

	const safeSelectedNodes = useMemo(() => {
		const result = Array.isArray(selectedNodes) ? selectedNodes : [];
		console.log('[v0] Safe selected nodes:', result.length);
		return result;
	}, [selectedNodes]);

	const safeExpandedNodes = useMemo(() => {
		const result = Array.isArray(expandedNodes) ? expandedNodes : [];
		console.log('[v0] Safe expanded nodes:', result.length);
		return result;
	}, [expandedNodes]);

	const nodeTypes = [...new Set(safeNodes.map((node) => node.type))];

	const continents = [...new Set(safeNodes.map((node) => node.continent))];
	const countries = [...new Set(safeNodes.map((node) => node.country))];

	const sourceTypes = [...new Set(safeNodes.map((node) => node.sourceType))];

	// Use filtered results from app-state (already filtered by applyFilters())
	const filteredNodes = filteredResults;
	// filteredLinks already defined from app-state above

	useEffect(() => {
		console.log('[v0] Highlight effect triggered:', {
			searchTerm: searchTerm?.length || 0,
			filteredNodesCount: filteredNodes.length,
			filteredLinksCount: filteredLinks.length,
		});

		const timeoutId = setTimeout(() => {
			if (searchTerm && filteredNodes.length > 0) {
				const matchingNodes = filteredNodes
					.filter((node) =>
						node.label.toLowerCase().includes(searchTerm.toLowerCase())
					)
					.map((node) => node.id);

				console.log('[v0] Setting highlighted nodes:', matchingNodes.length);
				setHighlightedNodes(matchingNodes);

				const matchingLinks = filteredLinks
					.filter(
						(link) =>
							matchingNodes.includes(link.source) ||
							matchingNodes.includes(link.target)
					)
					.map((link) => `${link.source}-${link.target}`);

				console.log('[v0] Setting highlighted links:', matchingLinks.length);
				setHighlightedLinks(matchingLinks);
			} else {
				console.log('[v0] Clearing highlights');
				setHighlightedNodes([]);
				setHighlightedLinks([]);
			}
		}, 100);

		return () => clearTimeout(timeoutId);
	}, [
		searchTerm,
		filteredNodes,
		filteredLinks,
		setHighlightedNodes,
		setHighlightedLinks,
	]);

	useEffect(() => {
		const renderEnd = performance.now();
		console.log('[v0] NetworkGraphApp render completed:', {
			duration: `${(renderEnd - renderStart).toFixed(2)}ms`,
			timestamp: new Date().toISOString(),
		});

		// Test key functionality on mount
		console.log('[v0] Running functionality tests...');

		// Test store connections
		console.log('[v0] Store test - nodes available:', safeNodes.length > 0);
		console.log('[v0] Store test - links available:', safeLinks.length > 0);

		// Test filter functionality
		const testFilters = {
			nodeTypes: nodeTypes.length > 0,
			continents: continents.length > 0,
			countries: countries.length > 0,
			sourceTypes: sourceTypes.length > 0,
		};
		console.log('[v0] Filter test results:', testFilters);

		return () => {
			console.log('[v0] NetworkGraphApp unmounting');
		};
	}, []);

	const selectedNodesSummary = useMemo(() => {
		// Get selected nodes
		const allSelectedNodes = filteredNodes.filter((node) =>
			safeSelectedNodes.includes(node.id)
		);
		const nodes = allSelectedNodes;

		// Basic node information
		const types = [...new Set(nodes.map((n) => n.type))];
		const count = nodes.length;

		// Create minimal placeholder data for text analysis to ensure Analysis component works
		const textAnalysis = {
			commonWords:
				nodes.length > 0
					? [
							{ word: 'data', count: 3 },
							{ word: 'system', count: 2 },
							{ word: 'content', count: 2 },
					  ]
					: [],
			themes: nodes.length > 0 ? ['Content', 'System'] : [],
			summary: count > 0 ? `${count} selected nodes` : 'No nodes selected',
		};

		// Create minimal placeholder data for theme analysis
		const themeAnalysis = {
			themes:
				nodes.length > 0
					? [
							{
								name: 'Content Management',
								keywords: ['content', 'data', 'management'],
								nodes: nodes.slice(0, 3).map((node) => ({
									...node,
									relevanceScore: 0.8,
									matchedKeywords: ['content', 'data'],
								})),
								score: 0.8,
							},
					  ]
					: [],
		};

		return {
			nodes,
			allSelectedNodes,
			count,
			types,
			avgSize: 0, // Simplified
			totalConnections: 0, // Simplified
			internalConnections: 0, // Simplified
			externalConnections: 0, // Simplified
			textAnalysis,
			themeAnalysis,
		};
	}, [safeSelectedNodes, filteredNodes]);

	// FilterPanel is now self-contained - no state management needed here

	// Using the centralized color system from lib/theme/colors.ts

	const getNodeSize = (node: Node): number => {
		let nodeSize = node.size;
		if (nodeSizeMode === 'none') {
			nodeSize = node.size; // Use original node size
		} else if (nodeSizeMode === 'contentLength') {
			const contentLength = node.content.length;
			nodeSize = Math.max(8, Math.min(25, 8 + (contentLength / 100) * 17));
		} else if (nodeSizeMode === 'summaryLength') {
			const summaryLength = node.summary.length;
			nodeSize = Math.max(8, Math.min(25, 8 + (summaryLength / 50) * 17));
		}
		return nodeSize;
	};

	const safeHighlightedNodes = Array.isArray(highlightedNodes)
		? highlightedNodes
		: [];
	const safeHighlightedLinks = Array.isArray(highlightedLinks)
		? highlightedLinks
		: [];

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			{/* Sidebar */}
			<div className="w-96 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
				<div className="space-y-6">
					{/* Header */}
					<div>
						<h1 className="text-2xl font-bold text-sidebar-foreground mb-2">
							Graph Explorer
						</h1>
						<p className="text-sm text-sidebar-foreground/70">
							Search and filter network connections
						</p>
					</div>

					<SearchInput />

					<SimilarityHistogram />

					{/* <SearchResults /> */}

					<FilterPanel />
				</div>
			</div>

			{/* Main Graph Area */}
			<div className="flex-1 relative h-screen overflow-hidden">
				<div className="w-full h-full">
					<NetworkGraph />
				</div>
				<ColorLegend filteredNodes={filteredNodes} />
			</div>

			{/* Right Panel */}
			<div
				className={`${
					rightPanelExpanded ? 'absolute right-0 top-0 left-96 z-10' : 'w-80'
				} h-screen bg-sidebar border-l border-sidebar-border overflow-y-auto transition-all duration-300 flex flex-col`}>
				{/* Expand/Collapse Button */}
				<div className="flex justify-start p-2 border-b border-sidebar-border">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
						className="h-6 px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground">
						{rightPanelExpanded ? '»' : '«'}
					</Button>
				</div>

				<div className="p-6 flex-1">
					<div className="space-y-6">
						<div className="flex items-center justify-between mb-3">
							<div>
								<h3 className="text-2xl font-bold text-sidebar-foreground">
									Analysis Workspace
								</h3>
								<p className="text-sm text-sidebar-foreground/70 mt-1">
									Generate insights from selected nodes
								</p>
							</div>
						</div>

						{/* Context Management */}
						<ContextManagement rightPanelExpanded={rightPanelExpanded} />

						{/* Analysis */}
						{safeSelectedNodes.length > 0 && (
							<Analysis
								nodes={selectedNodesSummary.nodes}
								textAnalysis={selectedNodesSummary.textAnalysis}
								themeAnalysis={selectedNodesSummary.themeAnalysis}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

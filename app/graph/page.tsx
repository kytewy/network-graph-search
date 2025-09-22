'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import LayoutControls from '@/components/ui/LayoutControls';
import { ColorLegend } from '@/components/ui/ColorLegend';
// Using enhanced NetworkGraph component
import { NetworkGraph } from '@/components/network/NetworkGraph';
import Analysis from '@/components/analysis';
// Using enhanced VectorSearchPanel component
import { VectorSearchPanel } from '@/components/search/VectorSearchPanel';
import { SearchResults } from '@/components/search/SearchResults';
import FilterPanel from '@/components/filters/FilterPanel';
import ContextManagement from '@/components/analysis/ContextManagement';
import ChatInterface from '@/components/analysis/ChatInterface';
import { SimilarityHistogram } from '@/components/visualization/SimilarityHistogram';

import { useNetworkStore } from '@/lib/stores/network-store';
import { useFilterStore } from '@/lib/stores/filter-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useUnifiedSearchStore } from '@/lib/stores/unified-search-store';
import { useLayoutStore } from '@/lib/stores/layout-store';
import { useAppStore } from '@/lib/stores/app-state';
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

interface NetworkState {
	nodes: Node[];
	links: any[];
	selectedNodes: string[];
	expandedNodes: string[];
	highlightedNodes: string[];
	highlightedLinks: string[];
	layoutType: 'forceDirected' | 'concentric' | 'radial';
}

interface NetworkGraphProps {
	nodes: Node[];
	links: any[];
	highlightedNodes: string[];
	highlightedLinks: string[];
	showLabels: boolean;
	onNodeClick?: (node: Node) => void;
	onNodeSelection?: (nodeIds: string[]) => void;
	selectedNodes?: string[];
	expandedNodes?: string[];
	onNodeExpand?: (nodeId: string) => void;
	layoutType?: string;
	onReorganizeLayout?: React.MutableRefObject<(() => void) | null>;
	onArrangeAsTree?: React.MutableRefObject<(() => void) | null>;
	onSendToContext?: (nodes: Node[]) => void;
}

export default function NetworkGraphApp() {
	console.log(
		'[v0] NetworkGraphApp render started at:',
		new Date().toISOString()
	);
	const renderStart = performance.now();

	const nodes = useNetworkStore((state) => state.nodes);
	const links = useNetworkStore((state) => state.links);
	const selectedNodes = useNetworkStore((state) => state.selectedNodes);
	const expandedNodes = useNetworkStore((state) => state.expandedNodes);
	const layoutType = useNetworkStore((state) => state.layoutType) as
		| 'forceDirected'
		| 'concentric'
		| 'radial';
	const setHighlightedNodes = useNetworkStore(
		(state) => state.setHighlightedNodes
	);
	const setHighlightedLinks = useNetworkStore(
		(state) => state.setHighlightedLinks
	);
	const highlightedNodes = useNetworkStore((state) => state.highlightedNodes);
	const highlightedLinks = useNetworkStore((state) => state.highlightedLinks);
	const setSelectedNodes = useNetworkStore((state) => state.setSelectedNodes);
	const removeSelectedNode = useNetworkStore(
		(state) => state.removeSelectedNode
	);
	const toggleNodeExpansion = useNetworkStore(
		(state) => state.toggleNodeExpansion
	);

	const searchTerm = useUnifiedSearchStore((state) => state.searchTerm);
	const selectedNodeTypes = useFilterStore((state) => state.selectedNodeTypes);
	const selectedContinents = useFilterStore(
		(state) => state.selectedContinents
	);
	const selectedCountries = useFilterStore((state) => state.selectedCountries);
	const selectedSourceTypes = useFilterStore(
		(state) => state.selectedSourceTypes
	);
	const deselectedNodeTypes = useFilterStore(
		(state) => state.deselectedNodeTypes
	);
	const minNodeSize = useFilterStore((state) => state.minNodeSize);
	const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);
	const colorMode = useAppStore((state) => state.colorMode);
	const expandedContinents = useFilterStore(
		(state) => state.expandedContinents
	);

	const setExpandedContinents = useFilterStore(
		(state) => state.setExpandedContinents
	);
	const countrySearchTerm = useFilterStore((state) => state.countrySearchTerm);

	const apiKey = useUIStore((state) => state.apiKey);

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

	// Vector search is now used instead of TF-IDF calculation

	const filteredNodes = useMemo(() => {
		const filterStart = performance.now();
		console.log('[v0] Filtering nodes started, input count:', safeNodes.length);
		console.log('[v0] Filter conditions:', {
			searchTerm: searchTerm?.length || 0,
			selectedNodeTypes: selectedNodeTypes?.length || 0,
			selectedContinents: selectedContinents?.length || 0,
			selectedCountries: selectedCountries?.length || 0,
			selectedSourceTypes: selectedSourceTypes?.length || 0,
			minNodeSize: minNodeSize?.[0] || 0,
		});

		const searchLower = searchTerm?.trim()?.toLowerCase();
		const hasSearch = Boolean(searchLower);
		const hasTypeFilters = selectedNodeTypes?.length > 0;
		const hasContinentFilters = selectedContinents?.length > 0;
		const hasCountryFilters = selectedCountries?.length > 0;
		const hasSourceFilters = selectedSourceTypes?.length > 0;
		const hasSizeFilter = minNodeSize?.[0] > 0;
		const needsSimilarity = false;

		const result = safeNodes
			.filter((node) => {
				// Early return for search filter
				if (hasSearch) {
					const nodeText =
						`${node.label} ${node.summary} ${node.content} ${node.type} ${node.continent} ${node.country} ${node.sourceType}`.toLowerCase();
					if (!nodeText.includes(searchLower)) return false;
				}

				// Type filters with early returns
				if (hasTypeFilters && !selectedNodeTypes.includes(node.type))
					return false;
				if (hasContinentFilters && !selectedContinents.includes(node.continent))
					return false;
				if (hasCountryFilters && !selectedCountries.includes(node.country))
					return false;
				if (hasSourceFilters && !selectedSourceTypes.includes(node.sourceType))
					return false;

				// Size filter
				if (hasSizeFilter && (node.size || 10) < minNodeSize[0]) return false;

				return true;
			})
			.map((node) => {
				if (!needsSimilarity) return node;

				return node;
			});

		const filterEnd = performance.now();
		console.log('[v0] Filtering completed:', {
			inputCount: safeNodes.length,
			outputCount: result.length,
			duration: `${(filterEnd - filterStart).toFixed(2)}ms`,
		});

		return result;
	}, [
		safeNodes,
		searchTerm,
		selectedNodeTypes,
		selectedContinents,
		selectedCountries,
		selectedSourceTypes,
		minNodeSize,
	]);

	const filteredLinks = useMemo(() => {
		const linkStart = performance.now();
		const nodeIds = new Set(filteredNodes.map((node) => node.id));
		const result = safeLinks.filter(
			(link) => nodeIds.has(link.source) && nodeIds.has(link.target)
		);
		const linkEnd = performance.now();

		console.log('[v0] Link filtering completed:', {
			inputCount: safeLinks.length,
			outputCount: result.length,
			duration: `${(linkEnd - linkStart).toFixed(2)}ms`,
		});

		return result;
	}, [safeLinks, filteredNodes]);

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
	}, [searchTerm, filteredNodes, filteredLinks]);

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

	const handleNodeSelection = useCallback(
		(nodeIds: string[]) => {
			try {
				console.log('[v0] Node selection:', nodeIds.length);
				setSelectedNodes(nodeIds);
			} catch (error) {
				console.error('[v0] Error in handleNodeSelection:', error);
			}
		},
		[setSelectedNodes]
	);

	const onNodeExpand = useCallback(
		(nodeId: string) => {
			try {
				console.log('[v0] Node expand:', nodeId);
				toggleNodeExpansion(nodeId);
			} catch (error) {
				console.error('[v0] Error in onNodeExpand:', error);
			}
		},
		[toggleNodeExpansion]
	);

	const removeNodeFromSelection = (nodeId: string) => {
		removeSelectedNode(nodeId);
	};

	const selectedNodesSummary = useMemo(() => {
		// Get selected nodes
		const allSelectedNodes = filteredNodes.filter((node) =>
			safeSelectedNodes.includes(node.id)
		);
		const nodes = allSelectedNodes.filter(
			(node) => !deselectedNodeTypes.includes(node.type)
		);

		// Basic node information
		const types = [...new Set(nodes.map((n) => n.type))];
		const count = nodes.length;

		// Create minimal placeholder data for text analysis to ensure Analysis component works
		const textAnalysis = {
			commonWords: nodes.length > 0 
				? [
					{ word: 'data', count: 3 },
					{ word: 'system', count: 2 },
					{ word: 'content', count: 2 }
				]
				: [],
			themes: nodes.length > 0 ? ['Content', 'System'] : [],
			summary: count > 0 ? `${count} selected nodes` : 'No nodes selected'
		};

		// Create minimal placeholder data for theme analysis
		const themeAnalysis = {
			themes: nodes.length > 0 
				? [{
					name: 'Content Management',
					keywords: ['content', 'data', 'management'],
					nodes: nodes.slice(0, 3).map(node => ({
						...node,
						relevanceScore: 0.8,
						matchedKeywords: ['content', 'data']
					})),
					score: 0.8
				}]
				: []
		};

		return {
			nodes,
			allSelectedNodes,
			count,
			types,
			avgSize: 0,  // Simplified
			totalConnections: 0,  // Simplified
			internalConnections: 0,  // Simplified
			externalConnections: 0,  // Simplified
			textAnalysis,
			themeAnalysis,
		};
	}, [safeSelectedNodes, filteredNodes, deselectedNodeTypes]);

	const toggleExpandedContinent = (continent: string) => {
		const currentExpanded = expandedContinents || [];
		if (currentExpanded.includes(continent)) {
			setExpandedContinents(currentExpanded.filter((c) => c !== continent));
		} else {
			setExpandedContinents([...currentExpanded, continent]);
		}
	};

	const continentCountries = useMemo(() => {
		const grouping: Record<string, string[]> = {};
		safeNodes.forEach((node) => {
			if (!grouping[node.continent]) {
				grouping[node.continent] = [];
			}
			if (!grouping[node.continent].includes(node.country)) {
				grouping[node.continent].push(node.country);
			}
		});
		// Sort countries alphabetically within each continent
		Object.keys(grouping).forEach((continent) => {
			grouping[continent].sort();
		});
		return grouping;
	}, [safeNodes]);

	const filteredContinentCountries = useMemo(() => {
		if (!countrySearchTerm) return continentCountries;

		const filtered: Record<string, string[]> = {};
		Object.entries(continentCountries).forEach(([continent, countries]) => {
			const matchingCountries = countries.filter((country) =>
				country.toLowerCase().includes(countrySearchTerm.toLowerCase())
			);
			if (matchingCountries.length > 0) {
				filtered[continent] = matchingCountries;
			}
		});
		return filtered;
	}, [continentCountries, countrySearchTerm]);

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

	const transformedNodes = useMemo(() => {
		return filteredNodes.map((node) => ({
			...node,
			color: getNodeColorByMode(node, colorMode),
			size: getNodeSize(node),
		}));
	}, [filteredNodes, colorMode, nodeSizeMode]);

	const networkState = useNetworkStore();
	const filterState = useFilterStore();

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

					<VectorSearchPanel />

					<SimilarityHistogram />

					{/* <SearchResults /> */}

					<FilterPanel
						filteredNodes={filteredNodes}
						filteredLinks={filteredLinks}
						safeNodes={safeNodes}
						sourceTypes={sourceTypes}
						safeHighlightedNodes={safeHighlightedNodes}
						safeExpandedNodes={safeExpandedNodes}
						toggleExpandedContinent={toggleExpandedContinent}
						continentCountries={continentCountries}
						filteredContinentCountries={filteredContinentCountries}
					/>
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
						<ContextManagement
							rightPanelExpanded={rightPanelExpanded}
						/>

						{/* Analysis */}
						{safeSelectedNodes.length > 0 && (
							<Analysis
								nodes={selectedNodesSummary.nodes}
								textAnalysis={selectedNodesSummary.textAnalysis}
								themeAnalysis={selectedNodesSummary.themeAnalysis}
							/>
						)}

						{/* Chat Input Interface */}
						<ChatInterface
							safeSelectedNodes={safeSelectedNodes.map((node) => node.id)}
							networkState={networkState}
							filterState={filterState}
							rightPanelExpanded={rightPanelExpanded}
							selectedNodesSummary={selectedNodesSummary}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

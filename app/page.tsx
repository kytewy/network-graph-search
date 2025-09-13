'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
	Filter,
	Zap,
	Eye,
	EyeOff,
	X,
	ChevronDown,
	AlertTriangle,
	FileText,
	Globe,
} from 'lucide-react';
import { ColorLegend } from '@/components/ui/ColorLegend';
import NetworkGraph from '@/components/network-graph';
import Analysis from '@/components/analysis';
import { Textarea } from '@/components/ui/textarea';
import SimilarityHistogram from '@/components/similarity-histogram';
import SearchPanel from '@/components/search/SearchPanel';
import FilterPanel from '@/components/filters/FilterPanel';
import ContextManagement from '@/components/analysis/ContextManagement';

import { useNetworkStore } from '@/lib/stores/network-store';
import { useFilterStore } from '@/lib/stores/filter-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useSearchStore } from '@/lib/stores/search-store';
import { useLayoutStore } from '@/lib/stores/layout-store';

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
	const selectedNodes = useNetworkStore((state) => state.selectedNodes);
	const expandedNodes = useNetworkStore((state) => state.expandedNodes);
	const layoutType = useNetworkStore((state) => state.layoutType);
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

	const searchTerm = useSearchStore((state) => state.searchTerm);
	const searchMode = useFilterStore((state) => state.searchMode);
	const selectedNodeTypes = useFilterStore((state) => state.selectedNodeTypes);
	const selectedContinents = useFilterStore(
		(state) => state.selectedContinents
	);
	const selectedCountries = useFilterStore((state) => state.selectedCountries);
	const selectedSourceTypes = useFilterStore(
		(state) => state.selectedSourceTypes
	);
	const selectedSimilarityRange = useFilterStore(
		(state) => state.selectedSimilarityRange
	);
	const deselectedNodeTypes = useFilterStore(
		(state) => state.deselectedNodeTypes
	);
	const minNodeSize = useFilterStore((state) => state.minNodeSize);
	const nodeSizeMode = useLayoutStore((state) => state.nodeSizeMode);
	const colorMode = useLayoutStore((state) => state.colorMode);
	const useSimilaritySize = useFilterStore((state) => state.useSimilaritySize);
	const expandedContinents = useFilterStore(
		(state) => state.expandedContinents
	);
	const setSearchTerm = useSearchStore((state) => state.setSearchTerm);
	const toggleContinent = useFilterStore((state) => state.toggleContinent);
	const toggleCountry = useFilterStore((state) => state.toggleCountry);
	const toggleSourceType = useFilterStore((state) => state.toggleSourceType);
	const toggleSimilarityRange = useFilterStore(
		(state) => state.toggleSimilarityRange
	);
	const setColorMode = useLayoutStore((state) => state.setColorMode);
	const setNodeSizeMode = useLayoutStore((state) => state.setNodeSizeMode);
	const clearFilters = useFilterStore((state) => state.clearFilters);
	const selectedLinkTypes = useFilterStore((state) => state.selectedLinkTypes);
	const selectedStateProvinces = useFilterStore(
		(state) => state.selectedStateProvinces
	);
	const setDeselectedNodeTypes = useFilterStore(
		(state) => state.setDeselectedNodeTypes
	);
	const toggleDeselectedNodeType = useFilterStore(
		(state) => state.toggleDeselectedNodeType
	);
	const setExpandedContinents = useFilterStore(
		(state) => state.setExpandedContinents
	);
	const countrySearchTerm = useFilterStore((state) => state.countrySearchTerm);
	const setCountrySearchTerm = useFilterStore(
		(state) => state.setCountrySearchTerm
	);

	const showLabels = useLayoutStore((state) => state.showLabels);
	const apiKey = useUIStore((state) => state.apiKey);
	const showDescriptionSummary = useUIStore(
		(state) => state.showDescriptionSummary
	);
	const showThemeAnalysis = useUIStore((state) => state.showThemeAnalysis);
	const showActiveNodes = useUIStore((state) => state.showActiveNodes);
	const rightPanelExpanded = useLayoutStore(
		(state) => state.rightPanelExpanded
	);
	const setShowLabels = useLayoutStore((state) => state.setShowLabels);
	const setShowDescriptionSummary = useUIStore(
		(state) => state.setShowDescriptionAnalysis
	);
	const setShowThemeAnalysis = useUIStore(
		(state) => state.setShowThemeAnalysis
	);
	const setShowActiveNodes = useUIStore((state) => state.setShowActiveNodes);
	const setRightPanelExpanded = useLayoutStore(
		(state) => state.setRightPanelExpanded
	);
	const setApiKey = useUIStore((state) => state.setApiKey);
	const toggleThemeCollapse = useUIStore((state) => state.toggleThemeCollapse);
	const toggleMethodology = useUIStore((state) => state.toggleMethodology);

	const [loadingSummary, setLoadingSummary] = useState(false);
	const [loadingBusiness, setLoadingBusiness] = useState(false);
	const [loadingThemes, setLoadingThemes] = useState(false);
	const [chatInput, setChatInput] = useState('');
	const [conversations, setConversations] = useState<
		Array<{
			id: string;
			prompt: string;
			response: string;
			timestamp: Date;
			feedback?: 'up' | 'down';
		}>
	>([]);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const searchHistory = useSearchStore((state) => state.searchHistory);
	const setSearchHistory = useSearchStore((state) => state.setSearchHistory);
	const isSearching = useSearchStore((state) => state.isSearching);
	const setIsSearching = useSearchStore((state) => state.setIsSearching);
	const topResults = useSearchStore((state) => state.topResults);
	const setTopResults = useSearchStore((state) => state.setTopResults);
	const hasSearched = useSearchStore((state) => state.hasSearched);
	const setHasSearched = useSearchStore((state) => state.setHasSearched);
	const searchStatus = useSearchStore((state) => state.searchStatus);
	const setSearchStatus = useSearchStore((state) => state.setSearchStatus);

	const reorganizeLayoutRef = useRef<(() => void) | null>(null);
	const arrangeAsTreeRef = useRef<(() => void) | null>(null);

	const hasApiKey = (apiKey || '').trim().length > 0;

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
	const linkTypes = [...new Set(safeLinks.map((link) => link.type))];
	const continents = [...new Set(safeNodes.map((node) => node.continent))];
	const countries = [...new Set(safeNodes.map((node) => node.country))];
	const stateProvinces = [
		...new Set(safeNodes.map((node) => node.stateProvince).filter(Boolean)),
	];
	const sourceTypes = [...new Set(safeNodes.map((node) => node.sourceType))];

	const calculateTFIDF = useCallback((documents: string[]) => {
		// Tokenize and clean documents
		const tokenizedDocs = documents.map(
			(doc) =>
				doc
					.toLowerCase()
					.replace(/[^\w\s]/g, ' ')
					.split(/\s+/)
					.filter((word) => word.length > 2) // Filter out short words
					.filter(
						(word) =>
							!['data', 'system', 'service', 'management'].includes(word)
					) // Filter common tech words
		);

		// Calculate term frequencies
		const termFreqs = tokenizedDocs.map((tokens) => {
			const tf: Record<string, number> = {};
			tokens.forEach((token) => {
				tf[token] = (tf[token] || 0) + 1;
			});
			// Normalize by document length
			const docLength = tokens.length;
			Object.keys(tf).forEach((term) => {
				tf[term] = tf[term] / docLength;
			});
			return tf;
		});

		// Calculate document frequencies and IDF
		const allTerms = new Set(tokenizedDocs.flat());
		const docFreqs: Record<string, number> = {};

		allTerms.forEach((term) => {
			docFreqs[term] = tokenizedDocs.filter((tokens) =>
				tokens.includes(term)
			).length;
		});

		const totalDocs = documents.length;
		const idf: Record<string, number> = {};
		Object.keys(docFreqs).forEach((term) => {
			idf[term] = Math.log(totalDocs / docFreqs[term]);
		});

		return { termFreqs, idf, allTerms: Array.from(allTerms) };
	}, []);

	const calculateSimilarity = useCallback(
		(query: string, text: string) => {
			if (!query || !text) return 0;

			const documents = [query, text];
			const { termFreqs, idf, allTerms } = calculateTFIDF(documents);

			// Calculate TF-IDF vectors
			const queryVector: number[] = [];
			const textVector: number[] = [];

			allTerms.forEach((term) => {
				const queryTF = termFreqs[0][term] || 0;
				const textTF = termFreqs[1][term] || 0;
				const termIDF = idf[term] || 0;

				queryVector.push(queryTF * termIDF);
				textVector.push(textTF * termIDF);
			});

			// Calculate cosine similarity
			const dotProduct = queryVector.reduce(
				(sum, val, i) => sum + val * textVector[i],
				0
			);
			const queryMagnitude = Math.sqrt(
				queryVector.reduce((sum, val) => sum + val * val, 0)
			);
			const textMagnitude = Math.sqrt(
				textVector.reduce((sum, val) => sum + val * val, 0)
			);

			if (queryMagnitude === 0 || textMagnitude === 0) return 0;

			const similarity = dotProduct / (queryMagnitude * textMagnitude);
			return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
		},
		[calculateTFIDF]
	);

	const filteredNodes = useMemo(() => {
		const filterStart = performance.now();
		console.log('[v0] Filtering nodes started, input count:', safeNodes.length);
		console.log('[v0] Filter conditions:', {
			searchTerm: searchTerm?.length || 0,
			selectedNodeTypes: selectedNodeTypes?.length || 0,
			selectedContinents: selectedContinents?.length || 0,
			selectedCountries: selectedCountries?.length || 0,
			selectedSourceTypes: selectedSourceTypes?.length || 0,
			selectedSimilarityRange: selectedSimilarityRange?.length || 0,
			minNodeSize: minNodeSize?.[0] || 0,
			useSimilaritySize,
			searchMode,
		});

		const searchLower = searchTerm?.trim()?.toLowerCase();
		const hasSearch = Boolean(searchLower);
		const hasTypeFilters = selectedNodeTypes?.length > 0;
		const hasContinentFilters = selectedContinents?.length > 0;
		const hasCountryFilters = selectedCountries?.length > 0;
		const hasSourceFilters = selectedSourceTypes?.length > 0;
		const hasSimilarityRangeFilters = selectedSimilarityRange?.length > 0;
		const hasSizeFilter = minNodeSize?.[0] > 0;
		const needsSimilarity =
			(useSimilaritySize ||
				searchMode === 'semantic' ||
				hasSimilarityRangeFilters) &&
			hasSearch;

		const isInSelectedSimilarityRange = (similarity: number) => {
			if (!hasSimilarityRangeFilters) return true;

			const similarityPercent = Math.round(similarity * 100);
			return selectedSimilarityRange.some((range) => {
				switch (range) {
					case '<20':
						return similarityPercent >= 0 && similarityPercent <= 19;
					case '21-40':
						return similarityPercent >= 21 && similarityPercent <= 40;
					case '41-60':
						return similarityPercent >= 41 && similarityPercent <= 60;
					case '61-80':
						return similarityPercent >= 61 && similarityPercent <= 80;
					case '81-100':
						return similarityPercent >= 81 && similarityPercent <= 100;
					default:
						return false;
				}
			});
		};

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

				if (hasSimilarityRangeFilters && hasSearch) {
					const similarity = calculateSimilarity(searchTerm, node.summary);
					if (!isInSelectedSimilarityRange(similarity)) return false;
				}

				// Size filter
				if (hasSizeFilter && (node.size || 10) < minNodeSize[0]) return false;

				return true;
			})
			.map((node) => {
				if (!needsSimilarity) return node;

				const similarity = calculateSimilarity(searchTerm, node.summary);
				const newSize = Math.max(
					5,
					(node.size || 10) * (0.3 + similarity * 1.4)
				);

				return {
					...node,
					size: newSize,
					similarity,
				};
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
		selectedSimilarityRange,
		minNodeSize,
		useSimilaritySize,
		searchMode,
		calculateSimilarity,
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

	const filterStore = useFilterStore();
	const uiStore = useUIStore();

	const clearSelection = () => {
		setSelectedNodes([]);
		setDeselectedNodeTypes([]);
		setShowDescriptionSummary(false);
		setShowThemeAnalysis(false);
	};

	const toggleNodeTypeDeselection = (type: string) => {
		toggleDeselectedNodeType(type);
	};

	const handleToggleThemeCollapse = (themeName: string) => {
		toggleThemeCollapse(themeName);
	};

	const handleToggleMethodology = (section: string) => {
		toggleMethodology(section);
	};

	const removeNodeFromSelection = (nodeId: string) => {
		removeSelectedNode(nodeId);
	};

	const selectedNodesSummary = useMemo(() => {
		const summaryStart = performance.now();
		console.log('[v0] Calculating selected nodes summary...');

		const allSelectedNodes = filteredNodes.filter((node) =>
			safeSelectedNodes.includes(node.id)
		);
		const nodes = allSelectedNodes.filter(
			(node) => !deselectedNodeTypes.includes(node.type)
		);

		const types = [...new Set(nodes.map((n) => n.type))];
		const avgSize =
			nodes.length > 0
				? nodes.reduce((sum, n) => sum + n.size, 0) / nodes.length
				: 0;
		const connections = filteredLinks.filter(
			(link) =>
				safeSelectedNodes.includes(link.source) ||
				safeSelectedNodes.includes(link.target)
		);
		const internalConnections = filteredLinks.filter(
			(link) =>
				safeSelectedNodes.includes(link.source) &&
				safeSelectedNodes.includes(link.target)
		);

		const textAnalysis = (() => {
			if (nodes.length === 0)
				return { commonWords: [], themes: [], summary: '' };

			// Combine all text from selected nodes
			const allText = nodes.map((n) => n.summary).join(' ');
			const words = allText
				.toLowerCase()
				.split(/\s+/)
				.filter((word) => word.length > 3) // Filter out short words
				.filter(
					(word) => !['data', 'system', 'service', 'management'].includes(word)
				); // Filter common tech words

			// Count word frequency
			const wordFreq: { [key: string]: number } = {};
			words.forEach((word) => {
				wordFreq[word] = (wordFreq[word] || 0) + 1;
			});

			// Get most common words (appearing in multiple nodes or frequently)
			const commonWords = Object.entries(wordFreq)
				.filter(
					([_, count]) => count >= Math.max(2, Math.ceil(nodes.length * 0.3))
				)
				.sort(([_, a], [__, b]) => b - a)
				.slice(0, 8)
				.map(([word, count]) => ({ word, count }));

			// Identify themes based on word clusters
			const themes = [];
			if (
				commonWords.some((w) =>
					['processing', 'computation', 'calculation', 'algorithms'].includes(
						w.word
					)
				)
			) {
				themes.push('Data Processing');
			}
			if (
				commonWords.some((w) =>
					['storage', 'database', 'persistence', 'repository'].includes(w.word)
				)
			) {
				themes.push('Data Storage');
			}
			if (
				commonWords.some((w) =>
					[
						'security',
						'authentication',
						'authorization',
						'encryption',
					].includes(w.word)
				)
			) {
				themes.push('Security');
			}
			if (
				commonWords.some((w) =>
					['monitoring', 'performance', 'metrics', 'alerting'].includes(w.word)
				)
			) {
				themes.push('Monitoring');
			}
			if (
				commonWords.some((w) =>
					['machine', 'learning', 'artificial', 'intelligence'].includes(w.word)
				)
			) {
				themes.push('AI/ML');
			}
			if (
				commonWords.some((w) =>
					['communication', 'messaging', 'queue', 'event'].includes(w.word)
				)
			) {
				themes.push('Communication');
			}

			// Generate a brief summary
			const summary =
				nodes.length === 1
					? `Single ${nodes[0].type} node focused on ${nodes[0].summary
							.split(' ')
							.slice(0, 6)
							.join(' ')}...`
					: `${nodes.length} nodes spanning ${types.length} types. ${
							themes.length > 0 ? `Primary themes: ${themes.join(', ')}.` : ''
					  } ${
							commonWords.length > 0
								? `Key concepts: ${commonWords
										.slice(0, 3)
										.map((w) => w.word)
										.join(', ')}.`
								: ''
					  }`;

			return { commonWords, themes, summary };
		})();

		const themeAnalysis = (() => {
			if (nodes.length === 0) return { themes: [] };

			const themes = [
				{
					name: 'Data Processing & Analytics',
					keywords: [
						'processing',
						'computation',
						'calculation',
						'algorithms',
						'analytics',
						'machine',
						'learning',
						'artificial',
						'intelligence',
						'neural',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'Data Storage & Management',
					keywords: [
						'storage',
						'database',
						'persistence',
						'repository',
						'warehouse',
						'backup',
						'archival',
						'distributed',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'Security & Authentication',
					keywords: [
						'security',
						'authentication',
						'authorization',
						'encryption',
						'firewall',
						'intrusion',
						'vulnerability',
						'protection',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'Performance & Monitoring',
					keywords: [
						'monitoring',
						'performance',
						'metrics',
						'alerting',
						'optimization',
						'tracking',
						'observability',
						'logging',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'Communication & Messaging',
					keywords: [
						'communication',
						'messaging',
						'queue',
						'event',
						'notification',
						'streaming',
						'pub',
						'asynchronous',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'Infrastructure & Networking',
					keywords: [
						'load',
						'balancer',
						'gateway',
						'proxy',
						'routing',
						'distribution',
						'scaling',
						'cdn',
						'edge',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'User Interface & Experience',
					keywords: [
						'interface',
						'frontend',
						'display',
						'visualization',
						'dashboard',
						'interaction',
						'responsive',
						'experience',
					],
					nodes: [],
					score: 0,
				},
				{
					name: 'Configuration & Management',
					keywords: [
						'configuration',
						'management',
						'environment',
						'variables',
						'secrets',
						'centralized',
						'orchestration',
						'control',
					],
					nodes: [],
					score: 0,
				},
			];

			themes.forEach((theme) => {
				nodes.forEach((node) => {
					const nodeWords = node.summary.toLowerCase().split(/\s+/);
					const matchCount = theme.keywords.filter((keyword) =>
						nodeWords.some(
							(word) => word.includes(keyword) || keyword.includes(word)
						)
					).length;

					if (matchCount > 0) {
						const relevanceScore = matchCount / theme.keywords.length;
						theme.nodes.push({
							...node,
							relevanceScore,
							matchedKeywords: theme.keywords.filter((keyword) =>
								nodeWords.some(
									(word) => word.includes(keyword) || keyword.includes(word)
								)
							),
						});
						theme.score += relevanceScore;
					}
				});

				theme.nodes.sort((a, b) => b.relevanceScore - a.relevanceScore);
				theme.nodes = theme.nodes.slice(0, 5);
			});

			const activeThemes = themes
				.filter((theme) => theme.nodes.length > 0)
				.sort((a, b) => b.score - a.score);

			return { themes: activeThemes };
		})();

		const summaryEnd = performance.now();
		console.log('[v0] Selected nodes summary calculated:', {
			nodeCount: nodes.length,
			themeCount: themeAnalysis.themes.length,
			duration: `${(summaryEnd - summaryStart).toFixed(2)}ms`,
		});

		return {
			nodes,
			allSelectedNodes,
			count: nodes.length,
			types,
			avgSize,
			totalConnections: connections.length,
			internalConnections: internalConnections.length,
			externalConnections: connections.length - internalConnections.length,
			textAnalysis,
			themeAnalysis,
		};
	}, [safeSelectedNodes, filteredNodes, filteredLinks, deselectedNodeTypes]);

	const handleCategoryClick = async (category: string) => {
		let prompt = '';
		switch (category) {
			case 'Summary':
				prompt =
					safeSelectedNodes.length > 0
						? 'Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships.'
						: 'Provide an overview of the entire network structure and main components.';
				break;
			case 'Business Impact':
				prompt =
					safeSelectedNodes.length > 0
						? 'Analyze the business impact and implications of the selected network nodes.'
						: 'Analyze the overall business impact represented in this network.';
				break;
			case 'Upcoming Changes':
				prompt =
					safeSelectedNodes.length > 0
						? 'Identify potential upcoming changes or trends based on the selected network nodes.'
						: 'Identify potential upcoming changes or trends visible in the network.';
				break;
		}
		setChatInput(prompt);
		await handleSendMessage(prompt);
	};

	const sampleNodes = [
		{
			id: '1',
			label: 'Node 1',
			summary: 'Summary of Node 1',
			content: 'Content of Node 1',
			type: 'Type A',
		},
		{
			id: '2',
			label: 'Node 2',
			summary: 'Summary of Node 2',
			content: 'Content of Node 2',
			type: 'Type B',
		},
	];

	const handleSendMessage = async (message?: string) => {
		const promptToSend = message || chatInput;
		if (!promptToSend.trim()) return;

		setIsAnalyzing(true);
		const newConversation = {
			id: Date.now().toString(),
			prompt: promptToSend,
			response: 'Thinking...',
			timestamp: new Date(),
		};

		setConversations((prev) => [...prev, newConversation]);

		try {
			// Prepare node data for analysis
			const nodeData =
				safeSelectedNodes.length > 0
					? safeSelectedNodes.map((node) => ({
							id: node.id,
							name: node.label,
							type: node.type,
							text: node.content || node.summary || 'No description available',
					  }))
					: sampleNodes.map((node) => ({
							id: node.id,
							name: node.label,
							type: node.type,
							text: node.content || node.summary || 'No description available',
					  }));

			// Call the real LLM API
			const response = await fetch('/api/analyze-nodes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nodes: nodeData,
					analysisType: 'summary',
					customPrompt: promptToSend,
				}),
			});

			if (response.ok) {
				const { summary } = await response.json();
				setConversations((prev) =>
					prev.map((conv) =>
						conv.id === newConversation.id
							? {
									...conv,
									response: summary,
							  }
							: conv
					)
				);
			} else {
				throw new Error(`API request failed: ${response.status}`);
			}
		} catch (error) {
			console.error('[v0] Error getting LLM response:', error);
			setConversations((prev) =>
				prev.map((conv) =>
					conv.id === newConversation.id
						? {
								...conv,
								response:
									'Sorry, I encountered an error while analyzing the network data. Please try again.',
						  }
						: conv
				)
			);
		} finally {
			setIsAnalyzing(false);
			setChatInput('');
		}
	};

	const handleFeedback = (conversationId: string, feedback: 'up' | 'down') => {
		setConversations((prev) =>
			prev.map((conv) =>
				conv.id === conversationId ? { ...conv, feedback } : conv
			)
		);
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const handleRetry = (conversationId: string) => {
		const conversation = conversations.find(
			(conv) => conv.id === conversationId
		);
		if (conversation) {
			handleSendMessage(conversation.prompt);
		}
	};

	const [selectedPill, setSelectedPill] = useState<string | null>(null);
	const [placeholder, setPlaceholder] = useState<string>(
		safeSelectedNodes.length > 0
			? 'Ask about AI regulations....'
			: 'Ask about AI regulations....'
	);
	const [isThinking, setIsThinking] = useState(false);

	const setFeedback = (conversationId: string, feedback: 'up' | 'down') => {
		setConversations((prev) =>
			prev.map((conv) =>
				conv.id === conversationId ? { ...conv, feedback } : conv
			)
		);
	};

	const handleSimilarityRangeClick = (range: string) => {
		toggleSimilarityRange(range);
	};

	const handleDeleteConversation = (conversationId: string) => {
		setConversations((prev) => prev.filter((c) => c.id !== conversationId));
	};

	const getLegendItems = (mode: string) => {
		switch (mode) {
			case 'sourceType':
				return [
					{ label: 'Government', color: '#3b82f6' },
					{ label: 'Tech Company', color: '#059669' },
					{ label: 'News Article', color: '#f59e0b' },
					{ label: 'Law Firm', color: '#dc2626' },
					{ label: 'NGO', color: '#7c3aed' },
				].map((item) => ({
					...item,
					count: filteredNodes.filter((node) => node.sourceType === item.label)
						.length,
				}));
			case 'country':
				return [
					{ label: 'USA', color: '#dc2626' },
					{ label: 'Germany', color: '#000000' },
					{ label: 'Canada', color: '#dc2626' },
					{ label: 'Japan', color: '#dc2626' },
					{ label: 'France', color: '#3b82f6' },
					{ label: 'Luxembourg', color: '#3b82f6' },
					{ label: 'Mexico', color: '#059669' },
					{ label: 'South Korea', color: '#f59e0b' },
					{ label: 'Australia', color: '#7c3aed' },
				].map((item) => ({
					...item,
					count: filteredNodes.filter((node) => node.country === item.label)
						.length,
				}));
			case 'continent':
				return [
					{ label: 'North America', color: '#dc2626' },
					{ label: 'Europe', color: '#3b82f6' },
					{ label: 'Asia', color: '#f59e0b' },
					{ label: 'Oceania', color: '#7c3aed' },
				].map((item) => ({
					...item,
					count: filteredNodes.filter((node) => node.continent === item.label)
						.length,
				}));
			case 'similarityRange':
				return [
					{ label: 'Low (0-33%)', color: '#dc2626' },
					{ label: 'Medium (34-66%)', color: '#f59e0b' },
					{ label: 'High (67-100%)', color: '#059669' },
				].map((item) => ({
					...item,
					count: filteredNodes.filter((node) => {
						if (!node.similarity) return false;
						const similarityPercent = Math.round(node.similarity * 100);
						if (item.label === 'Low (0-33%)')
							return similarityPercent >= 0 && similarityPercent <= 33;
						if (item.label === 'Medium (34-66%)')
							return similarityPercent >= 34 && similarityPercent <= 66;
						if (item.label === 'High (67-100%)')
							return similarityPercent >= 67 && similarityPercent <= 100;
						return false;
					}).length,
				}));
			case 'documentType':
				return [
					{ label: 'recital', color: '#15803d' },
					{ label: 'article', color: '#8b5cf6' },
				].map((item) => ({
					...item,
					count: filteredNodes.filter((node) => node.type === item.label)
						.length,
				}));
			default:
				return [];
		}
	};

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

	// Function to calculate similarity between two strings
	const [layoutTypeState, setLayoutType] = useState<
		'force' | 'radial' | 'tree'
	>('force');

	const removeFromHistory = (indexToRemove: number) => {
		const updatedHistory = searchHistory.filter(
			(_: string, index: number) => index !== indexToRemove
		);
		setSearchHistory(updatedHistory);
	};

	const handleExpandQuery = async () => {
		if (!hasApiKey || !searchTerm.trim()) return;

		try {
			console.log('[v0] Expanding query with AI:', searchTerm);
			const response = await fetch('/api/expand-query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: searchTerm }),
			});

			if (response.ok) {
				const { expandedQuery } = await response.json();
				setSearchTerm(expandedQuery);
				console.log('[v0] Query expanded successfully:', expandedQuery);
			} else {
				console.error(
					'[v0] Query expansion failed:',
					response.status,
					response.statusText
				);
			}
		} catch (error) {
			console.error('[v0] Error expanding query:', error);
		}
	};

	const handleSearch = async () => {
		if (!searchTerm || !searchTerm.trim()) return;

		setIsSearching(true);
		setSearchStatus('');

		// Add to search history if not already present
		if (!searchHistory.includes(searchTerm.trim())) {
			const updatedHistory = [searchTerm.trim(), ...searchHistory.slice(0, 4)];
			setSearchHistory(updatedHistory);
		}

		await new Promise((resolve) => setTimeout(resolve, 1200));

		setIsSearching(false);
		setHasSearched(true);

		const highlightedCount = filteredNodes.filter((node) => {
			const similarity = calculateSimilarity(searchTerm, node.summary);
			return similarity > 0.1; // Lower threshold for TF-IDF similarity
		}).length;

		if (highlightedCount > 0) {
			setSearchStatus(`Found ${highlightedCount} semantically similar results`);
		} else {
			setSearchStatus('No semantic matches found - try different terms');
		}
	};

	const handleClearSearch = () => {
		setSearchTerm('');
		setHasSearched(false);
		setSearchStatus('');
	};

	const handleHistoryClick = (term: string) => {
		setSearchTerm(term);
	};

	const getNodeColorByMode = (node: Node, mode: string) => {
		switch (mode) {
			case 'sourceType':
				const sourceTypeColors = {
					Government: '#3b82f6', // Blue
					'Tech Company': '#059669', // Green
					'News Article': '#f59e0b', // Orange
					'Law Firm': '#dc2626', // Red
					NGO: '#7c3aed', // Purple
				};
				return (
					sourceTypeColors[node.sourceType as keyof typeof sourceTypeColors] ||
					'#6b7280'
				);

			case 'country':
				const countryColors = {
					USA: '#dc2626', // Red
					Germany: '#000000', // Black
					Canada: '#dc2626', // Red
					Japan: '#dc2626', // Red
					France: '#3b82f6', // Blue
					Luxembourg: '#3b82f6', // Blue
					Mexico: '#059669', // Green
					'South Korea': '#f59e0b', // Yellow
					Australia: '#7c3aed', // Purple
				};
				return (
					countryColors[node.country as keyof typeof countryColors] || '#6b7280'
				);

			case 'continent':
				const continentColors = {
					'North America': '#dc2626', // Red
					Europe: '#3b82f6', // Blue
					Asia: '#f59e0b', // Yellow
					Oceania: '#7c3aed', // Purple
				};
				return (
					continentColors[node.continent as keyof typeof continentColors] ||
					'#6b7280'
				);

			case 'similarityRange':
				if (!node.similarity) return '#6b7280';
				if (node.similarity <= 33) return '#dc2626'; // Red for Low
				if (node.similarity <= 66) return '#f59e0b'; // Yellow for Medium
				return '#059669'; // Green for High

			case 'documentType':
				const documentTypeColors = {
					recital: '#15803d', // Green
					article: '#8b5cf6', // Purple
				};
				return (
					documentTypeColors[node.type as keyof typeof documentTypeColors] ||
					'#6b7280'
				);

			default:
				return node.color;
		}
	};

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
		} else if (nodeSizeMode === 'similarity') {
			const similarity = node.similarity;
			nodeSize = Math.max(8, Math.min(25, 8 + (similarity / 100) * 17));
		}
		return nodeSize;
	};

	const safeHighlightedNodes = Array.isArray(highlightedNodes)
		? highlightedNodes
		: [];
	const safeHighlightedLinks = Array.isArray(highlightedLinks)
		? highlightedLinks
		: [];

	const safeSelectedNodeTypes = Array.isArray(selectedNodeTypes)
		? selectedNodeTypes
		: [];
	const safeSelectedLinkTypes = Array.isArray(selectedLinkTypes)
		? selectedLinkTypes
		: [];
	const safeSelectedCountries = Array.isArray(selectedCountries)
		? selectedCountries
		: [];
	const safeSelectedContinents = Array.isArray(selectedContinents)
		? selectedContinents
		: [];
	const safeSelectedStateProvinces = Array.isArray(selectedStateProvinces)
		? selectedStateProvinces
		: [];
	const safeSelectedSourceTypes = Array.isArray(selectedSourceTypes)
		? selectedSourceTypes
		: [];
	const safeSelectedSimilarityRange = Array.isArray(selectedSimilarityRange)
		? selectedSimilarityRange
		: [];
	const safeDeselectedNodeTypes = Array.isArray(deselectedNodeTypes)
		? deselectedNodeTypes
		: [];

	const transformedNodes = useMemo(() => {
		return filteredNodes.map((node) => ({
			...node,
			color: getNodeColorByMode(node, colorMode),
			size: getNodeSize(node),
		}));
	}, [filteredNodes, colorMode, nodeSizeMode]);

	// const [toggleContinentExpansion, setToggleContinentExpansion] = useState<((continent: string) => void) | null>(null)

	const networkState = useNetworkStore();
	const filterState = useFilterStore();

	return (
		<div className="flex h-screen bg-background">
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

					<SearchPanel calculateSimilarity={calculateSimilarity} />

					<FilterPanel
						filteredNodes={filteredNodes}
						filteredLinks={filteredLinks}
						safeNodes={safeNodes}
						sourceTypes={sourceTypes}
						safeHighlightedNodes={safeHighlightedNodes}
						safeExpandedNodes={safeExpandedNodes}
						calculateSimilarity={calculateSimilarity}
						toggleExpandedContinent={toggleExpandedContinent}
						handleSimilarityRangeClick={handleSimilarityRangeClick}
						continentCountries={continentCountries}
						filteredContinentCountries={filteredContinentCountries}
					/>

					{/* Layout & Meta */}
					<div className="rounded-lg p-4 space-y-4 bg-white">
						<Label className="text-sidebar-foreground font-medium text-base">
							Layout & Meta
						</Label>

						{/* Layout Controls */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-sidebar-foreground" />
								<Label className="text-sm font-medium text-sidebar-foreground">
									Layout
								</Label>
							</div>
							<div className="flex gap-2">
								<Button
									onClick={() => reorganizeLayoutRef.current?.()}
									variant="outline"
									size="sm"
									className="flex-1">
									Radial
								</Button>
								<Button
									onClick={() => arrangeAsTreeRef.current?.()}
									variant="outline"
									size="sm"
									className="flex-1">
									Tree
								</Button>
							</div>
						</div>

						{/* Color by */}
						<div className="flex items-center gap-3">
							<Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">
								Color by:
							</Label>
							<select
								value={colorMode}
								onChange={(e) =>
									setColorMode(
										e.target.value as
											| 'sourceType'
											| 'continent'
											| 'similarityRange'
											| 'documentType'
									)
								}
								className="flex-1 h-8 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground">
								<option value="sourceType">Source Type</option>
								<option value="continent">Continent</option>
								<option value="similarityRange">Similarity Range</option>
								<option value="documentType">Document Type</option>
							</select>
						</div>

						{/* Size by */}
						<div className="flex items-center gap-3">
							<Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">
								Size by:
							</Label>
							<select
								value={nodeSizeMode}
								onChange={(e) =>
									setNodeSizeMode(
										e.target.value as
											| 'none'
											| 'contentLength'
											| 'summaryLength'
											| 'similarity'
									)
								}
								className="flex-1 h-8 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground">
								<option value="none">None</option>
								<option value="contentLength">Content Length</option>
								<option value="summaryLength">Summary Length</option>
								<option value="similarity">Similarity</option>
							</select>
						</div>

						{/* Display Options */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{showLabels ? (
										<Eye className="h-4 w-4" />
									) : (
										<EyeOff className="h-4 w-4" />
									)}
									<Label htmlFor="show-labels" className="text-sm">
										Show Labels
									</Label>
								</div>
								<Switch
									id="show-labels"
									checked={showLabels}
									onCheckedChange={setShowLabels}
								/>
							</div>
						</div>

						<div className="space-y-3 pt-3 border-t border-gray-200">
							<Label className="text-sidebar-foreground font-medium text-sm">
								AI Configuration
							</Label>
							<div className="space-y-2">
								<Label htmlFor="api-key" className="text-xs text-gray-600">
									OpenAI API Key
								</Label>
								<Input
									id="api-key"
									type="password"
									placeholder="sk-..."
									value={apiKey}
									onChange={(e) => setApiKey(e.target.value)}
									className="text-xs bg-sidebar-accent/10 border-sidebar-border"
								/>
								<div className="flex items-center gap-1">
									<div
										className={`w-2 h-2 rounded-full ${
											apiKey ? 'bg-green-500' : 'bg-gray-300'
										}`}
									/>
									<span className="text-xs text-gray-500">
										{apiKey ? 'Connected' : 'No API key'}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Stats */}
				</div>
			</div>

			{/* Main Graph Area */}
			<div className="flex-1 relative">
				<NetworkGraph
					nodes={transformedNodes} // Use transformed nodes instead of filteredNodes
					links={filteredLinks}
					highlightedNodes={safeHighlightedNodes}
					highlightedLinks={safeHighlightedLinks}
					showLabels={showLabels}
					onNodeSelection={handleNodeSelection}
					selectedNodes={safeSelectedNodes}
					expandedNodes={safeExpandedNodes}
					onNodeExpand={onNodeExpand}
					layoutType={layoutType}
					onReorganizeLayout={reorganizeLayoutRef}
					onArrangeAsTree={arrangeAsTreeRef}
				/>

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
							selectedNodesSummary={selectedNodesSummary}
							rightPanelExpanded={rightPanelExpanded}
							removeNodeFromSelection={removeNodeFromSelection}
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
						<div className="space-y-6">
							<div className="border-t border-sidebar-border pt-6">
								<h4 className="text-xl font-semibold text-gray-900 mb-6">
									What would you like to know?
								</h4>

								<div className="flex flex-wrap gap-3 mb-6">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSelectedPill('Summary');
											const prompt =
												safeSelectedNodes.length > 0
													? 'Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships.'
													: 'Provide an overview of the entire network structure and main components.';
											setChatInput(prompt);
											setPlaceholder(
												'What key points should I summarize from the network?'
											);
										}}
										className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
											selectedPill === 'Summary'
												? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25'
												: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
										}`}
										disabled={isThinking}>
										Summary
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSelectedPill('Business Impact');
											const prompt =
												safeSelectedNodes.length > 0
													? 'Analyze the business impact and implications of the selected network nodes.'
													: 'Analyze the overall business impact represented in this network.';
											setChatInput(prompt);
											setPlaceholder(
												'How might this network configuration affect business operations?'
											);
										}}
										className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
											selectedPill === 'Business Impact'
												? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25'
												: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
										}`}
										disabled={isThinking}>
										Business Impact
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSelectedPill('Upcoming Changes');
											const prompt =
												safeSelectedNodes.length > 0
													? 'Identify potential upcoming changes or trends based on the selected network nodes.'
													: 'Analyze the overall business impact represented in this network.';
											setChatInput(prompt);
											setPlaceholder(
												"What changes are planned and what's their impact?"
											);
										}}
										className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
											selectedPill === 'Upcoming Changes'
												? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25'
												: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
										}`}
										disabled={isThinking}>
										Upcoming Changes
									</Button>
								</div>

								<div className="relative mb-6">
									<Textarea
										value={chatInput}
										onChange={(e) => setChatInput(e.target.value)}
										placeholder={placeholder}
										className="w-full bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 pr-16 min-h-[120px] resize-none rounded-xl text-base leading-relaxed transition-all duration-200 focus:border-[#7c3aed] focus:ring-4 focus:ring-purple-500/10"
										onKeyDown={(e) => {
											if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
												handleSendMessage();
											}
											if (e.key === 'Escape' && isThinking) {
												setIsThinking(false);
											}
										}}
									/>
									<Button
										size="sm"
										className={`absolute right-3 bottom-3 h-10 w-10 p-0 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
											isThinking ? 'animate-spin' : 'hover:rotate-12'
										}`}
										onClick={() => handleSendMessage()}
										disabled={!chatInput.trim()}>
										{isThinking ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											'→'
										)}
									</Button>
								</div>

								{isThinking && (
									<div className="flex justify-start mb-4">
										<div className="bg-sidebar-accent/10 rounded-xl border border-sidebar-border shadow-sm px-4 py-3 max-w-xs">
											<div className="flex items-center gap-1">
												<span className="text-sidebar-foreground/70 text-sm italic">
													Thinking
												</span>
												<span className="text-sidebar-foreground/70 text-sm">
													<span className="inline-block animate-[dots_1.5s_ease-in-out_infinite]">
														...
													</span>
												</span>
											</div>
										</div>
									</div>
								)}

								{conversations.length > 0 && (
									<div className="space-y-6">
										{/* Updated analysis conversation buttons to use consistent purple theme */}
										{conversations
											.slice()
											.reverse()
											.map((conversation, index) => (
												<div key={conversation.id} className="space-y-4">
													<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
														<button
															onClick={() =>
																handleDeleteConversation(conversation.id)
															}
															className="absolute top-3 right-3 p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 rounded transition-colors">
															<X className="h-4 w-4" />
														</button>

														{/* Time */}
														<div className="mb-4">
															<span className="text-xs text-gray-500 font-medium">
																Time:{' '}
																{conversation.timestamp.toLocaleTimeString()}
															</span>
														</div>

														{/* Prompt Section */}
														<div className="mb-4">
															<div className="text-gray-800 leading-relaxed text-base rounded-lg p-3 bg-slate-100">
																"{conversation.prompt}"
															</div>
														</div>

														{/* Analysis Section */}
														<div className="mb-4">
															<div className="text-gray-800 leading-relaxed text-base">
																{conversation.response}
															</div>
														</div>

														{/* Action Toolbar */}
														<div className="flex items-center gap-2 pt-4 border-t border-gray-100">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	navigator.clipboard.writeText(
																		`Prompt: ${conversation.prompt}\n\nAnalysis: ${conversation.response}`
																	);
																}}
																className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">
																<svg
																	className="w-4 h-4 mr-1"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24">
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 002 2v8a2 2 0 002 2z"
																	/>
																</svg>
																{rightPanelExpanded && 'Copy'}
															</Button>

															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	const timestamp = new Date().toLocaleString();
																	const filterBreadcrumb = [
																		filterState.selectedContinents.length > 0 &&
																			`Continents: ${filterState.selectedContinents.join(
																				', '
																			)}`,
																		filterState.selectedCountries.length > 0 &&
																			`Countries: ${filterState.selectedCountries.join(
																				', '
																			)}`,
																		filterState.selectedSourceTypes.length >
																			0 &&
																			`Source Types: ${filterState.selectedSourceTypes.join(
																				', '
																			)}`,
																		filterState.searchTerm &&
																			`Search: "${filterState.searchTerm}"`,
																		`Similarity Range: ${filterState.selectedSimilarityRange[0]}% - ${filterState.selectedSimilarityRange[1]}%`,
																	]
																		.filter(Boolean)
																		.join(' | ');

																	const selectedNodeIds =
																		networkState.selectedNodes
																			.map((node) => node.id)
																			.join(', ');

																	const exportContent = [
																		`Export Date: ${timestamp}`,
																		``,
																		`Prompt: ${conversation.prompt}`,
																		``,
																		`Active Filters: ${
																			filterBreadcrumb || 'None'
																		}`,
																		``,
																		`Selected Node IDs: ${
																			selectedNodeIds || 'None'
																		}`,
																		``,
																		`Analysis:`,
																		conversation.response,
																	].join('\n');

																	const blob = new Blob([exportContent], {
																		type: 'text/plain',
																	});
																	const url = URL.createObjectURL(blob);
																	const a = document.createElement('a');
																	a.href = url;
																	a.download = `network-analysis-${Date.now()}.txt`;
																	document.body.appendChild(a);
																	a.click();
																	document.body.removeChild(a);
																	URL.revokeObjectURL(url);
																}}
																className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">
																<svg
																	className="w-4 h-4 mr-1"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24">
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																	/>
																</svg>
																{rightPanelExpanded && 'Download'}
															</Button>

															<div className="flex items-center gap-1 ml-2">
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		handleFeedback(conversation.id, 'up')
																	}
																	className={
																		conversation.feedback === 'up'
																			? 'text-green-600 bg-green-50 hover:bg-green-100'
																			: 'text-gray-600 hover:text-green-600 hover:bg-green-50'
																	}>
																	<svg
																		className="w-4 h-4"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24">
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
																		/>
																	</svg>
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		handleFeedback(conversation.id, 'down')
																	}
																	className={
																		conversation.feedback === 'down'
																			? 'text-red-600 bg-red-50 hover:bg-red-100'
																			: 'text-gray-600 hover:text-red-600 hover:bg-red-50'
																	}>
																	<svg
																		className="w-4 h-4"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24">
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M10 14H5.764a2 2 0 01-1.789-2.894l3.5-7A2 2 0 019.263 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
																		/>
																	</svg>
																</Button>
															</div>
														</div>
													</div>
												</div>
											))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

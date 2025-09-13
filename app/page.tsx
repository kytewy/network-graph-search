'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, X, ChevronDown } from 'lucide-react';
import LayoutControls from '../components/ui/LayoutControls';
import { ColorLegend } from '@/components/ui/ColorLegend';
import NetworkGraph from '@/components/network-graph';
import Analysis from '@/components/analysis';
import SearchPanel from '@/components/search/SearchPanel';
import FilterPanel from '@/components/filters/FilterPanel';
import ContextManagement from '@/components/analysis/ContextManagement';
import ChatInterface from '@/components/analysis/ChatInterface';

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

	const handleSimilarityRangeClick = (range: string) => {
		toggleSimilarityRange(range);
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

	// const safeSelectedNodeTypes = Array.isArray(selectedNodeTypes)
	// 	? selectedNodeTypes
	// 	: [];
	// const safeSelectedLinkTypes = Array.isArray(selectedLinkTypes)
	// 	? selectedLinkTypes
	// 	: [];
	// const safeSelectedCountries = Array.isArray(selectedCountries)
	// 	? selectedCountries
	// 	: [];
	// const safeSelectedContinents = Array.isArray(selectedContinents)
	// 	? selectedContinents
	// 	: [];
	// const safeSelectedStateProvinces = Array.isArray(selectedStateProvinces)
	// 	? selectedStateProvinces
	// 	: [];
	// const safeSelectedSourceTypes = Array.isArray(selectedSourceTypes)
	// 	? selectedSourceTypes
	// 	: [];
	// const safeSelectedSimilarityRange = Array.isArray(selectedSimilarityRange)
	// 	? selectedSimilarityRange
	// 	: [];
	// const safeDeselectedNodeTypes = Array.isArray(deselectedNodeTypes)
	// 	? deselectedNodeTypes
	// 	: [];

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
					<LayoutControls
						reorganizeLayoutRef={reorganizeLayoutRef}
						arrangeAsTreeRef={arrangeAsTreeRef}
						hasApiKey={hasApiKey}
					/>

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

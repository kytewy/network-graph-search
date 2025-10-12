import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CONTINENT_COUNTRY_MAP, COUNTRY_CONTINENT_MAP } from './country_map';

// Define Node and Link types
export interface Node {
	id: string;
	label: string;
	category?: string;
	score?: number;
	similarity?: number;
	text?: string;
	content?: string;
	summary?: string;
	type?: string;
	// Direct properties for easier access and consistent data structure
	country?: string;
	continent?: string;
	ai_clusters?: string; // AI cluster assignment (e.g., "cluster_0", "cluster_1")
	tags?: string[]; // User-defined tags for categorization and filtering
	// Keep fields for backward compatibility and other metadata
	fields?: any;
	data?: any;
}

export interface Link {
	id: string;
	source: string;
	target: string;
	label?: string;
	type?: string;
	weight?: number;
	data?: any;
}

// Define the app state interface
interface AppState {
	// Search state
	query: string;
	isLoading: boolean;
	error: string | null;
	topK: number;
	hasSearched: boolean; // Moved from ui-store (Phase 1)
	searchStatus: string; // Moved from ui-store (Phase 1)

	// Results state
	searchResults: Node[];
	filteredResults: Node[];
	links: Link[];
	filteredLinks: Link[];

	// Visualization state
	colorMode:
		| 'sourceType'
		| 'continent'
		| 'similarityRange'
		| 'documentType'
		| 'country';
	nodeSizeMode: 'none' | 'contentLength' | 'summaryLength' | 'similarity';
	clusterMode: 'none' | 'type' | 'continent' | 'country' | 'sourceType' | 'ai_clusters';
	showLabels: boolean;
	rightPanelExpanded: boolean;

	// Similarity histogram state
	selectedSimilarityRanges: string[];

	// Actions
	setQuery: (query: string) => void;
	setIsLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
	setTopK: (topK: number) => void;
	setHasSearched: (searched: boolean) => void; // Moved from ui-store (Phase 1)
	setSearchStatus: (status: string) => void; // Moved from ui-store (Phase 1)
	setSearchResults: (results: Node[]) => void;
	setLinks: (links: Link[]) => void;
	setColorMode: (
		mode:
			| 'sourceType'
			| 'continent'
			| 'similarityRange'
			| 'documentType'
			| 'country'
	) => void;
	setNodeSizeMode: (
		mode: 'none' | 'contentLength' | 'summaryLength' | 'similarity'
	) => void;
	setClusterMode: (
		mode: 'none' | 'type' | 'continent' | 'country' | 'sourceType' | 'ai_clusters'
	) => void;
	setShowLabels: (show: boolean) => void;
	setRightPanelExpanded: (expanded: boolean) => void;
	toggleSimilarityRange: (range: string) => void;
	clearSimilarityRanges: () => void;
	applyFilters: () => void;

	// Complex actions
	performSearch: (query: string, topK?: number) => Promise<void>;

	// Location filtering state
	selectedContinents: string[]; // e.g., ['Europe', 'Asia']
	selectedCountries: string[]; // e.g., ['USA', 'Japan'] - individual countries not covered by continent selection
	
	// Tag filtering state
	selectedTags: string[]; // e.g., ['important', 'regulations']

	// Location filtering actions
	toggleContinent: (continent: string) => void; // Smart toggle: selects continent, deselects its individual countries
	toggleCountry: (country: string) => void; // Smart toggle: selects country, deselects its continent
	clearLocationFilters: () => void; // Reset all location filters
	getEffectiveCountries: () => string[]; // Get all countries that should be included (from both continent and country selections)

	// Helper functions for counts and data access
	getNodeCountByContinent: (continent: string) => number; // Get count of nodes for a specific continent
	getNodeCountByCountry: (country: string) => number; // Get count of nodes for a specific country
	getAvailableContinents: () => string[]; // Get list of all continents in current data
	getCountriesByContinent: (continent: string) => string[]; // Get countries for a specific continent in current data
	
	// Tag filtering actions
	toggleTag: (tag: string) => void; // Toggle tag selection
	clearTagFilters: () => void; // Clear all tag filters
	getAvailableTags: () => string[]; // Get all unique tags from current results
	getNodeCountByTag: (tag: string) => number; // Get count of nodes for a specific tag
}

// Create the store with DevTools middleware
export const useAppStore = create<AppState>()(
	devtools((set, get) => ({
		// Initial state
		query: '',
		isLoading: false,
		error: null,
		topK: 10,
		hasSearched: false, // Moved from ui-store (Phase 1)
		searchStatus: '', // Moved from ui-store (Phase 1)
		searchResults: [],
		filteredResults: [],
		links: [],
		filteredLinks: [],
		colorMode: 'continent',
		nodeSizeMode: 'none',
		clusterMode: 'none',
		showLabels: true,
		rightPanelExpanded: false,
		selectedSimilarityRanges: [],

		// Location filtering state
		selectedContinents: [],
		selectedCountries: [],
		
		// Tag filtering state
		selectedTags: [],

		// Additional state for AI clustering
		aiClusters: [], // List of AI cluster assignments (e.g., ['cluster_0', 'cluster_1'])
		// Basic actions
		setQuery: (query) => set({ query }),
		setIsLoading: (isLoading) => set({ isLoading }),
		setError: (error) => set({ error }),
		setTopK: (topK) => set({ topK }),
		setHasSearched: (searched) => set({ hasSearched: searched }), // Moved from ui-store (Phase 1)
		setSearchStatus: (status) => set({ searchStatus: status }), // Moved from ui-store (Phase 1)
		setSearchResults: (searchResults) => {
			set({
				searchResults,
				filteredResults: searchResults, // Initially, filtered results are the same as search results
			});
			get().applyFilters(); // Apply any existing filters
		},
		setLinks: (links) => {
			set({ links });
			get().applyFilters(); // Apply any existing filters to links as well
		},

		// Visualization state actions
		setColorMode: (colorMode) => set({ colorMode }),
		setNodeSizeMode: (nodeSizeMode) => set({ nodeSizeMode }),
		setClusterMode: (clusterMode) => set({ clusterMode }),
		setShowLabels: (showLabels) => set({ showLabels }),
		setRightPanelExpanded: (rightPanelExpanded) => set({ rightPanelExpanded }),

		// Toggle a similarity range selection
		toggleSimilarityRange: (range) => {
			set((state) => {
				const isSelected = state.selectedSimilarityRanges.includes(range);
				const selectedSimilarityRanges = isSelected
					? state.selectedSimilarityRanges.filter((r) => r !== range)
					: [...state.selectedSimilarityRanges, range];

				return { selectedSimilarityRanges };
			});

			// Apply filters after toggling the similarity range
			get().applyFilters();
		},

		// Clear all similarity range selections
		clearSimilarityRanges: () => {
			set({ selectedSimilarityRanges: [] });
			get().applyFilters();
		},

		// Enhanced filtering that combines location and similarity filters
		applyFilters: () => {
			const {
				searchResults,
				links,
				selectedSimilarityRanges,
				getEffectiveCountries,
			} = get();

			let filtered = searchResults;

			// STEP 1: Apply location filter (continent/country)
			const effectiveCountries = getEffectiveCountries();
			if (effectiveCountries.length > 0) {
				// Use direct country property instead of fields.country
				filtered = filtered.filter((node) =>
					effectiveCountries.includes(node.country || '')
				);
			}

			// STEP 2: Apply tag filter
			const { selectedTags } = get();
			if (selectedTags.length > 0) {
				filtered = filtered.filter((node) =>
					node.tags?.some(tag => selectedTags.includes(tag))
				);
			}
			
		// STEP 3: Apply similarity range filter
			if (selectedSimilarityRanges.length > 0) {
				filtered = filtered.filter((node) => {
					const similarity = Math.round((node.score || 0) * 100);
					return selectedSimilarityRanges.some((range) => {
						switch (range) {
							case '<20':
								return similarity >= 0 && similarity <= 19;
							case '21-40':
								return similarity >= 20 && similarity <= 40;
							case '41-60':
								return similarity >= 41 && similarity <= 60;
							case '61-80':
								return similarity >= 61 && similarity <= 80;
							case '81-100':
								return similarity >= 81 && similarity <= 100;
							default:
								return false;
						}
					});
				});
			}

			// STEP 4: Filter links to only show connections between visible nodes
			const nodeIds = new Set(filtered.map((node) => node.id));
			const filteredLinks = links.filter(
				(link) => nodeIds.has(link.source) && nodeIds.has(link.target)
			);

			set({ filteredResults: filtered, filteredLinks });
		},

		// Process API response to extract nodes and links
		processApiResponse: (data: any) => {
			if (!data) return { nodes: [], links: [] };

			let nodes: Node[] = [];
			let links: Link[] = [];

			// Check if the response has a rawResponse.result.hits structure (Pinecone format)
			if (
				data.rawResponse?.result?.hits &&
				Array.isArray(data.rawResponse.result.hits)
			) {
				const hits = data.rawResponse.result.hits;

				// Extract nodes with normalized data structure
				nodes = hits.map((hit: any) => {
					// Get country and continent from fields or default to empty string
					const country = hit.fields?.country || '';
					// Look up continent from country map if not directly provided
					const continent =
						hit.fields?.continent ||
						(country ? COUNTRY_CONTINENT_MAP[country] || '' : '');

					return {
						id: hit._id,
						score: hit._score,
						label: hit.fields?.label || hit._id,
						category: hit.fields?.category || '',
						type: hit.fields?.type || '',
						text: hit.fields?.chunk_text || hit.fields?.content || '',
						summary: hit.fields?.summary || '',
						content: hit.fields?.content || '',
						sourceType: hit.fields?.sourceType || '',
						// Add normalized direct properties
						country,
						continent,
						ai_clusters: undefined, // Will be assigned by AI clustering API
						tags: hit.fields?.tags || [], // User-defined tags
						url: hit.fields?.url || '', // URL for "Open Link" button
						// Keep original fields for backward compatibility
						fields: hit.fields || {},
					};
				});

				// Extract links
				const nodeIds = new Set(nodes.map((node) => node.id));

				hits.forEach((hit: any) => {
					const connectedTo = hit.fields?.connected_to || [];
					if (Array.isArray(connectedTo)) {
						connectedTo.forEach((targetId: string) => {
							if (nodeIds.has(targetId)) {
								links.push({
									id: `${hit._id}-${targetId}`,
									source: hit._id,
									target: targetId,
									label: `${hit.fields?.label || hit._id} → ${targetId}`,
									type: 'connected',
									weight: 1,
								});
							}
						});
					}
				});
			} else if (data.results && Array.isArray(data.results)) {
				// Handle other result formats with normalization
				nodes = data.results.map((node: any) => {
					const country = node.fields?.country || node.country || '';
					const continent =
						node.fields?.continent ||
						node.continent ||
						(country ? COUNTRY_CONTINENT_MAP[country] || '' : '');

					return {
						...node,
						country,
						continent,
					};
				});
			}

			return { nodes, links };
		},

		// Perform search
		performSearch: async (query, topK = get().topK) => {
			if (!query.trim()) return;

			const state = get();
			state.setIsLoading(true);
			state.setError(null);
			state.setQuery(query);

			try {
				const response = await fetch('/api/reranked-vector-search', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query, topK }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Search failed');
				}

				const { nodes, links } = state.processApiResponse(data);

				state.setSearchResults(nodes);
				state.setLinks(links);
			} catch (err: any) {
				console.error('Search error:', err);
				state.setError(err.message || 'An error occurred during search');
			} finally {
				state.setIsLoading(false);
			}
		},

		// Location filtering actions

		clearLocationFilters: () => {
			set({ selectedContinents: [], selectedCountries: [] });
			get().applyFilters();
		},

		// Smart continent toggling
		// If selecting: adds continent, removes any individual countries from that continent
		// If deselecting: removes continent and all its countries
		toggleContinent: (continent) => {
			set((state) => {
				const isSelected = state.selectedContinents.includes(continent);
				const continentCountries =
					CONTINENT_COUNTRY_MAP[
						continent as keyof typeof CONTINENT_COUNTRY_MAP
					] || [];

				if (isSelected) {
					// Deselecting continent - remove it and any of its individual countries
					return {
						selectedContinents: state.selectedContinents.filter(
							(c) => c !== continent
						),
						selectedCountries: state.selectedCountries.filter(
							(country) => !continentCountries.includes(country)
						),
					};
				} else {
					// Selecting continent - add it and remove any individual countries from this continent
					// This prevents duplicate filtering (continent + its individual countries)
					return {
						selectedContinents: [...state.selectedContinents, continent],
						selectedCountries: state.selectedCountries.filter(
							(country) => !continentCountries.includes(country)
						),
					};
				}
			});
			get().applyFilters();
		},

		// Smart country toggling
		// If selecting a country: removes its parent continent (if selected) to avoid duplication
		// If deselecting a country: just removes the country
		toggleCountry: (country) => {
			set((state) => {
				const continent = COUNTRY_CONTINENT_MAP[country];
				const isSelected = state.selectedCountries.includes(country);

				if (isSelected) {
					// Simply remove the country
					return {
						selectedCountries: state.selectedCountries.filter(
							(c) => c !== country
						),
					};
				} else {
					// Add country and remove its continent to prevent double-inclusion
					return {
						selectedContinents: state.selectedContinents.filter(
							(c) => c !== continent
						),
						selectedCountries: [...state.selectedCountries, country],
					};
				}
			});
			get().applyFilters();
		},

		// Helper function to get all effective countries for filtering
		// Combines countries from selected continents + individually selected countries
		getEffectiveCountries: () => {
			const { selectedContinents, selectedCountries } = get();

			// Get all countries from selected continents
			const countriesFromContinents = selectedContinents.flatMap(
				(continent) =>
					CONTINENT_COUNTRY_MAP[
						continent as keyof typeof CONTINENT_COUNTRY_MAP
					] || []
			);

			// Combine and deduplicate using Set
			return [...new Set([...countriesFromContinents, ...selectedCountries])];
		},

		// Get count of nodes for a specific continent
		getNodeCountByContinent: (continent: string) => {
			const { filteredResults } = get();
			return filteredResults.filter((node) => node.continent === continent)
				.length;
		},

		// Get count of nodes for a specific country
		getNodeCountByCountry: (country: string) => {
			const { filteredResults } = get();
			return filteredResults.filter((node) => node.country === country).length;
		},

		// Get list of all continents in current data
		getAvailableContinents: () => {
			// Use searchResults instead of filteredResults to show all available continents
			// regardless of current filters
			const { searchResults } = get();
			const continents = searchResults
				.map((node) => node.continent || '')
				.filter((continent) => continent && continent.trim() !== '');
			return [...new Set(continents)] as string[];
		},

		// Get countries for a specific continent in current data
		getCountriesByContinent: (continent: string) => {
			// Use searchResults instead of filteredResults to show all available countries
			// regardless of current filters
			const { searchResults } = get();
			const countries = searchResults
				.filter((node) => node.continent === continent)
				.map((node) => node.country || '')
				.filter((country) => country && country.trim() !== '');
			return [...new Set(countries)] as string[];
		},

		// Tag filtering actions
		
		toggleTag: (tag) => {
			set((state) => {
				const isSelected = state.selectedTags.includes(tag);
				return {
					selectedTags: isSelected
						? state.selectedTags.filter((t) => t !== tag)
						: [...state.selectedTags, tag],
				};
			});
			get().applyFilters();
		},

		clearTagFilters: () => {
			set({ selectedTags: [] });
			get().applyFilters();
		},

		getAvailableTags: () => {
			const { searchResults } = get();
			const tags = new Set<string>();
			searchResults.forEach((node) => {
				node.tags?.forEach((tag) => tags.add(tag));
			});
			return Array.from(tags).sort();
		},

		getNodeCountByTag: (tag: string) => {
			const { filteredResults } = get();
			return filteredResults.filter((node) => node.tags?.includes(tag)).length;
		},
	}))
);

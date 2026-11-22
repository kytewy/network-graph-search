import { debugLog } from '@/lib/utils/debug';
import { isCancelledError } from '@tanstack/react-query';
import { cancelSearch, searchOnce } from '@/lib/api/search-client';
import { isAbortError } from '@/lib/utils/latest-request';
import { PUBLISHERS } from '@/lib/config/document-taxonomy';
import { filterNodes } from '@/lib/filters/filter-nodes';
import { create } from 'zustand';
import type { Node, Link } from '@/lib/config/types';
import type { ClusterMode, ColorMode, NodeSizeMode } from '@/lib/config/view-modes';

// Re-export so existing imports from this store keep working.
// The single source of truth for these types is lib/config/types.ts.
export type { Node, Link };
import { devtools } from 'zustand/middleware';
import { CONTINENT_COUNTRY_MAP, COUNTRY_CONTINENT_MAP } from './country_map';
import { reportError } from '@/lib/observability/capture-client';

// A new search cancels the one still running
// The search currently on screen (or on its way), so older replies are ignored
let latestSearch: { query: string; topK: number } | null = null;

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
	colorMode: ColorMode;
	nodeSizeMode: NodeSizeMode;
	clusterMode: ClusterMode;
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
	setColorMode: (mode: ColorMode) => void;
	setNodeSizeMode: (mode: NodeSizeMode) => void;
	setClusterMode: (mode: ClusterMode) => void;
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
	selectedPublishers: string[]; // e.g., ['Law firm', 'Government']

	// Location filtering actions
	toggleContinent: (continent: string) => void; // Smart toggle: selects continent, deselects its individual countries
	toggleCountry: (country: string) => void; // Smart toggle: selects country, deselects its continent
	clearLocationFilters: () => void; // Reset all location filters

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
	togglePublisher: (publisher: string) => void; // Re-runs the search in Pinecone
	clearPublisherFilters: () => void;
	getAvailablePublishers: () => string[]; // Publishers in the results, taxonomy order
	getNodeCountByPublisher: (publisher: string) => number;
}

// Create the store with DevTools middleware
export const useAppStore = create<AppState>()(
	devtools((set, get) => ({
		// Initial state
		query: '',
		isLoading: false,
		error: null,
		topK: 50,
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
		selectedPublishers: [],

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
				debugLog('🔍 [toggleSimilarityRange] Called with:', {
					range,
					selectedSimilarityRanges: state.selectedSimilarityRanges,
					isArray: Array.isArray(state.selectedSimilarityRanges)
				});
				const safeRanges = Array.isArray(state.selectedSimilarityRanges) ? state.selectedSimilarityRanges : [];
				const isSelected = safeRanges.includes(range);
				const selectedSimilarityRanges = isSelected
					? safeRanges.filter((r) => r !== range)
					: [...safeRanges, range];

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
			set((state) => {
				// Panel filters only narrow the loaded results; they never search again
				const filtered = filterNodes(state.searchResults ?? [], {
					continents: state.selectedContinents ?? [],
					countries: state.selectedCountries ?? [],
					tags: state.selectedTags ?? [],
					publishers: state.selectedPublishers ?? [],
					similarityRanges: state.selectedSimilarityRanges ?? [],
				});

				// Only show links between visible nodes
				const nodeIds = new Set(filtered.map((node) => node.id));
				const safeLinks = Array.isArray(state.links) ? state.links : [];
				const filteredLinks = safeLinks.filter(
					(link: any) => nodeIds.has(link.source) && nodeIds.has(link.target)
				);

				return { filteredResults: filtered, filteredLinks };
			});
		},

		// Perform search
		performSearch: async (query, topK = get().topK) => {
			if (!query.trim()) return;

			const state = get();
			state.setIsLoading(true);
			state.setError(null);
			state.setQuery(query);

			// A newer search replaces this one: stop the old one and ignore its reply
			if (latestSearch && (latestSearch.query !== query || latestSearch.topK !== topK)) {
				cancelSearch(latestSearch.query, latestSearch.topK);
			}
			const thisSearch = { query, topK };
			latestSearch = thisSearch;

			try {
				// Answered from memory when the same search ran in the last few minutes
				const reply = await searchOnce(query, topK);
				if (latestSearch !== thisSearch) return;

				// The route has already turned Pinecone's results into documents
				state.setSearchResults(reply.nodes as Node[]);
				state.setLinks(reply.edges as Link[]);
				state.setHasSearched(true);
			} catch (err: any) {
				if (latestSearch !== thisSearch || isCancelledError(err) || isAbortError(err)) return;
				// Reported without the query text: what people search stays private
				reportError('search', err);
				state.setError(err.message || 'An error occurred during search');
			} finally {
				// The newer search owns the spinner
				if (latestSearch === thisSearch) state.setIsLoading(false);
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
				const safeContinents = Array.isArray(state.selectedContinents) ? state.selectedContinents : [];
				const isSelected = safeContinents.includes(continent);
				const continentCountries =
					CONTINENT_COUNTRY_MAP[
						continent as keyof typeof CONTINENT_COUNTRY_MAP
					] || [];

				if (isSelected) {
					// Deselecting continent - remove it and any of its individual countries
					const safeCountries = Array.isArray(state.selectedCountries) ? state.selectedCountries : [];
					return {
						selectedContinents: safeContinents.filter(
							(c) => c !== continent
						),
						selectedCountries: safeCountries.filter(
							(country) => !continentCountries.includes(country)
						),
					};
				} else {
					// Selecting continent - add it and remove any individual countries from this continent
					// This prevents duplicate filtering (continent + its individual countries)
					const safeCountries = Array.isArray(state.selectedCountries) ? state.selectedCountries : [];
					return {
						selectedContinents: [...safeContinents, continent],
						selectedCountries: safeCountries.filter(
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
				const safeCountries = Array.isArray(state.selectedCountries) ? state.selectedCountries : [];
				const isSelected = safeCountries.includes(country);

				if (isSelected) {
					// Simply remove the country
					return {
						selectedCountries: safeCountries.filter(
							(c) => c !== country
						),
					};
				} else {
					// Add country and remove its continent to prevent double-inclusion
					const safeContinents = Array.isArray(state.selectedContinents) ? state.selectedContinents : [];
					return {
						selectedContinents: safeContinents.filter(
							(c) => c !== continent
						),
						selectedCountries: [...safeCountries, country],
					};
				}
			});
			get().applyFilters();
		},

		// Get count of nodes for a specific continent
		getNodeCountByContinent: (continent: string) => {
			const { searchResults } = get();
			return searchResults.filter((node) => node.continent === continent)
				.length;
		},

		// Get count of nodes for a specific country
		getNodeCountByCountry: (country: string) => {
			const { searchResults } = get();
			return searchResults.filter((node) => node.country === country).length;
		},

		// Get list of all continents in current data
		getAvailableContinents: () => {
			const { searchResults } = get();
			const continents = searchResults
				.map((node) => node.continent || '')
				.filter((continent) => continent && continent.trim() !== '');
			return [...new Set(continents)] as string[];
		},

		// Get countries for a specific continent in current data
		getCountriesByContinent: (continent: string) => {
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
				const safeTags = Array.isArray(state.selectedTags) ? state.selectedTags : [];
				const isSelected = safeTags.includes(tag);
				return {
					selectedTags: isSelected
						? safeTags.filter((t) => t !== tag)
						: [...safeTags, tag],
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
			const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
			const tags = new Set<string>();
			safeSearchResults.forEach((node) => {
				if (Array.isArray(node.tags)) {
					node.tags.forEach((tag) => tags.add(tag));
				}
			});
			return Array.from(tags).sort();
		},

		getNodeCountByTag: (tag: string) => {
			const { searchResults } = get();
			const safeFilteredResults = Array.isArray(searchResults) ? searchResults : [];
			return safeFilteredResults.filter((node) => 
				Array.isArray(node.tags) && node.tags.includes(tag)
			).length;
		},

		// Publisher filter: like location and tags, it changes which documents
		// match, so it re-runs the search in Pinecone
		togglePublisher: (publisher) => {
			set((state) => ({
				selectedPublishers: state.selectedPublishers.includes(publisher)
					? state.selectedPublishers.filter((p) => p !== publisher)
					: [...state.selectedPublishers, publisher],
			}));
			get().applyFilters();
		},

		clearPublisherFilters: () => {
			set({ selectedPublishers: [] });
			get().applyFilters();
		},

		getAvailablePublishers: () => {
			const present = new Set(get().searchResults.map((node) => node.publisher));
			return PUBLISHERS.map((p) => p.value).filter((value) => present.has(value));
		},

		getNodeCountByPublisher: (publisher) =>
			get().searchResults.filter((node) => node.publisher === publisher).length,
	}))
);

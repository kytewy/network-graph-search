import { create } from 'zustand';
import { useNetworkStore } from './network-store';

// Node and Link interfaces based on the network store
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
  color?: string;
  similarity?: number;
  stateProvince?: string;
}

interface Link {
  source: string;
  target: string;
  type: string;
  id?: string;
  weight?: number;
}

interface UnifiedSearchState {
  // Search parameters
  searchTerm: string;
  searchMode: 'fulltext' | 'semantic';
  searchHistory: string[];
  
  // Search status
  isSearching: boolean;
  searchStatus: string;
  hasSearched: boolean;
  
  // Results
  topResults: number;
  selectedSimilarityRange: string[];
  useSimilaritySize: boolean;
  showEmptyState: boolean;
  searchResultNodes: Node[];
  searchResultLinks: Link[];
  
  // Actions
  setSearchTerm: (term: string) => void;
  setSearchMode: (mode: 'fulltext' | 'semantic') => void;
  setIsSearching: (searching: boolean) => void;
  setSearchStatus: (status: string) => void;
  setHasSearched: (searched: boolean) => void;
  setTopResults: (results: number) => void;
  toggleSimilarityRange: (range: string) => void;
  setUseSimilaritySize: (use: boolean) => void;
  addToSearchHistory: (term: string) => void;
  clearSearch: () => void;
  
  // Network store interactions
  setShowEmptyState: (show: boolean) => void;
  setSearchResultNodes: (nodes: Node[]) => void;
  setSearchResultLinks: (links: Link[]) => void;
  updateNetworkWithSearchResults: () => void;
  applyEmptyState: () => void;
}

export const useUnifiedSearchStore = create<UnifiedSearchState>((set, get) => ({
  // Initial state - mirror existing stores
  searchTerm: '',
  searchMode: 'fulltext',
  searchHistory: [],
  isSearching: false,
  searchStatus: '',
  hasSearched: false,
  topResults: 5,
  selectedSimilarityRange: [],
  useSimilaritySize: false,
  showEmptyState: true,
  searchResultNodes: [],
  searchResultLinks: [],
  
  // Actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSearchMode: (mode) => set({ searchMode: mode }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setSearchStatus: (status) => set({ searchStatus: status }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
  setTopResults: (results) => set({ topResults: results }),
  toggleSimilarityRange: (range) => set((state) => {
    const newRanges = state.selectedSimilarityRange.includes(range)
      ? state.selectedSimilarityRange.filter((r) => r !== range)
      : [...state.selectedSimilarityRange, range];
    
    // Update state first
    const newState = { selectedSimilarityRange: newRanges };
    
    // Then schedule an update to the network
    setTimeout(() => get().updateNetworkWithSearchResults(), 0);
    
    return newState;
  }),
  setUseSimilaritySize: (use) => set({ useSimilaritySize: use }),
  addToSearchHistory: (term) => {
    const { searchHistory } = get();
    if (!searchHistory.includes(term.trim())) {
      set({ searchHistory: [term.trim(), ...searchHistory.slice(0, 4)] });
    }
  },
  clearSearch: () => {
    set({ 
      searchTerm: '', 
      hasSearched: false, 
      searchStatus: '',
      selectedSimilarityRange: [],
      searchResultNodes: [],
      searchResultLinks: []
    });
    
    // Apply empty state to network store
    get().applyEmptyState();
  },
  
  // Network store interactions
  setShowEmptyState: (show) => {
    set({ showEmptyState: show });
    if (show) {
      get().applyEmptyState();
    } else if (get().searchResultNodes.length > 0) {
      get().updateNetworkWithSearchResults();
    }
  },
  
  setSearchResultNodes: (nodes) => {
    set({ searchResultNodes: nodes });
    get().updateNetworkWithSearchResults();
  },
  
  setSearchResultLinks: (links) => {
    set({ searchResultLinks: links });
    get().updateNetworkWithSearchResults();
  },
  
  updateNetworkWithSearchResults: () => {
    const { searchResultNodes, searchResultLinks, selectedSimilarityRange, showEmptyState } = get();
    
    // If empty state is active, don't update network with results
    if (showEmptyState) {
      get().applyEmptyState();
      return;
    }
    
    // Make sure we have nodes to display
    if (!searchResultNodes || searchResultNodes.length === 0) {
      console.log('[UnifiedSearchStore] No search result nodes to display');
      return;
    }
    
    // Apply any filters (like similarity range)
    const filteredNodes = selectedSimilarityRange.length > 0
      ? searchResultNodes.filter(node => {
          const similarity = Math.round((node.similarity || 0) * 100);
          // Check if node's similarity falls within any of the selected ranges
          return selectedSimilarityRange.some(range => {
            switch (range) {
              case '<20': return similarity >= 0 && similarity <= 19;
              case '21-40': return similarity >= 21 && similarity <= 40;
              case '41-60': return similarity >= 41 && similarity <= 60;
              case '61-80': return similarity >= 61 && similarity <= 80;
              case '81-100': return similarity >= 81 && similarity <= 100;
              default: return false;
            }
          });
        })
      : searchResultNodes;
    
    // Filter links to only include connections between filtered nodes
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = searchResultLinks && searchResultLinks.length > 0
      ? searchResultLinks.filter(
          link => nodeIds.has(link.source) && nodeIds.has(link.target)
        )
      : [];
    
    // Update the network store
    const networkStore = useNetworkStore.getState();
    
    // Ensure we're passing valid arrays
    if (Array.isArray(filteredNodes) && filteredNodes.length > 0) {
      networkStore.setNodes(filteredNodes);
      
      // Set links if available
      if (Array.isArray(filteredLinks)) {
        networkStore.setLinks(filteredLinks);
      } else {
        networkStore.setLinks([]);
      }
      
      // Highlight nodes with high similarity
      const highSimilarityNodes = filteredNodes
        .filter(node => (node.similarity || 0) > 0.7)
        .map(node => node.id);
      
      networkStore.setHighlightedNodes(highSimilarityNodes);
      
      console.log(`[UnifiedSearchStore] Updated network with ${filteredNodes.length} nodes and ${filteredLinks.length} links`);
    } else {
      console.error('[UnifiedSearchStore] Invalid nodes array:', filteredNodes);
    }
  },
  
  applyEmptyState: () => {
    // Set empty arrays in the network store
    const networkStore = useNetworkStore.getState();
    networkStore.setNodes([]);
    networkStore.setLinks([]);
    networkStore.setHighlightedNodes([]);
    networkStore.setHighlightedLinks([]);
    
    console.log('[UnifiedSearchStore] Applied empty state to network');
  }
}));

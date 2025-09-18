import { create } from 'zustand';

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
  
  // Results state
  searchResults: Node[];
  filteredResults: Node[];
  links: Link[];
  filteredLinks: Link[];
  
  // Visualization state
  colorMode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country';
  nodeSizeMode: 'none' | 'contentLength' | 'summaryLength' | 'similarity';
  showLabels: boolean;
  rightPanelExpanded: boolean;
  
  // Similarity histogram state
  selectedSimilarityRanges: string[];
  
  // Actions
  setQuery: (query: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTopK: (topK: number) => void;
  setSearchResults: (results: Node[]) => void;
  setLinks: (links: Link[]) => void;
  setColorMode: (mode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country') => void;
  setNodeSizeMode: (mode: 'none' | 'contentLength' | 'summaryLength' | 'similarity') => void;
  setShowLabels: (show: boolean) => void;
  setRightPanelExpanded: (expanded: boolean) => void;
  toggleSimilarityRange: (range: string) => void;
  clearSimilarityRanges: () => void;
  applyFilters: () => void;
  
  // Complex actions
  performSearch: (query: string, topK?: number) => Promise<void>;
}

// Create the store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  query: '',
  isLoading: false,
  error: null,
  topK: 10,
  searchResults: [],
  filteredResults: [],
  links: [],
  filteredLinks: [],
  colorMode: 'sourceType',
  nodeSizeMode: 'none',
  showLabels: true,
  rightPanelExpanded: false,
  selectedSimilarityRanges: [],
  
  // Basic actions
  setQuery: (query) => set({ query }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTopK: (topK) => set({ topK }),
  setSearchResults: (searchResults) => {
    set({ 
      searchResults,
      filteredResults: searchResults // Initially, filtered results are the same as search results
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
  
  // Apply filters based on selected similarity ranges
  applyFilters: () => {
    const { searchResults, links, selectedSimilarityRanges } = get();
    
    // If no ranges are selected, show all results
    if (selectedSimilarityRanges.length === 0) {
      set({ 
        filteredResults: searchResults,
        filteredLinks: links
      });
      return;
    }
    
    // Filter nodes based on selected similarity ranges
    const filtered = searchResults.filter((node) => {
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
    
    // Filter links to only include connections between filtered nodes
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
      
      // Extract nodes
      nodes = hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        label: hit.fields?.label || hit._id,
        category: hit.fields?.category || '',
        type: hit.fields?.type || '',
        text: hit.fields?.chunk_text || hit.fields?.content || '',
        summary: hit.fields?.summary || '',
        content: hit.fields?.content || '',
        fields: hit.fields || {},
      }));
      
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
      nodes = data.results;
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
}));

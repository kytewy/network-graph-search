/**
 * Core Search Functionality Tests
 * 
 * Tests the three main search features:
 * 1. Perform search with query
 * 2. Change K value (topK parameter)
 * 3. Filter by continent
 */

import { useAppStore } from '@/lib/stores/app-state';
import { Node } from '@/lib/config/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('Search Functionality', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      query: '',
      isLoading: false,
      error: null,
      topK: 20,
      hasSearched: false,
      searchStatus: '',
      searchResults: [],
      filteredResults: [],
      links: [],
      filteredLinks: [],
      selectedContinents: [],
      selectedCountries: [],
      selectedTags: [],
      selectedSimilarityRanges: [],
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Test 1: Perform Search', () => {
    it('should perform a search and update results', async () => {
      // Mock API response
      const mockResponse = {
        rawResponse: {
          result: {
            hits: [
              {
                _id: 'doc1',
                _score: 0.95,
                fields: {
                  label: 'AI Regulation Document',
                  content: 'This is about AI regulation',
                  country: 'USA',
                  continent: 'North America',
                  tags: ['ai', 'regulation'],
                },
              },
              {
                _id: 'doc2',
                _score: 0.87,
                fields: {
                  label: 'Privacy Policy',
                  content: 'This is about privacy',
                  country: 'Canada',
                  continent: 'North America',
                  tags: ['privacy'],
                },
              },
            ],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = useAppStore.getState();
      
      // Perform search
      await store.performSearch('AI regulation', 20);

      // Verify state updates
      const state = useAppStore.getState();
      expect(state.query).toBe('AI regulation');
      expect(state.hasSearched).toBe(true);
      expect(state.searchResults).toHaveLength(2);
      expect(state.searchResults[0].label).toBe('AI Regulation Document');
      expect(state.searchResults[1].label).toBe('Privacy Policy');
      expect(state.isLoading).toBe(false);
    });

    it('should handle search errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const store = useAppStore.getState();
      
      await store.performSearch('test query', 20);

      const state = useAppStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should not search with empty query', async () => {
      const store = useAppStore.getState();
      
      await store.performSearch('', 20);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Test 2: Change K Value', () => {
    it('should update topK value', () => {
      const store = useAppStore.getState();
      
      // Initial value
      expect(store.topK).toBe(20);
      
      // Change to 50
      store.setTopK(50);
      expect(useAppStore.getState().topK).toBe(50);
      
      // Change to 10
      store.setTopK(10);
      expect(useAppStore.getState().topK).toBe(10);
    });

    it('should use updated topK in search', async () => {
      const mockResponse = {
        rawResponse: {
          result: {
            hits: [],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = useAppStore.getState();
      
      // Set topK to 50
      store.setTopK(50);
      
      // Perform search
      await store.performSearch('test', 50);

      // Verify fetch was called with correct topK
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reranked-vector-search',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"topK":50'),
        })
      );
    });
  });

  describe('Test 3: Filter by Continent', () => {
    beforeEach(() => {
      // Set up mock search results with different continents
      const mockResults: Node[] = [
        {
          id: 'doc1',
          score: 0.95,
          label: 'European Document',
          country: 'France',
          continent: 'Europe',
          category: '',
          type: '',
          text: '',
          summary: '',
          content: '',
          sourceType: '',
          tags: [],
          url: '',
          fields: {},
        },
        {
          id: 'doc2',
          score: 0.87,
          label: 'Asian Document',
          country: 'Japan',
          continent: 'Asia',
          category: '',
          type: '',
          text: '',
          summary: '',
          content: '',
          sourceType: '',
          tags: [],
          url: '',
          fields: {},
        },
        {
          id: 'doc3',
          score: 0.82,
          label: 'North American Document',
          country: 'USA',
          continent: 'North America',
          category: '',
          type: '',
          text: '',
          summary: '',
          content: '',
          sourceType: '',
          tags: [],
          url: '',
          fields: {},
        },
      ];

      useAppStore.setState({
        searchResults: mockResults,
        filteredResults: mockResults,
        hasSearched: true,
      });
    });

    it('should filter results by single continent', () => {
      const store = useAppStore.getState();
      
      // Select Europe
      store.toggleContinent('Europe');
      
      const state = useAppStore.getState();
      expect(state.selectedContinents).toContain('Europe');
      expect(state.filteredResults).toHaveLength(1);
      expect(state.filteredResults[0].continent).toBe('Europe');
    });

    it('should filter results by multiple continents', () => {
      const store = useAppStore.getState();
      
      // Select Europe and Asia
      store.toggleContinent('Europe');
      store.toggleContinent('Asia');
      
      const state = useAppStore.getState();
      expect(state.selectedContinents).toHaveLength(2);
      expect(state.filteredResults).toHaveLength(2);
      
      const continents = state.filteredResults.map(r => r.continent);
      expect(continents).toContain('Europe');
      expect(continents).toContain('Asia');
      expect(continents).not.toContain('North America');
    });

    it('should toggle continent selection on/off', () => {
      const store = useAppStore.getState();
      
      // Select Europe
      store.toggleContinent('Europe');
      expect(useAppStore.getState().selectedContinents).toContain('Europe');
      expect(useAppStore.getState().filteredResults).toHaveLength(1);
      
      // Deselect Europe
      store.toggleContinent('Europe');
      expect(useAppStore.getState().selectedContinents).not.toContain('Europe');
      expect(useAppStore.getState().filteredResults).toHaveLength(3); // All results
    });

    it('should clear all location filters', () => {
      const store = useAppStore.getState();
      
      // Select multiple continents
      store.toggleContinent('Europe');
      store.toggleContinent('Asia');
      expect(useAppStore.getState().selectedContinents).toHaveLength(2);
      
      // Clear filters
      store.clearLocationFilters();
      expect(useAppStore.getState().selectedContinents).toHaveLength(0);
      expect(useAppStore.getState().filteredResults).toHaveLength(3); // All results
    });
  });

  describe('Integration: Search + K Value + Continent Filter', () => {
    it('should work together: search, change K, then filter by continent', async () => {
      // Mock API response with diverse results
      const mockResponse = {
        rawResponse: {
          result: {
            hits: [
              {
                _id: 'doc1',
                _score: 0.95,
                fields: {
                  label: 'European AI Act',
                  content: 'EU AI regulation',
                  country: 'Belgium',
                  continent: 'Europe',
                  tags: ['ai', 'regulation'],
                },
              },
              {
                _id: 'doc2',
                _score: 0.87,
                fields: {
                  label: 'US Privacy Law',
                  content: 'US privacy regulation',
                  country: 'USA',
                  continent: 'North America',
                  tags: ['privacy'],
                },
              },
              {
                _id: 'doc3',
                _score: 0.82,
                fields: {
                  label: 'Asian Data Protection',
                  content: 'Asian data laws',
                  country: 'Singapore',
                  continent: 'Asia',
                  tags: ['data'],
                },
              },
            ],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = useAppStore.getState();
      
      // Step 1: Change K value
      store.setTopK(30);
      expect(useAppStore.getState().topK).toBe(30);
      
      // Step 2: Perform search
      await store.performSearch('AI regulation', 30);
      let state = useAppStore.getState();
      expect(state.searchResults).toHaveLength(3);
      expect(state.filteredResults).toHaveLength(3);
      
      // Step 3: Filter by continent
      store.toggleContinent('Europe');
      state = useAppStore.getState();
      expect(state.filteredResults).toHaveLength(1);
      expect(state.filteredResults[0].label).toBe('European AI Act');
      
      // Step 4: Add another continent
      store.toggleContinent('Asia');
      state = useAppStore.getState();
      expect(state.filteredResults).toHaveLength(2);
      
      const labels = state.filteredResults.map(r => r.label);
      expect(labels).toContain('European AI Act');
      expect(labels).toContain('Asian Data Protection');
      expect(labels).not.toContain('US Privacy Law');
    });
  });
});

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
      facetResults: [],
      facetQuery: '',
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

    it('shows the error message the search route returns', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Query must be under 500 characters' }),
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await useAppStore.getState().performSearch('test query', 20);

      expect(useAppStore.getState().error).toBe('Query must be under 500 characters');
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

  describe('Test 3: Filters run in Pinecone, not the browser', () => {
    const hit = (id: string, continent: string, score: number) => ({
      _id: id,
      _score: score,
      fields: { label: id, content: id, continent, country: '', tags: [] },
    });
    const respond = (...hits: ReturnType<typeof hit>[]) =>
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rawResponse: { result: { hits } } }),
      });
    const lastFilters = () => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      return JSON.parse(calls[calls.length - 1][1].body).filters;
    };
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(async () => {
      respond(hit('eu', 'Europe', 0.9), hit('asia', 'Asia', 0.5), hit('us', 'North America', 0.3));
      await useAppStore.getState().performSearch('AI regulation');
    });

    it('re-runs the search with the continent sent to Pinecone', async () => {
      respond(hit('eu', 'Europe', 0.9));
      useAppStore.getState().toggleContinent('Europe');
      await flush();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(lastFilters().continents).toEqual(['Europe']);
      expect(useAppStore.getState().filteredResults.map((n) => n.id)).toEqual(['eu']);
    });

    it('does not drop results in the browser for location', async () => {
      // Pinecone matched on continent; the browser must not second-guess it
      respond(hit('eu', 'Europe', 0.9), hit('eu2', 'Europe', 0.8));
      useAppStore.getState().toggleContinent('Europe');
      await flush();

      expect(useAppStore.getState().filteredResults).toHaveLength(2);
    });

    it('brings documents back when a filter is removed', async () => {
      respond(hit('eu', 'Europe', 0.9));
      useAppStore.getState().toggleContinent('Europe');
      await flush();

      respond(hit('eu', 'Europe', 0.9), hit('asia', 'Asia', 0.5), hit('us', 'North America', 0.3));
      useAppStore.getState().clearLocationFilters();
      await flush();

      expect(lastFilters().continents).toEqual([]);
      expect(useAppStore.getState().filteredResults).toHaveLength(3);
    });

    it('re-runs the search when a tag filter changes', async () => {
      respond(hit('eu', 'Europe', 0.9));
      useAppStore.getState().toggleTag('privacy');
      await flush();

      expect(lastFilters().tags).toEqual(['privacy']);
    });

    it('does not search when nothing has been searched yet', () => {
      useAppStore.setState({ hasSearched: false, query: '' });
      (global.fetch as jest.Mock).mockClear();
      useAppStore.getState().toggleContinent('Europe');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(useAppStore.getState().selectedContinents).toEqual(['Europe']);
    });

    it('keeps listing other continents after filtering, so more can be added', async () => {
      respond(hit('eu', 'Europe', 0.9));
      useAppStore.getState().toggleContinent('Europe');
      await flush();

      expect(useAppStore.getState().getAvailableContinents()).toEqual(['Europe', 'Asia', 'North America']);
    });

    it('lists options from the new results when the query changes', async () => {
      useAppStore.setState({ selectedContinents: ['Europe'] });
      respond(hit('eu', 'Europe', 0.9));
      await useAppStore.getState().performSearch('watermarking');

      expect(useAppStore.getState().getAvailableContinents()).toEqual(['Europe']);
    });

    it('filters similarity in the browser only, without a new search', () => {
      useAppStore.getState().toggleSimilarityRange('81-100');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(lastFilters().similarityRanges).toBeUndefined();
      expect(useAppStore.getState().filteredResults.map((n) => n.id)).toEqual(['eu']);
      expect(useAppStore.getState().searchResults).toHaveLength(3);
    });
  });
});

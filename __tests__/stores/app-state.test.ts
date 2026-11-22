import type { Mock } from 'vitest';
import { queryClient } from '@/lib/api/query-client';
import { toApiEdges, toApiNode, type PineconeHit } from '@/lib/contracts/node';
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
// What the search route sends: Pinecone's results already turned into documents
const fromRaw = (raw: { result: { hits: PineconeHit[] } }) => ({
  nodes: raw.result.hits.map(toApiNode),
  edges: toApiEdges(raw.result.hits),
});

global.fetch = vi.fn();

// Searches are remembered for a few minutes; each test starts with none
beforeEach(() => queryClient.clear());

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
      selectedPublishers: [],
      links: [],
      filteredLinks: [],
      selectedContinents: [],
      selectedCountries: [],
      selectedTags: [],
      selectedSimilarityRanges: [],
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Test 1: Perform Search', () => {
    it('should perform a search and update results', async () => {
      // Mock API response
      const mockResponse = {
        ...fromRaw({
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
        }),
      };

      (global.fetch as Mock).mockResolvedValueOnce({
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
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const store = useAppStore.getState();
      
      await store.performSearch('test query', 20);

      const state = useAppStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('shows the error message the search route returns', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Query must be under 500 characters' }),
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await useAppStore.getState().performSearch('test query', 20);

      expect(useAppStore.getState().error).toBe('Query must be under 500 characters');
    });

    it('shows a clear error when the reply is not the shape the rulebook describes', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: true }),
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await useAppStore.getState().performSearch('test query', 20);

      const state = useAppStore.getState();
      expect(state.error).toBe('Search returned an unexpected reply. Please try again.');
      expect(state.isLoading).toBe(false);
    });

    it('ignores an older search that finishes after a newer one', async () => {
      const reply = (label: string) => ({
        ok: true,
        json: async () => ({
          ...fromRaw({ result: { hits: [{ _id: label, _score: 0.9, fields: { label } }] } }),
        }),
      });
      let finishFirst: (value: unknown) => void = () => {};
      (global.fetch as Mock)
        .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }))
        .mockResolvedValueOnce(reply('asia'));

      const store = useAppStore.getState();
      const first = store.performSearch('europe');
      await store.performSearch('asia');
      finishFirst(reply('europe'));
      await first;

      const state = useAppStore.getState();
      expect(state.searchResults.map((n) => n.id)).toEqual(['asia']);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      const [firstCall, secondCall] = (global.fetch as Mock).mock.calls;
      expect(firstCall[1].signal.aborted).toBe(true);
      expect(secondCall[1].signal.aborted).toBe(false);
    });

    it('keeps the spinner on while the newer search is still running', async () => {
      let finishSecond: (value: unknown) => void = () => {};
      (global.fetch as Mock)
        .mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        }))
        .mockImplementationOnce(() => new Promise((resolve) => { finishSecond = resolve; }));

      const store = useAppStore.getState();
      const first = store.performSearch('europe');
      const second = store.performSearch('asia');
      await first;

      expect(useAppStore.getState().isLoading).toBe(true);
      expect(useAppStore.getState().error).toBeNull();
      finishSecond({ ok: true, json: async () => ({ ...fromRaw({ result: { hits: [] } }) }) });
      await second;
      expect(useAppStore.getState().isLoading).toBe(false);
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
        ...fromRaw({
          result: {
            hits: [],
          },
        }),
      };

      (global.fetch as Mock).mockResolvedValueOnce({
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

  describe('Test 3: Filters narrow the loaded results, without searching again', () => {
    const hit = (id: string, continent: string, publisher: string, score = 0.8) => ({
      _id: id,
      _score: score,
      fields: { label: id, content: id, continent, country: '', publisher, documentType: 'Law', tags: [] },
    });
    const ids = () => useAppStore.getState().filteredResults.map((n) => n.id);

    beforeEach(async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...fromRaw({
            result: {
              hits: [
                hit('eu', 'Europe', 'Government', 0.9),
                hit('asia', 'Asia', 'Law firm', 0.5),
                hit('us', 'North America', 'Law firm', 0.3),
              ],
            },
          }),
        }),
      });
      await useAppStore.getState().performSearch('AI regulation');
      (global.fetch as Mock).mockClear();
    });

    it('searches without sending filters to Pinecone', async () => {
      useAppStore.setState({ selectedPublishers: ['Law firm'] } as any);
      (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ ...fromRaw({ result: { hits: [] } }) }) });
      await useAppStore.getState().performSearch('again');
      const body = JSON.parse((global.fetch as Mock).mock.calls[0][1].body);
      expect(body.filters).toBeUndefined();
    });

    it('ticking a filter narrows what is shown and does not search', () => {
      useAppStore.getState().toggleContinent('Europe');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(ids()).toEqual(['eu']);
    });

    it('unticking brings the documents straight back', () => {
      useAppStore.getState().togglePublisher('Law firm');
      expect(ids()).toEqual(['asia', 'us']);
      useAppStore.getState().togglePublisher('Law firm');
      expect(ids()).toEqual(['eu', 'asia', 'us']);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('keeps the full option lists and counts while filtering', () => {
      useAppStore.getState().togglePublisher('Government');
      const state = useAppStore.getState();
      expect(state.getAvailablePublishers()).toEqual(['Government', 'Law firm']);
      expect(state.getNodeCountByPublisher('Law firm')).toBe(2);
      expect(state.getAvailableContinents()).toEqual(['Europe', 'Asia', 'North America']);
    });

    it('a new search keeps the ticked filters and applies them to the new results', async () => {
      useAppStore.getState().toggleContinent('Asia');
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...fromRaw({ result: { hits: [hit('a2', 'Asia', 'NGO'), hit('e2', 'Europe', 'NGO')] } }) }),
      });
      await useAppStore.getState().performSearch('watermarking');
      expect(ids()).toEqual(['a2']);
    });

    it('clearing all filters shows everything', () => {
      useAppStore.getState().toggleContinent('Europe');
      useAppStore.getState().toggleTag('x');
      useAppStore.getState().clearLocationFilters();
      useAppStore.getState().clearTagFilters();
      expect(ids()).toEqual(['eu', 'asia', 'us']);
    });

    it('filters similarity in the browser too', () => {
      useAppStore.getState().toggleSimilarityRange('81-100');
      expect(ids()).toEqual(['eu']);
      expect(useAppStore.getState().searchResults).toHaveLength(3);
    });
  });
});

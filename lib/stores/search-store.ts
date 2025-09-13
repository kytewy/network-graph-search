import { create } from 'zustand';

interface SearchState {
  searchTerm: string;
  searchHistory: string[];
  isSearching: boolean;
  searchStatus: string;
  hasSearched: boolean;
  topResults: number;
  
  // Actions
  setSearchTerm: (term: string) => void;
  setSearchHistory: (history: string[]) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchStatus: (status: string) => void;
  setHasSearched: (searched: boolean) => void;
  setTopResults: (results: number) => void;
  addToSearchHistory: (term: string) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: '',
  searchHistory: [],
  isSearching: false,
  searchStatus: '',
  hasSearched: false,
  topResults: 5,
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSearchHistory: (history) => set({ searchHistory: history }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setSearchStatus: (status) => set({ searchStatus: status }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
  setTopResults: (results) => set({ topResults: results }),
  addToSearchHistory: (term) => {
    const { searchHistory } = get();
    if (!searchHistory.includes(term.trim())) {
      set({ searchHistory: [term.trim(), ...searchHistory.slice(0, 4)] });
    }
  },
  clearSearch: () => set({ 
    searchTerm: '', 
    hasSearched: false, 
    searchStatus: '' 
  }),
}));

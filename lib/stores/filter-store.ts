import { create } from "zustand"

interface FilterState {
  searchTerm: string
  searchMode: "fulltext" | "semantic"
  selectedNodeTypes: string[]
  selectedLinkTypes: string[]
  selectedContinents: string[]
  selectedCountries: string[]
  selectedStateProvinces: string[]
  selectedSourceTypes: string[]
  deselectedNodeTypes: string[]
  selectedSimilarityRange: string[]
  minNodeSize: number[]
  maxNodeSize: number[]
  useSimilaritySize: boolean
  colorMode: "sourceType" | "continent" | "similarityRange"
  nodeSizeMode: "none" | "contentLength" | "summaryLength" | "similarity"
  topResults: number
  similarityThreshold: string
  expandedContinents: string[]
  countrySearchTerm: string

  // Actions
  setSearchTerm: (term: string) => void
  setSearchMode: (mode: "fulltext" | "semantic") => void
  setSelectedNodeTypes: (types: string[]) => void
  setSelectedLinkTypes: (types: string[]) => void
  setSelectedContinents: (continents: string[]) => void
  setSelectedCountries: (countries: string[]) => void
  setSelectedStateProvinces: (provinces: string[]) => void
  setSelectedSourceTypes: (types: string[]) => void
  setDeselectedNodeTypes: (types: string[]) => void
  setSelectedSimilarityRange: (range: string[]) => void
  setMinNodeSize: (size: number[]) => void
  setMaxNodeSize: (size: number[]) => void
  setUseSimilaritySize: (use: boolean) => void
  setColorMode: (mode: "sourceType" | "continent" | "similarityRange") => void
  setNodeSizeMode: (mode: "none" | "contentLength" | "summaryLength" | "similarity") => void
  setTopResults: (results: number) => void
  setSimilarityThreshold: (threshold: string) => void
  toggleContinent: (continent: string) => void
  toggleContinentExpansion: (continent: string) => void
  toggleCountry: (country: string) => void
  toggleSourceType: (sourceType: string) => void
  toggleSimilarityRange: (range: string) => void
  setCountrySearchTerm: (term: string) => void
  setExpandedContinents: (continents: string[]) => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterState>((set, get) => ({
  searchTerm: "",
  searchMode: "fulltext",
  selectedNodeTypes: [],
  selectedLinkTypes: [],
  selectedContinents: [],
  selectedCountries: [],
  selectedStateProvinces: [],
  selectedSourceTypes: [],
  deselectedNodeTypes: [],
  selectedSimilarityRange: [],
  minNodeSize: [0],
  maxNodeSize: [100],
  useSimilaritySize: false,
  colorMode: "sourceType",
  nodeSizeMode: "none",
  topResults: 10,
  similarityThreshold: "all",
  expandedContinents: [],
  countrySearchTerm: "",

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSearchMode: (mode) => set({ searchMode: mode }),
  setSelectedNodeTypes: (types) => set({ selectedNodeTypes: types }),
  setSelectedLinkTypes: (types) => set({ selectedLinkTypes: types }),
  setSelectedContinents: (continents) => set({ selectedContinents: continents }),
  setSelectedCountries: (countries) => set({ selectedCountries: countries }),
  setSelectedStateProvinces: (provinces) => set({ selectedStateProvinces: provinces }),
  setSelectedSourceTypes: (types) => set({ selectedSourceTypes: types }),
  setDeselectedNodeTypes: (types) => set({ deselectedNodeTypes: types }),
  setSelectedSimilarityRange: (range) => set({ selectedSimilarityRange: range }),
  setMinNodeSize: (size) => set({ minNodeSize: size }),
  setMaxNodeSize: (size) => set({ maxNodeSize: size }),
  setUseSimilaritySize: (use) => set({ useSimilaritySize: use }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setNodeSizeMode: (mode) => set({ nodeSizeMode: mode }),
  setTopResults: (results) => set({ topResults: results }),
  setSimilarityThreshold: (threshold) => set({ similarityThreshold: threshold }),
  toggleContinent: (continent) =>
    set((state) => ({
      selectedContinents: state.selectedContinents.includes(continent)
        ? state.selectedContinents.filter((c) => c !== continent)
        : [...state.selectedContinents, continent],
    })),
  toggleContinentExpansion: (continent) =>
    set((state) => ({
      expandedContinents: state.expandedContinents.includes(continent)
        ? state.expandedContinents.filter((c) => c !== continent)
        : [...state.expandedContinents, continent],
    })),
  toggleCountry: (country) =>
    set((state) => ({
      selectedCountries: state.selectedCountries.includes(country)
        ? state.selectedCountries.filter((c) => c !== country)
        : [...state.selectedCountries, country],
    })),
  toggleSourceType: (sourceType) =>
    set((state) => ({
      selectedSourceTypes: state.selectedSourceTypes.includes(sourceType)
        ? state.selectedSourceTypes.filter((s) => s !== sourceType)
        : [...state.selectedSourceTypes, sourceType],
    })),
  toggleSimilarityRange: (range) =>
    set((state) => ({
      selectedSimilarityRange: state.selectedSimilarityRange.includes(range)
        ? state.selectedSimilarityRange.filter((r) => r !== range)
        : [...state.selectedSimilarityRange, range],
    })),
  setCountrySearchTerm: (term) => set({ countrySearchTerm: term }),
  setExpandedContinents: (continents) => set({ expandedContinents: continents }),
  clearFilters: () =>
    set({
      searchTerm: "",
      selectedNodeTypes: [],
      selectedLinkTypes: [],
      selectedContinents: [],
      selectedCountries: [],
      selectedStateProvinces: [],
      selectedSourceTypes: [],
      deselectedNodeTypes: [],
      selectedSimilarityRange: [],
      minNodeSize: [0],
      maxNodeSize: [100],
      useSimilaritySize: false,
      expandedContinents: [],
      countrySearchTerm: "",
    }),
}))

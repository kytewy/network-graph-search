import { create } from "zustand"

interface UIState {
  showLabels: boolean
  showDescriptionSummary: boolean
  showThemeAnalysis: boolean
  collapsedThemes: string[]
  showSummaryAnalysis: boolean
  showBusinessAnalysis: boolean
  showThemesAnalysis: boolean
  showMethodology: { [key: string]: boolean }
  showFilterTypes: boolean
  showActiveNodes: boolean
  rightPanelExpanded: boolean
  histogramExpanded: boolean
  showSearchHistory: boolean
  hasSearched: boolean
  searchStatus: string
  apiKey: string

  // Actions
  setShowLabels: (show: boolean) => void
  setShowDescriptionSummary: (show: boolean) => void
  setShowThemeAnalysis: (show: boolean) => void
  toggleThemeCollapse: (theme: string) => void
  setShowSummaryAnalysis: (show: boolean) => void
  setShowBusinessAnalysis: (show: boolean) => void
  setShowThemesAnalysis: (show: boolean) => void
  toggleMethodology: (key: string) => void
  setShowFilterTypes: (show: boolean) => void
  setShowActiveNodes: (show: boolean) => void
  setRightPanelExpanded: (expanded: boolean) => void
  setHistogramExpanded: (expanded: boolean) => void
  setShowSearchHistory: (show: boolean) => void
  setHasSearched: (searched: boolean) => void
  setSearchStatus: (status: string) => void
  setApiKey: (key: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  showLabels: true,
  showDescriptionSummary: false,
  showThemeAnalysis: false,
  collapsedThemes: [],
  showSummaryAnalysis: false,
  showBusinessAnalysis: false,
  showThemesAnalysis: false,
  showMethodology: {},
  showFilterTypes: false,
  showActiveNodes: false,
  rightPanelExpanded: false,
  histogramExpanded: true,
  showSearchHistory: false,
  hasSearched: false,
  searchStatus: "",
  apiKey: "",

  setShowLabels: (show) => set({ showLabels: show }),
  setShowDescriptionSummary: (show) => set({ showDescriptionSummary: show }),
  setShowThemeAnalysis: (show) => set({ showThemeAnalysis: show }),
  toggleThemeCollapse: (theme) =>
    set((state) => ({
      collapsedThemes: state.collapsedThemes.includes(theme)
        ? state.collapsedThemes.filter((t) => t !== theme)
        : [...state.collapsedThemes, theme],
    })),
  setShowSummaryAnalysis: (show) => set({ showSummaryAnalysis: show }),
  setShowBusinessAnalysis: (show) => set({ showBusinessAnalysis: show }),
  setShowThemesAnalysis: (show) => set({ showThemesAnalysis: show }),
  toggleMethodology: (key) =>
    set((state) => ({
      showMethodology: {
        ...state.showMethodology,
        [key]: !state.showMethodology[key],
      },
    })),
  setShowFilterTypes: (show) => set({ showFilterTypes: show }),
  setShowActiveNodes: (show) => set({ showActiveNodes: show }),
  setRightPanelExpanded: (expanded) => set({ rightPanelExpanded: expanded }),
  setHistogramExpanded: (expanded) => set({ histogramExpanded: expanded }),
  setShowSearchHistory: (show) => set({ showSearchHistory: show }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
  setSearchStatus: (status) => set({ searchStatus: status }),
  setApiKey: (key) => set({ apiKey: key }),
}))

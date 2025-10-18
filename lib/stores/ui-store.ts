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
  // rightPanelExpanded: boolean - DUPLICATE! Already in app-state (Phase 1)
  histogramExpanded: boolean
  showSearchHistory: boolean
  // hasSearched: boolean - MOVED to app-state (Phase 1)
  // searchStatus: string - MOVED to app-state (Phase 1)
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
  // setRightPanelExpanded - DUPLICATE! Already in app-state (Phase 1)
  setHistogramExpanded: (expanded: boolean) => void
  setShowSearchHistory: (show: boolean) => void
  // setHasSearched - MOVED to app-state (Phase 1)
  // setSearchStatus - MOVED to app-state (Phase 1)
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
  // rightPanelExpanded - DUPLICATE! Already in app-state (Phase 1)
  histogramExpanded: true,
  showSearchHistory: false,
  // hasSearched - MOVED to app-state (Phase 1)
  // searchStatus - MOVED to app-state (Phase 1)
  apiKey: "",

  setShowLabels: (show) => set({ showLabels: show }),
  setShowDescriptionSummary: (show) => set({ showDescriptionSummary: show }),
  setShowThemeAnalysis: (show) => set({ showThemeAnalysis: show }),
  toggleThemeCollapse: (theme) =>
    set((state) => ({
      collapsedThemes: Array.isArray(state.collapsedThemes) && state.collapsedThemes.includes(theme)
        ? state.collapsedThemes.filter((t) => t !== theme)
        : [...(Array.isArray(state.collapsedThemes) ? state.collapsedThemes : []), theme],
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
  // setRightPanelExpanded - DUPLICATE! Already in app-state (Phase 1)
  setHistogramExpanded: (expanded) => set({ histogramExpanded: expanded }),
  setShowSearchHistory: (show) => set({ showSearchHistory: show }),
  // setHasSearched - MOVED to app-state (Phase 1)
  // setSearchStatus - MOVED to app-state (Phase 1)
  setApiKey: (key) => set({ apiKey: key }),
}))

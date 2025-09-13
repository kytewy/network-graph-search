import { create } from 'zustand';

interface LayoutState {
  showLabels: boolean;
  colorMode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country';
  nodeSizeMode: 'none' | 'contentLength' | 'summaryLength' | 'similarity';
  rightPanelExpanded: boolean;
  
  // Actions
  setShowLabels: (show: boolean) => void;
  setColorMode: (mode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country') => void;
  setNodeSizeMode: (mode: 'none' | 'contentLength' | 'summaryLength' | 'similarity') => void;
  setRightPanelExpanded: (expanded: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  showLabels: true,
  colorMode: 'sourceType',
  nodeSizeMode: 'none',
  rightPanelExpanded: false,
  
  setShowLabels: (show) => set({ showLabels: show }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setNodeSizeMode: (mode) => set({ nodeSizeMode: mode }),
  setRightPanelExpanded: (expanded) => set({ rightPanelExpanded: expanded }),
}));

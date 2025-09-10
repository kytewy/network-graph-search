import { create } from "zustand"

interface EmbeddingState {
  embeddings: { [nodeId: string]: number[] }
  similarities: { [nodeId: string]: { [nodeId: string]: number } }
  isGenerating: boolean
  lastUpdated: Date | null

  // Actions
  setEmbeddings: (embeddings: { [nodeId: string]: number[] }) => void
  setSimilarities: (similarities: { [nodeId: string]: { [nodeId: string]: number } }) => void
  setIsGenerating: (isGenerating: boolean) => void
  clearEmbeddings: () => void
  getSimilarity: (nodeId1: string, nodeId2: string) => number
}

export const useEmbeddingStore = create<EmbeddingState>((set, get) => ({
  embeddings: {},
  similarities: {},
  isGenerating: false,
  lastUpdated: null,

  setEmbeddings: (embeddings) => set({ embeddings, lastUpdated: new Date() }),
  setSimilarities: (similarities) => set({ similarities, lastUpdated: new Date() }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  clearEmbeddings: () => set({ embeddings: {}, similarities: {}, lastUpdated: null }),

  getSimilarity: (nodeId1: string, nodeId2: string) => {
    const { similarities } = get()
    return similarities[nodeId1]?.[nodeId2] || 0
  },
}))

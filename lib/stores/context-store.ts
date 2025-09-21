import { create } from 'zustand';
import { type Node } from '@/lib/stores/app-state';

interface ContextState {
  // Selected nodes for context
  contextNodes: Node[];
  
  // Actions
  addNodesToContext: (nodes: Node[]) => void;
  removeNodeFromContext: (nodeId: string) => void;
  clearContext: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
  contextNodes: [],
  
  addNodesToContext: (nodes) => 
    set((state) => {
      // Filter out duplicates by creating a map of existing nodes by ID
      const existingNodesMap = new Map(state.contextNodes.map(node => [node.id, node]));
      
      // Add new nodes that don't already exist
      nodes.forEach(node => {
        if (!existingNodesMap.has(node.id)) {
          existingNodesMap.set(node.id, node);
        }
      });
      
      return { contextNodes: Array.from(existingNodesMap.values()) };
    }),
    
  removeNodeFromContext: (nodeId) =>
    set((state) => ({
      contextNodes: state.contextNodes.filter(node => node.id !== nodeId)
    })),
    
  clearContext: () => set({ contextNodes: [] }),
}));

'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import type { Node } from '@/lib/stores/app-state';
import { logArrayOperation } from '@/lib/utils/error-tracker';

interface UseGraphSelectionOptions {
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  graphRef: React.RefObject<GraphCanvasRef>;
}

interface UseGraphSelectionReturn {
  selections: { nodes: GraphNode[]; edges: GraphEdge[] };
  selectedNode: Node | null;
  onNodeClick: (node: GraphNode) => void;
  onCanvasClick: (event?: MouseEvent) => void;
  clearSelections: (nodeIds?: string[]) => void;
}

/**
 * Simple graph selection hook that avoids infinite loops
 * This is a safe implementation that doesn't use Reagraph's built-in hook
 * to avoid SSR issues while we debug
 */
export function useGraphSelectionReagraph(
  options: UseGraphSelectionOptions
): UseGraphSelectionReturn {
  const { graphNodes, graphEdges } = options;
  
  // State for selections and selected node
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Get selected nodes and edges based on IDs
  const selections = useMemo(() => {
    console.log('🔍 [useGraphSelectionReagraph] Creating selections with:', {
      selectedNodeIds,
      selectedNodeIdsType: typeof selectedNodeIds,
      selectedNodeIdsIsArray: Array.isArray(selectedNodeIds),
      graphNodesLength: Array.isArray(graphNodes) ? graphNodes.length : 'Not array',
      graphEdgesLength: Array.isArray(graphEdges) ? graphEdges.length : 'Not array'
    });

    const safeNodeIds = Array.isArray(selectedNodeIds) ? selectedNodeIds : [];
    logArrayOperation('safeNodeIds check', safeNodeIds, 'useGraphSelectionReagraph selections');
    
    const selectedNodes = graphNodes.filter(node => {
      logArrayOperation('node.id includes check', safeNodeIds, `useGraphSelectionReagraph filtering node ${node.id}`);
      return safeNodeIds.includes(node.id);
    });
    
    const selectedEdges = graphEdges.filter(edge => {
      logArrayOperation('edge source/target includes check', safeNodeIds, `useGraphSelectionReagraph filtering edge ${edge.source}->${edge.target}`);
      return safeNodeIds.includes(edge.source) && safeNodeIds.includes(edge.target);
    });

    const result = {
      nodes: selectedNodes,
      edges: selectedEdges,
    };

    console.log('🔍 [useGraphSelectionReagraph] Selections result:', {
      selectedNodesCount: selectedNodes.length,
      selectedEdgesCount: selectedEdges.length,
      result
    });

    return result;
  }, [selectedNodeIds, graphNodes, graphEdges]);

  // Handle node click - toggle selection and update context panel
  const handleNodeClick = useCallback((node: GraphNode) => {
    console.log('🔍 [useGraphSelectionReagraph] Node clicked:', { node: node.id });
    
    setSelectedNodeIds(prev => {
      console.log('🔍 [useGraphSelectionReagraph] Previous selectedNodeIds:', prev);
      const safeArray = Array.isArray(prev) ? prev : [];
      logArrayOperation('handleNodeClick includes check', safeArray, `useGraphSelectionReagraph checking if ${node.id} is selected`);
      const isSelected = safeArray.includes(node.id);
      
      if (isSelected) {
        // Remove from selection
        return safeArray.filter(id => id !== node.id);
      } else {
        // Add to selection (single selection for now)
        return [node.id];
      }
    });

    // Update selectedNode for context panel
    if (node.data) {
      setSelectedNode(node.data as unknown as Node);
    }
  }, []);

  // Handle canvas click - clear all selections
  const handleCanvasClick = useCallback((event?: MouseEvent) => {
    setSelectedNodeIds([]);
    setSelectedNode(null);
  }, []);

  // Clear selections function
  const clearSelections = useCallback((nodeIds?: string[]) => {
    if (nodeIds && Array.isArray(nodeIds)) {
      setSelectedNodeIds(prev => {
        const safeArray = Array.isArray(prev) ? prev : [];
        return safeArray.filter(id => !nodeIds.includes(id));
      });
    } else {
      setSelectedNodeIds([]);
      setSelectedNode(null);
    }
  }, []);

  return {
    selections,
    selectedNode,
    onNodeClick: handleNodeClick,
    onCanvasClick: handleCanvasClick,
    clearSelections,
  };
}

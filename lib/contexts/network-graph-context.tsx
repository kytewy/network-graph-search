'use client';

import React, { createContext, useContext, useRef, useState, useMemo, useCallback, useEffect } from 'react';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';
import { useNetworkStore } from '@/lib/stores/network-store';
import { useContextStore } from '@/lib/stores/context-store';
import { toast } from 'sonner';

// Define the allowed layout types for Reagraph
type LayoutType =
  | 'forceDirected2d'
  | 'forceDirected3d'
  | 'hierarchical'
  | 'radial'
  | 'forceAtlas2'
  | 'noOverlap'
  | 'concentric2d'
  | 'radialOut2d';

// Define extended types for reagraph's useSelection hook to support lasso selection
interface ExtendedUseSelectionResult {
  selections: { nodes: GraphNode[]; edges: GraphEdge[] };
  clearSelections: (value?: string[]) => void;
  onNodeClick: (node: GraphNode) => void;
  onCanvasClick: (event: MouseEvent) => void;
  onLasso?: (selections: string[]) => void;
  onLassoEnd?: (selections: string[], event?: MouseEvent) => void;
}

// Define the context interface
interface NetworkGraphContextType {
  // Graph data
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  filteredResults: Node[];
  filteredLinks: Link[];
  
  // Graph state
  layoutType: LayoutType;
  showLabels: boolean;
  colorMode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country';
  nodeSizeMode: 'none' | 'contentLength' | 'summaryLength' | 'similarity';
  clusterMode: 'none' | 'type' | 'continent' | 'country' | 'sourceType';
  
  // Selection state
  selections: { nodes: GraphNode[]; edges: GraphEdge[] };
  selectedNode: Node | null;
  
  // Lasso selection state
  lassoSelectedNodes: string[];
  showLassoMenu: boolean;
  lassoMenuPosition: { x: number; y: number };
  
  // Refs
  graphRef: React.RefObject<GraphCanvasRef>;
  nodePositionsRef: React.MutableRefObject<Map<string, { x: number; y: number; z: number }>>;
  
  // Actions
  handleLayoutChange: (layout: string) => void;
  setShowLabels: (show: boolean) => void;
  setColorMode: (mode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country') => void;
  setNodeSizeMode: (mode: 'none' | 'contentLength' | 'summaryLength' | 'similarity') => void;
  setClusterMode: (mode: 'none' | 'type' | 'continent' | 'country' | 'sourceType') => void;
  handleCustomNodeClick: (node: GraphNode) => void;
  handleLasso: (selectedIds: string[]) => void;
  handleLassoEnd: (selectedIds: string[], event?: MouseEvent) => void;
  closeLassoMenu: () => void;
  handleSendToContext: (nodes: Node[]) => void;
  
  // Computed properties
  getNodeColor: (node: Node) => string;
  getNodeSize: (node: Node) => number;
  
  // Selection handlers
  onNodeClick: (node: GraphNode) => void;
  onCanvasClick: (event: MouseEvent) => void;
  onLasso?: (selections: string[]) => void;
  onLassoEnd?: (selections: string[], event?: MouseEvent) => void;
  clearSelections: (value?: string[]) => void;
}

// Create the context
const NetworkGraphContext = createContext<NetworkGraphContextType | undefined>(undefined);

// Provider component
export function NetworkGraphProvider({ children }: { children: React.ReactNode }) {
  // Get data from Zustand stores
  const filteredResults = useAppStore((state) => state.filteredResults);
  const filteredLinks = useAppStore((state) => state.filteredLinks);
  const networkLayoutType = useNetworkStore((state) => state.layoutType);
  
  // Get visualization settings from app store
  const showLabels = useAppStore((state) => state.showLabels);
  const colorMode = useAppStore((state) => state.colorMode);
  const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);
  const clusterMode = useAppStore((state) => state.clusterMode);
  
  // Get setters from app store
  const setShowLabelsStore = useAppStore((state) => state.setShowLabels);
  const setColorModeStore = useAppStore((state) => state.setColorMode);
  const setNodeSizeModeStore = useAppStore((state) => state.setNodeSizeMode);
  const setClusterModeStore = useAppStore((state) => state.setClusterMode);
  
  // Access the context store
  const addNodesToContext = useContextStore((state) => state.addNodesToContext);
  
  // Refs
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  
  // Local state
  const [layoutType, setLayoutType] = useState<LayoutType>(getReagraphLayoutType());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [lassoSelectedNodes, setLassoSelectedNodes] = useState<string[]>([]);
  const [showLassoMenu, setShowLassoMenu] = useState(false);
  const [lassoMenuPosition, setLassoMenuPosition] = useState({ x: 0, y: 0 });
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Map network store layout type to Reagraph layout type
  function getReagraphLayoutType(): LayoutType {
    switch (networkLayoutType) {
      case 'forceDirected':
        return 'forceDirected2d';
      case 'concentric':
        return 'concentric2d';
      case 'radial':
        return 'radialOut2d';
      default:
        return 'forceDirected2d';
    }
  }
  
  // Update layout when network store changes
  useEffect(() => {
    setLayoutType(getReagraphLayoutType());
  }, [networkLayoutType]);
  
  // Update refresh key when nodeSizeMode changes to force re-render
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [nodeSizeMode]);
  
  // Get color based on node property and colorMode
  const getNodeColor = useCallback((node: Node) => {
    switch (colorMode) {
      case 'sourceType':
        return node.type === 'article'
          ? '#4f46e5'
          : node.type === 'document'
          ? '#10b981'
          : node.type === 'webpage'
          ? '#f59e0b'
          : node.type === 'pdf'
          ? '#ef4444'
          : '#a855f7';
      case 'continent':
        return node.continent === 'North America'
          ? '#4f46e5'
          : node.continent === 'Europe'
          ? '#10b981'
          : node.continent === 'Asia'
          ? '#f59e0b'
          : node.continent === 'Africa'
          ? '#ef4444'
          : node.continent === 'South America'
          ? '#a855f7'
          : '#6b7280'; // Unknown/Other
      case 'country':
        // Specific colors for important countries, gray for others
        return node.country === 'USA'
          ? '#1e40af' // Dark blue
          : node.country === 'Canada'
          ? '#ef4444' // Red
          : node.country === 'European Union'
          ? '#60a5fa' // Light blue
          : '#6b7280'; // Gray for other countries
      case 'similarityRange':
        // Color by similarity percentage (using score) matching the histogram ranges
        if (node.score !== undefined) {
          // Convert score to percentage (0-1 to 0-100)
          const similarityPercent = Math.round(node.score * 100);
          
          if (similarityPercent >= 81) return '#22c55e'; // Green for 81-100%
          if (similarityPercent >= 61) return '#84cc16'; // Light green for 61-80%
          if (similarityPercent >= 41) return '#eab308'; // Yellow for 41-60%
          if (similarityPercent >= 20) return '#f97316'; // Orange for 20-40%
          return '#ef4444'; // Red for <20%
        }
        return '#6b7280'; // Default gray if no score
      case 'documentType':
        return node.type === 'article'
          ? '#4f46e5'
          : node.type === 'document'
          ? '#10b981'
          : node.type === 'webpage'
          ? '#f59e0b'
          : node.type === 'pdf'
          ? '#ef4444'
          : '#a855f7';
      default:
        return node.category === 'article' ? '#4f46e5' : '#10b981';
    }
  }, [colorMode]);
  
  // Get node size based on nodeSizeMode
  const getNodeSize = useCallback((node: Node) => {
    switch (nodeSizeMode) {
      case 'similarity':
        // Use score for similarity (0-1 value)
        if (node.score !== undefined) {
          const similarityPercent = Math.round(node.score * 100);
          
          // 5 different size buckets based on similarity
          if (similarityPercent >= 81) return 20; // Largest
          if (similarityPercent >= 61) return 16;
          if (similarityPercent >= 41) return 12;
          if (similarityPercent >= 20) return 8;
          return 4; // Smallest
        }
        return 10; // Default size
        
      case 'contentLength':
        // Size based on content length
        const contentLength = (node.content || '').length;
        
        if (contentLength > 1000) return 20; // 1000+ chars
        if (contentLength > 500) return 12; // 501-1000 chars
        return 6; // Under 500 chars
        
      case 'none':
      default:
        return 10; // Default size for 'none' mode
    }
  }, [nodeSizeMode]);
  
  // Convert nodes to Reagraph nodes
  const graphNodes = useMemo(() => {
    if (!filteredResults || filteredResults.length === 0) return [];
    
    return filteredResults.map((node) => ({
      id: node.id,
      label: node.label || node.id,
      fill: getNodeColor(node),
      size: getNodeSize(node), // Size is used by Reagraph's sizingAttribute="size"
      score: node.score || 0.5,
      category: node.category || '',
      data: node,
    }));
  }, [filteredResults, getNodeColor, getNodeSize, nodeSizeMode, colorMode]);
  
  // Convert links to Reagraph edges
  const graphEdges = useMemo(() => {
    if (!filteredLinks || filteredLinks.length === 0) return [];
    
    return filteredLinks.map((link) => ({
      id: link.id || `${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      label: link.label || '',
      type: link.type || 'default',
      data: link,
    }));
  }, [filteredLinks]);
  
  // Selection configuration
  const selectionConfig = useMemo(() => {
    if (graphNodes.length === 0) {
      // Return a dummy config that won't be used
      return {
        ref: graphRef as React.RefObject<GraphCanvasRef>,
        nodes: [],
        edges: [],
      };
    }
    
    return {
      ref: graphRef as React.RefObject<GraphCanvasRef>,
      nodes: graphNodes,
      edges: graphEdges,
      hotkeys: ['selectAll', 'deselect'], // Enable useful hotkeys
      focusOnSelect: true, // Focus on selected nodes
      type: 'multi', // Allow multi-selection
    };
  }, [graphNodes, graphEdges]);
  
  // Selection handling with extended types for lasso support
  const selectionResult = useSelection(
    selectionConfig
  ) as unknown as ExtendedUseSelectionResult;
  
  const {
    selections,
    clearSelections,
    onNodeClick: handleNodeClick,
    onCanvasClick,
    onLasso,
    onLassoEnd,
  } = selectionResult;
  
  // Custom node click handler
  const handleCustomNodeClick = useCallback((node: GraphNode) => {
    // Call the built-in handler
    if (graphRef.current) {
      handleNodeClick(node);
    }
    
    // Update selected node if data exists
    if (node.data) {
      setSelectedNode(node.data as Node);
    }
  }, [handleNodeClick]);
  
  // Handle lasso selection
  const handleLasso = useCallback((selectedIds: string[]) => {
    // Guard against undefined or null
    if (!selectedIds || !Array.isArray(selectedIds)) {
      return;
    }
    
    setLassoSelectedNodes(selectedIds);
    // Let Reagraph handle the selection state internally
  }, []);
  
  // Handle lasso end event
  const handleLassoEnd = useCallback((selectedIds: string[], event?: MouseEvent) => {
    // Guard against undefined or null
    if (!selectedIds || !Array.isArray(selectedIds)) {
      setLassoSelectedNodes([]);
      return;
    }
    
    // If nodes were selected, show the lasso menu
    if (selectedIds.length > 0) {
      setLassoSelectedNodes(selectedIds);
      
      // Get mouse position for the menu or use center of screen
      const mousePosition = {
        x: window.innerWidth / 2 - 200, // Center horizontally, offset by half the menu width
        y: 100, // Position near the top of the screen
      };
      setLassoMenuPosition(mousePosition);
      setShowLassoMenu(true);
    } else {
      // Just clear our local selection state
      setLassoSelectedNodes([]);
    }
  }, []);
  
  // Handler for sending selected nodes to context
  const handleSendToContext = useCallback((nodes: Node[]) => {
    console.log('Sending nodes to context:', nodes.length);
    console.log(
      'Node content example:',
      nodes[0]?.content?.substring(0, 50) + '...'
    );
    
    // Show toast notification
    toast.success(
      `Added ${nodes.length} node${nodes.length > 1 ? 's' : ''} to context`,
      {
        description:
          'Node content is now available in the Context Management panel',
        duration: 3000,
      }
    );
    
    addNodesToContext(nodes);
    
    // Clear selections after sending to context
    closeLassoMenu();
  }, [addNodesToContext]);
  
  // Close lasso menu and clear selections
  const closeLassoMenu = useCallback(() => {
    console.log('Closing lasso menu');
    
    // Store the previously selected nodes for cleanup
    const nodesToClear = [...lassoSelectedNodes];
    console.log('Nodes that need highlighting cleared:', nodesToClear);
    
    // Clear our local state first
    setShowLassoMenu(false);
    setLassoSelectedNodes([]);
    
    // Clear Reagraph selections if the function exists
    if (clearSelections) {
      console.log('Clearing selections on lasso menu close');
      
      // First update the force update counter to ensure a re-render
      // This ensures the component will re-render with the new state
      setForceUpdate((prev: number) => prev + 1);
      
      // Then clear the selections after the state update is queued
      clearSelections();
      
      // Similar to how layout changes update the store, update any relevant global state
      // This ensures all sources of truth about selections are consistent
      if (useNetworkStore.getState().setSelectedNodes) {
        useNetworkStore.getState().setSelectedNodes([]);
      }
      
      // Log that we've completed the clearing process
      console.log('Selection clearing and re-render triggered');
    } else {
      console.warn(
        'clearSelections function is not available on lasso menu close'
      );
    }
  }, [lassoSelectedNodes, clearSelections]);
  
  // Handle layout change
  const handleLayoutChange = useCallback((layout: string) => {
    setLayoutType(layout as LayoutType);
    
    // Map Reagraph layout type to network store layout type
    let networkLayout: 'forceDirected' | 'concentric' | 'radial';
    if (layout === 'forceDirected2d') {
      networkLayout = 'forceDirected';
    } else if (layout === 'concentric2d') {
      networkLayout = 'concentric';
      // Reset cluster mode when switching to a non-force-directed layout
      if (clusterMode !== 'none') {
        setClusterModeStore('none');
      }
    } else if (layout === 'radialOut2d') {
      networkLayout = 'radial';
      // Reset cluster mode when switching to a non-force-directed layout
      if (clusterMode !== 'none') {
        setClusterModeStore('none');
      }
    } else {
      networkLayout = 'forceDirected';
    }
    
    useNetworkStore.getState().setLayoutType(networkLayout);
  }, [clusterMode, setClusterModeStore]);
  
  // Wrapper functions for setters
  const setShowLabels = useCallback((show: boolean) => {
    setShowLabelsStore(show);
  }, [setShowLabelsStore]);
  
  const setColorMode = useCallback((mode: 'sourceType' | 'continent' | 'similarityRange' | 'documentType' | 'country') => {
    setColorModeStore(mode);
  }, [setColorModeStore]);
  
  const setNodeSizeMode = useCallback((mode: 'none' | 'contentLength' | 'summaryLength' | 'similarity') => {
    setNodeSizeModeStore(mode);
  }, [setNodeSizeModeStore]);
  
  const setClusterMode = useCallback((mode: 'none' | 'type' | 'continent' | 'country' | 'sourceType') => {
    setClusterModeStore(mode);
  }, [setClusterModeStore]);
  
  // Create the context value
  const contextValue = useMemo(() => ({
    // Graph data
    graphNodes,
    graphEdges,
    filteredResults,
    filteredLinks,
    
    // Graph state
    layoutType,
    showLabels,
    colorMode,
    nodeSizeMode,
    clusterMode,
    
    // Selection state
    selections,
    selectedNode,
    
    // Lasso selection state
    lassoSelectedNodes,
    showLassoMenu,
    lassoMenuPosition,
    
    // Refs
    graphRef,
    nodePositionsRef,
    
    // Actions
    handleLayoutChange,
    setShowLabels,
    setColorMode,
    setNodeSizeMode,
    setClusterMode,
    handleCustomNodeClick,
    handleLasso,
    handleLassoEnd,
    closeLassoMenu,
    handleSendToContext,
    
    // Computed properties
    getNodeColor,
    getNodeSize,
    
    // Selection handlers
    onNodeClick: handleNodeClick,
    onCanvasClick,
    onLasso,
    onLassoEnd,
    clearSelections,
  }), [
    graphNodes,
    graphEdges,
    filteredResults,
    filteredLinks,
    layoutType,
    showLabels,
    colorMode,
    nodeSizeMode,
    clusterMode,
    selections,
    selectedNode,
    lassoSelectedNodes,
    showLassoMenu,
    lassoMenuPosition,
    handleLayoutChange,
    setShowLabels,
    setColorMode,
    setNodeSizeMode,
    setClusterMode,
    handleCustomNodeClick,
    handleLasso,
    handleLassoEnd,
    closeLassoMenu,
    handleSendToContext,
    getNodeColor,
    getNodeSize,
    handleNodeClick,
    onCanvasClick,
    onLasso,
    onLassoEnd,
    clearSelections,
  ]);
  
  return (
    <NetworkGraphContext.Provider value={contextValue}>
      {children}
    </NetworkGraphContext.Provider>
  );
}

// Custom hook to use the context
export function useNetworkGraph() {
  const context = useContext(NetworkGraphContext);
  if (context === undefined) {
    throw new Error('useNetworkGraph must be used within a NetworkGraphProvider');
  }
  return context;
}

// Error boundary component
export class NetworkGraphErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('NetworkGraph error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full bg-gray-50 border rounded p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Network Graph Error
            </h3>
            <p className="text-gray-600">
              There was an error rendering the network graph.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';
import { NodeContextMenu, Node as NodeType } from './NewNodeComponents';
import { LassoSelectionMenu } from './LassoSelectionMenu';
import { VisualizationControls } from '@/components/ui/VisualizationControls';
import { useNetworkStore } from '@/lib/stores/network-store';

// Extend GraphCanvasRef to include the methods we need
interface ExtendedGraphCanvasRef extends GraphCanvasRef {
  reorganize?: () => void;
  arrangeAsTree?: () => void;
}

// Define extended types for reagraph's useSelection hook to support lasso selection
interface ExtendedUseSelectionResult {
  selections: any;
  onNodeClick: (node: GraphNode) => void;
  onCanvasClick: (event: MouseEvent) => void;
  onLasso?: (selections: string[]) => void;
  onLassoEnd?: (selections: string[]) => void;
}

interface ExtendedUseSelectionOptions {
  ref: React.RefObject<GraphCanvasRef | null>;
  nodes: GraphNode[];
  edges: GraphEdge[];
  type?: 'single' | 'multi';
}

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
  () => import('reagraph').then((m) => m.GraphCanvas),
  { ssr: false }
);

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

/**
 * NetworkGraph component
 * Visualizes search results as a network graph using Reagraph
 * Supports different layout types and node selection
 */
export function NetworkGraph() {
  const filteredResults = useAppStore((state) => state.filteredResults);
  const filteredLinks = useAppStore((state) => state.filteredLinks);
  const networkLayoutType = useNetworkStore((state) => state.layoutType);
  
  // Map network store layout type to Reagraph layout type
  const getReagraphLayoutType = (): LayoutType => {
    switch (networkLayoutType) {
      case 'forceDirected': return 'forceDirected2d';
      case 'concentric': return 'concentric2d';
      case 'radial': return 'radialOut2d';
      default: return 'forceDirected2d';
    }
  };
  
  const [layoutType, setLayoutType] = useState<LayoutType>(getReagraphLayoutType());
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [colorBy, setColorBy] = useState<string>('continent');
  const [sizeBy, setSizeBy] = useState<string>('similarity');
  const graphRef = useRef<ExtendedGraphCanvasRef | null>(null);
  
  // Update layout when network store changes
  useMemo(() => {
    setLayoutType(getReagraphLayoutType());
  }, [networkLayoutType]);
  
  // State for context menu
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // State for lasso selection
  const [lassoSelectedNodes, setLassoSelectedNodes] = useState<string[]>([]);
  const [showLassoMenu, setShowLassoMenu] = useState(false);
  const [lassoMenuPosition, setLassoMenuPosition] = useState({ x: 0, y: 0 });
  
  // Node positions reference for maintaining positions during updates
  const nodePositionsRef = useRef<
    Map<string, { x: number; y: number; z: number }>
  >(new Map());

  // Convert nodes to Reagraph nodes
  const graphNodes = useMemo(() => {
    if (!filteredResults || filteredResults.length === 0) return [];

    return filteredResults.map((node) => ({
      id: node.id,
      label: node.label || node.id,
      fill: node.category === 'article' ? '#4f46e5' : '#10b981',
      size: Math.max(4, Math.min(20, (node.score || 0.5) * 15)), // Ensure size is within bounds
      score: node.score || 0.5,
      category: node.category || '',
      data: node,
    }));
  }, [filteredResults]);

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
    };
  }, [graphNodes, graphEdges, graphRef]);

  // Selection handling with extended types for lasso support
  const { 
    selections, 
    onNodeClick: handleNodeClick, 
    onCanvasClick,
    onLasso,
    onLassoEnd 
  } = useSelection(selectionConfig) as ExtendedUseSelectionResult;
  
  // Custom node click handler
  const handleCustomNodeClick = (node: GraphNode) => {
    // Call the built-in handler
    if (graphRef.current) {
      handleNodeClick(node);
    }
    
    // Update selected node if data exists
    if (node.data) {
      setSelectedNode(node.data as Node);
    }
  };
  
  // Handle lasso selection
  const handleLasso = (selectedIds: string[]) => {
    setLassoSelectedNodes(selectedIds);
  };
  
  // Handle lasso selection end
  const handleLassoEnd = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      // Get mouse position for the menu
      const mousePosition = {
        x: Math.max(
          100,
          Math.min(window.innerWidth / 2, window.innerWidth - 400)
        ),
        y: Math.max(
          100,
          Math.min(window.innerHeight / 3, window.innerHeight - 400)
        ),
      };
      setLassoMenuPosition(mousePosition);
      setShowLassoMenu(true);
    }
  };
  
  // Close lasso menu
  const closeLassoMenu = () => {
    setShowLassoMenu(false);
    setLassoSelectedNodes([]);
  };

  // Create refs for advanced layout functions
  const reorganizeLayoutRef = useRef<(() => void) | null>(null);
  const arrangeAsTreeRef = useRef<(() => void) | null>(null);
  
  // Handle layout change
  const handleLayoutChange = (layout: string) => {
    setLayoutType(layout as LayoutType);
    
    // Map Reagraph layout type to network store layout type
    let networkLayout: 'forceDirected' | 'concentric' | 'radial';
    if (layout === 'forceDirected2d') {
      networkLayout = 'forceDirected';
    } else if (layout === 'concentric2d') {
      networkLayout = 'concentric';
    } else if (layout === 'radialOut2d') {
      networkLayout = 'radial';
    } else {
      networkLayout = 'forceDirected';
    }
    
    useNetworkStore.getState().setLayoutType(networkLayout);
  };
  
  // Set up reorganize layout function
  useEffect(() => {
    reorganizeLayoutRef.current = () => {
      if (graphRef.current && graphRef.current.reorganize) {
        graphRef.current.reorganize();
      }
    };
    
    arrangeAsTreeRef.current = () => {
      if (graphRef.current && graphRef.current.arrangeAsTree) {
        graphRef.current.arrangeAsTree();
      }
    };
  }, [graphRef]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="absolute top-4 right-4 z-10">
        <VisualizationControls
          currentLayout={layoutType}
          onLayoutChange={handleLayoutChange}
          currentColorBy={colorBy}
          onColorByChange={setColorBy}
          currentSizeBy={sizeBy}
          onSizeByChange={setSizeBy}
          showLabels={showLabels}
          onShowLabelsChange={setShowLabels}
          reorganizeLayoutRef={reorganizeLayoutRef}
          arrangeAsTreeRef={arrangeAsTreeRef}
          hasApiKey={true}
        />
      </div>

      <div className="flex-1 w-full border rounded bg-gray-50 overflow-hidden relative">
        {/* Instruction for lasso selection */}
        <div
          style={{
            zIndex: 9,
            userSelect: 'none',
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(0, 0, 0, .5)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
          <span>Hold Shift and Drag to Lasso Select</span>
        </div>
        
        {graphNodes.length > 0 ? (
          <div className="absolute inset-0">
            <GraphCanvas
              ref={graphRef}
              nodes={graphNodes}
              edges={graphEdges}
              layoutType={layoutType as any}
              layoutOverrides={{
                linkDistance: 80,
                nodeStrength: -250,
                gravity: 0.5,
              }}
              selections={selections || []}
              onNodeClick={handleCustomNodeClick}
              onCanvasClick={(e: any) => onCanvasClick?.(e)}
              // @ts-ignore - lassoType is available in reagraph but not in the types
              lassoType="node"
              // @ts-ignore - onLasso is available in reagraph but not in the types
              onLasso={handleLasso}
              // @ts-ignore - onLassoEnd is available in reagraph but not in the types
              onLassoEnd={handleLassoEnd}
              sizingType="attribute"
              sizingAttribute={sizeBy === 'none' ? 'score' : sizeBy}
              minNodeSize={4}
              maxNodeSize={16}
              labelType={showLabels ? "auto" : "none"}
              edgeStyle="curved"
              animated={true} // Enable animation for better visualization
              cameraMode="pan"
              contextMenu={({ data, onClose }: { data: any, onClose: () => void }) => {
                // Only show context menu for nodes, not edges
                if (!data || !data.data) return null;
                
                // Get the node data from the graph node
                const nodeData = data.data as NodeType;
                
                return (
                  <NodeContextMenu
                    node={nodeData}
                    onClose={onClose}
                  />
                );
              }}
              getNodePosition={(id: string) => {
                return nodePositionsRef.current.get(id) || null;
              }}
              onNodeDragEnd={(
                node: GraphNode,
                position: { x: number; y: number; z: number }
              ) => {
                nodePositionsRef.current.set(node.id, position);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No graph data available. Try a different search query.
          </div>
        )}
        
        {/* Lasso Selection Menu */}
        {showLassoMenu && lassoSelectedNodes.length > 0 && (
          <LassoSelectionMenu
            position={lassoMenuPosition}
            selectedNodes={filteredResults.filter(node => 
              lassoSelectedNodes.includes(node.id)
            ) as any}
            onClose={closeLassoMenu}
          />
        )}
      </div>
    </div>
  );
}

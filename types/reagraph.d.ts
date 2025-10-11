declare module 'reagraph' {
  import { ReactNode, RefObject } from 'react';

  export interface GraphNode {
    id: string;
    label?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface Camera {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  }

  export interface Controls {
    enabled: boolean;
    update: () => void;
  }

  export interface Graph {
    nodes: GraphNode[];
    edges: GraphEdge[];
  }

  export interface GraphCanvasRef {
    forceUpdate: () => void;
    resetCamera: () => void;
    zoomToFit: (options?: { duration?: number }) => void;
    centerGraph: (options?: { duration?: number }) => void;
    getCamera: () => Camera;
    getControls: () => Controls;
    getGraph: () => Graph;
    getNodes: () => GraphNode[];
    getEdges: () => GraphEdge[];
    getNodePosition: (id: string) => { x: number; y: number; z: number } | null;
    setNodePosition: (id: string, position: { x: number; y: number; z: number }) => void;
  }

  /**
   * Lasso selection types - documented in Reagraph but missing from official types
   * @see https://reagraph.dev/docs/advanced/Selection
   */
  export type LassoType = 'node' | 'path' | 'none';

  export interface LassoSelection {
    nodes: string[];
    edges: string[];
  }

  /**
   * Context menu callback data
   * The 'data' property contains the clicked node or edge
   */
  export interface ContextMenuData<T = GraphNode | GraphEdge> {
    data: T;
    onClose: () => void;
    additional?: {
      collapsed?: boolean;
      [key: string]: unknown;
    };
  }

  export interface LayoutOverrides {
    linkDistance?: number;
    nodeStrength?: number;
    edgeStrength?: number;
    iterations?: number;
    [key: string]: unknown;
  }

  export interface GraphCanvasProps {
    // Core props
    nodes: GraphNode[];
    edges: GraphEdge[];
    layoutType?: 
      | 'forceDirected2d'
      | 'circular2d'
      | 'treeTd2d'
      | 'treeLr2d'
      | 'radialOut2d'
      | 'forceatlas2';
    layoutOverrides?: LayoutOverrides;
    
    // Selection props
    selections?: { nodes: GraphNode[]; edges: GraphEdge[] };
    onNodeClick?: (node: GraphNode) => void;
    onCanvasClick?: (event?: MouseEvent) => void;
    
    // Lasso selection (undocumented in types but exists in library)
    lassoType?: LassoType;
    onLasso?: (selection: LassoSelection) => void;
    onLassoEnd?: (selection: LassoSelection) => void;
    
    // Styling props
    nodeColor?: string | ((node: GraphNode) => string);
    nodeSize?: number | ((node: GraphNode) => number);
    nodeLabel?: string | ((node: GraphNode) => string);
    nodeLabelColor?: string | ((node: GraphNode) => string);
    nodeOutline?: { color: string; width: number } | ((node: GraphNode) => { color: string; width: number });
    
    // Edge styling
    edgeColor?: string | ((edge: GraphEdge) => string);
    edgeWidth?: number | ((edge: GraphEdge) => number);
    edgeLabel?: string | ((edge: GraphEdge) => string);
    edgeLabelColor?: string | ((edge: GraphEdge) => string);
    edgeStyle?: 'straight' | 'curved' | 'elbow';
    
    // Interaction props
    draggable?: boolean;
    animated?: boolean;
    cameraMode?: 'pan' | 'rotate';
    
    // Sizing strategy
    sizingType?: 'centrality' | 'pageRank' | 'attribute';
    sizingAttribute?: string;
    minNodeSize?: number;
    maxNodeSize?: number;
    
    // Clustering
    clusterAttribute?: string;
    
    // Labels
    labelType?: 'all' | 'auto' | 'none';
    
    // Position handling
    getNodePosition?: (id: string, context?: { drags?: Record<string, { position: { x: number; y: number; z: number } }> }) => { x: number; y: number; z: number } | null;
    
    // Events
    onNodeHover?: (node: GraphNode | null) => void;
    onNodeDragStart?: (node: GraphNode) => void;
    onNodeDrag?: (node: GraphNode, position: { x: number; y: number; z: number }) => void;
    onNodeDragEnd?: (node: GraphNode, position: { x: number; y: number; z: number }) => void;
    onEdgeClick?: (edge: GraphEdge) => void;
    onEdgeHover?: (edge: GraphEdge | null) => void;
    onClusterClick?: (cluster: { id: string; nodes: GraphNode[] }) => void;
    onClusterHover?: (cluster: { id: string; nodes: GraphNode[] } | null) => void;
    onClusterDragStart?: (cluster: { id: string; nodes: GraphNode[] }) => void;
    onClusterDrag?: (cluster: { id: string; nodes: GraphNode[] }, position: { x: number; y: number; z: number }) => void;
    onClusterDragEnd?: (cluster: { id: string; nodes: GraphNode[] }, position: { x: number; y: number; z: number }) => void;
    
    // Context menu (undocumented in types but exists in library)
    contextMenu?: (data: ContextMenuData<GraphNode | GraphEdge>) => React.ReactElement | null;
    
    // Other props
    ref?: RefObject<GraphCanvasRef>;
    aggregateEdges?: boolean;
    theme?: {
      canvas?: { background?: string };
      node?: { fill?: string; stroke?: string };
      edge?: { fill?: string; stroke?: string };
      cluster?: { fill?: string; stroke?: string };
      [key: string]: unknown;
    };
    backgroundColor?: string;
    children?: ReactNode;
  }

  export interface UseSelectionOptions {
    ref: RefObject<GraphCanvasRef>;
    nodes: GraphNode[];
    edges: GraphEdge[];
    multiSelect?: boolean;
    onSelectionChange?: (selection: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  }

  export interface UseSelectionResult {
    selections: { nodes: GraphNode[]; edges: GraphEdge[] };
    onNodeClick: (node: GraphNode) => void;
    onEdgeClick: (edge: GraphEdge) => void;
    onCanvasClick: () => void;
    selectAll: () => void;
    clearSelection: () => void;
    setSelection: (selection: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  }

  export function useSelection(options: UseSelectionOptions): UseSelectionResult;

  export const GraphCanvas: React.ForwardRefExoticComponent<GraphCanvasProps & React.RefAttributes<GraphCanvasRef>>;
}

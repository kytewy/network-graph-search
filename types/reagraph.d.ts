declare module 'reagraph' {
  import { ReactNode, RefObject } from 'react';

  export interface GraphNode {
    id: string;
    label?: string;
    data?: any;
    [key: string]: any;
  }

  export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    data?: any;
    [key: string]: any;
  }

  export interface GraphCanvasRef {
    forceUpdate: () => void;
    resetCamera: () => void;
    zoomToFit: (options?: { duration?: number }) => void;
    centerGraph: (options?: { duration?: number }) => void;
    getCamera: () => any;
    getControls: () => any;
    getGraph: () => any;
    getNodes: () => GraphNode[];
    getEdges: () => GraphEdge[];
    getNodePosition: (id: string) => { x: number; y: number; z: number } | null;
    setNodePosition: (id: string, position: { x: number; y: number; z: number }) => void;
  }

  export interface GraphCanvasProps {
    // Core props
    nodes: GraphNode[];
    edges: GraphEdge[];
    layoutType?: 'forceDirected2d' | 'forceDirected3d' | 'hierarchical' | 'radial' | 'forceAtlas2' | 'noOverlap';
    layoutOverrides?: any;
    
    // Selection props
    selections?: { nodes: GraphNode[]; edges: GraphEdge[] };
    onNodeClick?: (node: GraphNode) => void;
    onCanvasClick?: () => void;
    
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
    onClusterClick?: (cluster: any) => void;
    onClusterHover?: (cluster: any | null) => void;
    onClusterDragStart?: (cluster: any) => void;
    onClusterDrag?: (cluster: any, position: { x: number; y: number; z: number }) => void;
    onClusterDragEnd?: (cluster: any, position: { x: number; y: number; z: number }) => void;
    
    // Other props
    ref?: RefObject<GraphCanvasRef>;
    aggregateEdges?: boolean;
    theme?: any;
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

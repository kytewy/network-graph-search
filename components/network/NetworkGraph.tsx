'use client';

import { useRef, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef } from 'reagraph';
import { useSelection } from 'reagraph';
import { useAppStore } from '@/lib/stores/app-state';

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
  const [layoutType, setLayoutType] = useState<LayoutType>('forceDirected2d');
  const graphRef = useRef<GraphCanvasRef | null>(null);

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
      return { selections: [], onNodeClick: () => {}, onCanvasClick: () => {} };
    }

    return {
      ref: graphRef,
      nodes: graphNodes,
      edges: graphEdges,
    };
  }, [graphNodes, graphEdges]);

  // Selection handling
  const { selections, onNodeClick, onCanvasClick } =
    useSelection(selectionConfig);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Network Graph: {graphNodes.length} nodes, {graphEdges.length} edges
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Layout:</span>
          <select
            className="border rounded p-1 text-sm"
            value={layoutType}
            onChange={(e) => setLayoutType(e.target.value as LayoutType)}>
            <option value="forceDirected2d">Force Directed 2D</option>
            <option value="forceDirected3d">Force Directed 3D</option>
            <option value="radial">Radial</option>
            <option value="radialOut2d">Radial Out</option>
            <option value="concentric2d">Concentric</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="forceAtlas2">Force Atlas 2</option>
            <option value="noOverlap">No Overlap</option>
          </select>
        </div>
      </div>

      <div className="h-[500px] w-full border rounded bg-gray-50 overflow-hidden relative">
        {graphNodes.length > 0 ? (
          <div className="absolute inset-0">
            <GraphCanvas
              ref={graphRef}
              nodes={graphNodes}
              edges={graphEdges}
              layoutType={layoutType}
              layoutOverrides={{
                linkDistance: 80,
                nodeStrength: -250,
                gravity: 0.5,
              }}
              selections={selections || []}
              onNodeClick={onNodeClick}
              onCanvasClick={onCanvasClick}
              sizingType="attribute"
              sizingAttribute="score"
              minNodeSize={4}
              maxNodeSize={16}
              labelType="auto"
              edgeStyle="curved"
              animated={false} // Disable animation initially to prevent errors
              cameraMode="pan"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No graph data available. Try a different search query.
          </div>
        )}
      </div>
    </div>
  );
}

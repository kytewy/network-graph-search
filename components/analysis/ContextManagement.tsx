'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useContextStore } from '@/lib/stores/context-store';

interface Node {
  id: string;
  label: string;
  summary?: string;
  content?: string;
  type?: string;
  continent?: string;
  country?: string;
  sourceType?: string;
  size?: number;
  color?: string;
  similarity?: number;
  stateProvince?: string;
}

interface SelectedNodesSummary {
  nodes: Node[];
  allSelectedNodes: Node[];
  count: number;
  types: string[];
  avgSize: number;
  totalConnections: number;
  internalConnections: number;
  externalConnections: number;
  textAnalysis: {
    commonWords: { word: string; count: number }[];
    themes: string[];
    summary: string;
  };
  themeAnalysis: {
    themes: {
      name: string;
      keywords: string[];
      nodes: (Node & { relevanceScore: number; matchedKeywords: string[] })[];
      score: number;
    }[];
  };
}

interface ContextManagementProps {
  rightPanelExpanded: boolean;
}

export default function ContextManagement({
  rightPanelExpanded,
}: ContextManagementProps) {
  const showActiveNodes = useUIStore((state) => state.showActiveNodes);
  const setShowActiveNodes = useUIStore((state) => state.setShowActiveNodes);
  
  // Get context nodes from context store
  const contextNodes = useContextStore((state) => state.contextNodes);
  const removeNodeFromContext = useContextStore((state) => state.removeNodeFromContext);
  
  // Create a simple summary object for the context nodes
  const contextSummary = {
    nodes: contextNodes,
    allSelectedNodes: contextNodes,
    count: contextNodes.length,
  };

  return (
    <div className={rightPanelExpanded ? 'space-y-4' : 'space-y-4'}>
      <h4 className="text-lg font-semibold text-sidebar-foreground border-b border-sidebar-border pb-2">
        Context Management
      </h4>

      <div className={rightPanelExpanded ? 'flex gap-4' : 'space-y-4'}>
        {/* Character Context Limit */}
        <div
          className={`bg-muted/20 rounded p-3 ${
            rightPanelExpanded ? 'flex-1' : ''
          }`}>
          <div className="text-sm font-medium text-sidebar-foreground/70">
            Character Limit:{' '}
            {contextNodes
              .reduce(
                (total: number, node: Node) => total + (node.content?.length || 0),
                0
              )
              .toLocaleString()}
            /20,000
          </div>
        </div>

        {/* Selected Nodes */}
        <div
          className={`space-y-2 ${rightPanelExpanded ? 'flex-1' : ''}`}>
          <button
            onClick={() => setShowActiveNodes(!showActiveNodes)}
            className="w-full flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors">
            <Label className="text-sm font-medium text-sidebar-foreground/70">
              Selected Nodes ({contextSummary.count})
            </Label>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showActiveNodes ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showActiveNodes && (
            <div className="bg-muted/20 rounded p-2 max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-muted-foreground/20">
                    <th className="text-left py-1 font-medium text-muted-foreground">
                      Node
                    </th>
                    <th className="text-right py-1 font-medium text-muted-foreground">
                      Chars
                    </th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {contextSummary.allSelectedNodes.map((node: Node) => (
                    <tr key={node.id} className="hover:bg-muted/30">
                      <td className="py-1 pr-2 truncate max-w-[200px]">
                        <span className="font-medium">
                          {node.label}
                        </span>
                      </td>
                      <td className="py-1 pr-2 text-right text-muted-foreground/60">
                        {(node.content?.length || 0).toLocaleString()}
                      </td>
                      <td className="py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeNodeFromContext(node.id)
                          }
                          className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive">
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

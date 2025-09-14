'use client';

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useLayoutStore } from '@/lib/stores/layout-store';
import { useUIStore } from '@/lib/stores/ui-store';

interface LayoutControlsProps {
  reorganizeLayoutRef: React.MutableRefObject<(() => void) | null>;
  arrangeAsTreeRef: React.MutableRefObject<(() => void) | null>;
  hasApiKey: boolean;
  onLayoutChange?: (layout: "forceDirected" | "concentric" | "radial") => void;
  currentLayout?: "forceDirected" | "concentric" | "radial";
}

export default function LayoutControls({
  reorganizeLayoutRef,
  arrangeAsTreeRef,
  hasApiKey,
  onLayoutChange,
  currentLayout = "forceDirected",
}: LayoutControlsProps) {
  // Layout store
  const showLabels = useLayoutStore((state) => state.showLabels);
  const colorMode = useLayoutStore((state) => state.colorMode);
  const nodeSizeMode = useLayoutStore((state) => state.nodeSizeMode);
  const setShowLabels = useLayoutStore((state) => state.setShowLabels);
  const setColorMode = useLayoutStore((state) => state.setColorMode);
  const setNodeSizeMode = useLayoutStore((state) => state.setNodeSizeMode);

  // UI store
  const apiKey = useUIStore((state) => state.apiKey);
  const setApiKey = useUIStore((state) => state.setApiKey);

  return (
    <div className="rounded-lg p-4 space-y-4 bg-white">
      <Label className="text-sidebar-foreground font-medium text-base">
        Layout & Meta
      </Label>

      {/* Layout controls */}
      <div className="space-y-2">
        <div className="flex items-center">
          <Label className="text-sm text-sidebar-foreground/70 mr-2">
            Layout:
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentLayout}
            onChange={(e) => {
              const newLayout = e.target.value as "forceDirected" | "concentric" | "radial";
              if (newLayout === "radial" || newLayout === "concentric") {
                reorganizeLayoutRef.current?.();
              } else if (newLayout === "forceDirected") {
                reorganizeLayoutRef.current?.();
              }
              onLayoutChange?.(newLayout);
            }}
            className="flex-1 h-9 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground">
            <option value="forceDirected">Force-Directed</option>
            <option value="concentric">Concentric</option>
            <option value="radial">Radial</option>
          </select>
        </div>
        <div className="text-xs text-gray-500 mt-1 italic">
          {currentLayout === "forceDirected" && "Show me everything and how it relates. Uses physics simulation for natural spacing."}
          {currentLayout === "concentric" && "Show me by importance level. Arranges nodes in concentric circles based on level property."}
          {currentLayout === "radial" && "Show me everything related to THIS topic. Arranges nodes radiating outward from central points."}
        </div>
      </div>

      {/* Color by */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">
          Color by:
        </Label>
        <select
          value={colorMode}
          onChange={(e) =>
            setColorMode(
              e.target.value as
                | 'sourceType'
                | 'continent'
                | 'similarityRange'
                | 'documentType'
                | 'country'
            )
          }
          className="flex-1 h-8 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground">
          <option value="sourceType">Source Type</option>
          <option value="continent">Continent</option>
          <option value="similarityRange">Similarity Range</option>
          <option value="documentType">Document Type</option>
          <option value="country">Country</option>
        </select>
      </div>

      {/* Size by */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">
          Size by:
        </Label>
        <select
          value={nodeSizeMode}
          onChange={(e) =>
            setNodeSizeMode(
              e.target.value as
                | 'none'
                | 'contentLength'
                | 'summaryLength'
                | 'similarity'
            )
          }
          className="flex-1 h-8 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground">
          <option value="none">None</option>
          <option value="contentLength">Content Length</option>
          <option value="summaryLength">Summary Length</option>
          <option value="similarity">Similarity</option>
        </select>
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showLabels ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            <Label htmlFor="show-labels" className="text-sm">
              Show Labels
            </Label>
          </div>
          <Switch
            id="show-labels"
            checked={showLabels}
            onCheckedChange={setShowLabels}
          />
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-gray-200">
        <Label className="text-sidebar-foreground font-medium text-sm">
          AI Configuration
        </Label>
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs text-gray-600">
            OpenAI API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="text-xs bg-sidebar-accent/10 border-sidebar-border"
          />
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-gray-500">
              {hasApiKey ? 'Connected' : 'No API key'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

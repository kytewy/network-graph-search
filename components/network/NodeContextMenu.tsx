'use client';

import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DocumentOverlay, { nodeToReadingItem } from './DocumentOverlay';
import { Z_INDEX } from '@/lib/constants/graph-config';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useNodeContextOperations } from '@/hooks/use-node-context-operations';
import type { Node } from '@/lib/types/node';

/**
 * NodeContextMenu Component
 * 
 * Context menu that appears when right-clicking a node in the graph.
 * Provides actions like "Add to Context", "Reading Mode", and "Open Link".
 * 
 * @example
 * ```tsx
 * <GraphCanvas
 *   contextMenu={({ data, onClose }) => (
 *     <NodeContextMenu node={data} onClose={onClose} />
 *   )}
 * />
 * ```
 */

interface NodeContextMenuProps {
  node: Node;
  onClose: () => void;
  className?: string;
}

export function NodeContextMenu({
  node,
  onClose,
  className,
}: NodeContextMenuProps) {
  const [showReadingMode, setShowReadingMode] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Use reusable hooks
  useClickOutside(modalRef, onClose);
  const { isInContext, addToContext, toggleContext } = useNodeContextOperations(node);
  
  // Open reading mode
  const handleOpenReadingMode = useCallback(() => {
    setShowReadingMode(true);
  }, []);

  if (showReadingMode) {
    // Use the helper function to transform Node → ReadingItem
    const readingItem = nodeToReadingItem(node);
    
    return (
      <DocumentOverlay 
        document={readingItem}
        onClose={() => {
          setShowReadingMode(false);
        }}
        isInContext={isInContext}
        onToggleContext={toggleContext}
      />
    );
  }
  
  // Otherwise, show the context menu
  return (
    <div 
      ref={modalRef}
      className={`fixed bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col ${className || ''}`}
      style={{
        zIndex: Z_INDEX.contextMenu,
        width: '320px',
        maxHeight: '400px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Header with close button */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h2 className="text-base font-medium text-gray-800">{node.label}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          {node.summary && node.summary.length > 280 
            ? `${node.summary.substring(0, 280)}...` 
            : node.summary}
        </p>
      </div>

      {/* Footer with buttons */}
      <div className="flex flex-col border-t border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 py-2 text-sm ${
              isInContext 
                ? 'text-white bg-green-600 hover:bg-green-700' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
            onClick={toggleContext}
          >
            {isInContext ? 'Remove from Context' : 'Add to Context'}
          </button>
          <button
            className={`flex-1 py-2 text-sm ${!node.url ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'} transition-colors border-l border-gray-200`}
            onClick={() => {
              if (node.url) {
                window.open(node.url, '_blank', 'noopener,noreferrer');
              }
            }}
            disabled={!node.url}
            title={!node.url ? "No link provided" : "Open link in new tab"}
          >
            Open Link
          </button>
        </div>
        <Button 
          variant="secondary" 
          className="w-full rounded-none border-t border-gray-200"
          onClick={handleOpenReadingMode}
        >
          Reading Mode
        </Button>
      </div>
    </div>
  );
}

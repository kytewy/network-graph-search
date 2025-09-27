"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useContextStore } from "@/lib/stores/context-store"
import { toast } from "sonner"
import DocumentOverlay from "./DocumentOverlay"

// Import NodeTooltip and NodeModal from NodeComponents
import { NodeTooltip, NodeModal } from './NodeComponents'

// Shared Node interface
export interface Node {
  id: string
  label: string
  type: string
  size: number
  color: string
  summary: string // Brief description for tooltip
  content: string // Full article content for modal
  similarity?: number
  url?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  sourceType?: string
  continent?: string
  country?: string
}

// NodeModal Component for use with reagraph's contextMenu
interface NodeModalProps {
  node: Node
  onClose: () => void
  onNodeSelection?: (nodeIds: string[]) => void
  className?: string
  selectedNodes?: string[]
  expandedNodes?: string[]
  onNodeExpand?: (nodeId: string) => void
}

export function NodeContextMenu({
  node,
  onClose,
  onNodeSelection,
  selectedNodes = [],
  expandedNodes = [],
  onNodeExpand,
  className,
}: NodeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [showReadingMode, setShowReadingMode] = useState(false)
  const [isInContext, setIsInContext] = useState(false)

  // Check if node is in context when component mounts
  useEffect(() => {
    const contextNodes = useContextStore.getState().contextNodes;
    setIsInContext(contextNodes.some((contextNode) => contextNode.id === node.id));
  }, [node.id])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Element)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Add node to context
  const handleAddToContext = () => {
    const addNodeToContext = useContextStore.getState().addNodesToContext;
    addNodeToContext([node]);
    setIsInContext(true);
    
    toast.success(`Added "${node.label}" to context`, {
      description: "Node added to Context Management panel",
      duration: 2000
    });
  }
  
  // Toggle context status (used in reading mode)
  const handleToggleContext = () => {
    const contextStore = useContextStore.getState();
    
    if (isInContext) {
      // Remove from context
      contextStore.removeNodeFromContext(node.id);
      setIsInContext(false);
      toast.info(`Removed "${node.label}" from context`);
    } else {
      // Add to context
      contextStore.addNodesToContext([node]);
      setIsInContext(true);
      toast.success(`Added "${node.label}" to context`);
    }
  }
  
  // Open reading mode
  const handleOpenReadingMode = () => {
    setShowReadingMode(true);
  }

  // If reading mode is active, show the document overlay
// Otherwise, show the context menu

  // If reading mode is active, show the document overlay directly
  if (showReadingMode) {
    const readingItem = {
      id: node.id,
      title: node.label,
      description: node.summary || "",
      content: node.content || "",
      status: "unread" as const
    };
    
    
    // Return the DocumentOverlay component directly
    return (
      <DocumentOverlay 
        document={readingItem}
        onClose={() => {
          setShowReadingMode(false);
        }}
        isInContext={isInContext}
        onToggleContext={handleToggleContext}
      />
    );
  }
  
  // Otherwise, show the context menu
  return (
        <div 
          ref={modalRef}
          className={`fixed bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col ${className || ''}`}
          style={{
            zIndex: 1000,
            width: "320px",
            maxHeight: "400px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
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

      {/* Content section without metadata */}

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
            className="flex-1 py-2 text-sm text-white bg-purple-500 hover:bg-purple-600 transition-colors"
            onClick={handleAddToContext}
          >
            Add to Context
          </button>
          <button
            className="flex-1 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border-l border-gray-200"
            onClick={() => window.open(node.url || "https://www.google.com", "_blank")}
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
  )
}

// Export the original NodeTooltip and NodeModal for backward compatibility
export { NodeTooltip, NodeModal }

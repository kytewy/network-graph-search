/**
 * useNodeContextOperations Hook
 * 
 * Reusable hook for managing node context operations (add/remove/toggle).
 * Handles interaction with the context store and provides toast notifications.
 * 
 * @example
 * ```tsx
 * const { isInContext, addToContext, removeFromContext, toggleContext } = 
 *   useNodeContextOperations(node);
 * 
 * <button onClick={addToContext}>Add to Context</button>
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useContextStore } from '@/lib/stores/context-store';
import { toast } from 'sonner';
import type { Node } from '@/lib/stores/app-state';

/**
 * Hook return type
 */
interface UseNodeContextOperationsReturn {
  /** Whether the node is currently in context */
  isInContext: boolean;
  /** Add the node to context with toast notification */
  addToContext: () => void;
  /** Remove the node from context with toast notification */
  removeFromContext: () => void;
  /** Toggle the node's context status */
  toggleContext: () => void;
}

/**
 * Hook for managing a single node's context operations
 * 
 * @param node - The node to manage
 * @param options - Optional configuration
 * @returns Context operations and state
 */
export function useNodeContextOperations(
  node: Node | null,
  options: {
    /** Show toast notifications (default: true) */
    showToast?: boolean;
    /** Custom toast messages */
    toastMessages?: {
      added?: string;
      removed?: string;
    };
  } = {}
): UseNodeContextOperationsReturn {
  const { showToast = true, toastMessages = {} } = options;
  
  const [isInContext, setIsInContext] = useState(false);
  
  // Get context store actions
  const contextNodes = useContextStore((state) => state.contextNodes);
  const addNodesToContext = useContextStore((state) => state.addNodesToContext);
  const removeNodeFromContext = useContextStore((state) => state.removeNodeFromContext);
  
  // Update isInContext when context changes
  useEffect(() => {
    if (!node) {
      setIsInContext(false);
      return;
    }
    
    setIsInContext(contextNodes.some((contextNode) => contextNode.id === node.id));
  }, [node, contextNodes]);
  
  // Add node to context
  const addToContext = useCallback(() => {
    if (!node) return;
    
    addNodesToContext([node]);
    setIsInContext(true);
    
    if (showToast) {
      const message = toastMessages.added || `Added "${node.label}" to context`;
      toast.success(message, {
        description: 'Node added to Context Management panel',
        duration: 2000,
      });
    }
  }, [node, addNodesToContext, showToast, toastMessages.added]);
  
  // Remove node from context
  const removeFromContext = useCallback(() => {
    if (!node) return;
    
    removeNodeFromContext(node.id);
    setIsInContext(false);
    
    if (showToast) {
      const message = toastMessages.removed || `Removed "${node.label}" from context`;
      toast.info(message, {
        duration: 2000,
      });
    }
  }, [node, removeNodeFromContext, showToast, toastMessages.removed]);
  
  // Toggle context status
  const toggleContext = useCallback(() => {
    if (isInContext) {
      removeFromContext();
    } else {
      addToContext();
    }
  }, [isInContext, addToContext, removeFromContext]);
  
  return {
    isInContext,
    addToContext,
    removeFromContext,
    toggleContext,
  };
}

/**
 * Hook for managing multiple nodes' context operations
 * Useful for bulk operations like lasso selection
 * 
 * @param nodes - Array of nodes to manage
 * @returns Bulk context operations
 */
export function useMultiNodeContextOperations(nodes: Node[]) {
  const addNodesToContext = useContextStore((state) => state.addNodesToContext);
  
  const addAllToContext = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Ensure all nodes have content
    const nodesWithContent = nodes.map((node) => ({
      ...node,
      content: node.content || node.summary || `No content available for ${node.label}`,
    }));
    
    addNodesToContext(nodesWithContent);
    
    toast.success(
      `Added ${nodes.length} node${nodes.length > 1 ? 's' : ''} to context`,
      {
        description: 'Node content is now available in the Context Management panel',
        duration: 3000,
      }
    );
  }, [nodes, addNodesToContext]);
  
  return {
    addAllToContext,
    nodeCount: nodes.length,
  };
}

# Network Graph Components

This directory contains components for visualizing and interacting with network graphs using Reagraph.

## Component Architecture

### Core Components

- **`NetworkGraph.tsx`**: Main entry point that wraps `NetworkGraphCanvas` with the provider
- **`NetworkGraphCanvas.tsx`**: Renders the actual graph visualization using Reagraph
- **`NodeContextMenu.tsx`**: Context menu that appears when right-clicking a node
- **`LassoSelectionMenu.tsx`**: UI for interacting with multiple selected nodes
- **`DocumentOverlay.tsx`**: Displays detailed information about a selected node (reading mode)

### Utility & Supporting Files

- **`lib/types/node.ts`**: Shared Node type definition used across the application
- **`lib/utils/node-colors.ts`**: Node color calculation utilities (5 modes)
- **`lib/utils/node-sizing.ts`**: Node size calculation utilities (3 modes)
- **`lib/utils/layout-mappers.ts`**: Layout type mapping and conversion utilities
**Graph Hooks:**
- **`hooks/use-graph-data.ts`**: Hook for transforming nodes/edges to Reagraph format
- **`hooks/use-graph-visualization-settings.ts`**: Hook for visual settings (labels, colors, sizes, clusters)
- **`hooks/use-graph-layout.ts`**: Hook for layout management with cluster validation
- **`hooks/use-graph-selection.ts`**: Hook for Reagraph selection state and click handling
- **`hooks/use-graph-coordination.ts`**: Hook for coordinating refs and multi-system interactions
- **`hooks/use-lasso-selection.ts`**: Hook for managing lasso multi-node selection state

**Analysis & Context Hooks:**
- **`hooks/use-analysis-chat.ts`**: Hook for AI-powered chat analysis with context
- **`hooks/use-selected-nodes-analysis.ts`**: Hook for analyzing selected graph nodes
- **`hooks/use-node-context-operations.ts`**: Hook for managing node context operations
- **`hooks/use-node-filtering.ts`**: Hook for filtering nodes based on criteria

**Search & Similarity Hooks:**
- **`hooks/use-search.ts`**: Hook for search functionality
- **`hooks/use-similarity-calculation.ts`**: Hook for calculating node similarity

**Utility Hooks:**
- **`hooks/use-click-outside.ts`**: Reusable hook for detecting clicks outside elements

## Data Flow

```
┌─────────────────────────┐
│ NetworkGraphProvider    │
│ (network-graph-context) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ NetworkGraph            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ NetworkGraphCanvas      │◄────┐
└───────────┬─────────────┘     │
            │                   │
            ▼                   │
┌─────────────────────────┐     │
│ GraphCanvas (Reagraph)  │     │
└───────────┬─────────────┘     │
            │                   │
            ▼                   │
┌─────────────────────────┐     │
│ LassoSelectionMenu      │     │
└─────────────────────────┘     │
                                │
┌─────────────────────────┐     │
│ VisualizationControls   │─────┘
└─────────────────────────┘
```

## State Management

The network graph uses a combination of custom hooks, React Context, and Zustand stores:

### **Custom Hooks** (Business Logic)
Focused hooks that handle specific responsibilities:

1. **`use-graph-data.ts`** (~120 lines)
   - Transforms nodes/edges to Reagraph format
   - Calculates node colors based on mode (5 color schemes)
   - Calculates node sizes based on mode (3 sizing strategies)

2. **`use-graph-visualization-settings.ts`** (97 lines)
   - Manages visual settings (labels, colors, sizes, clusters)
   - Direct access to app store settings
   - Provides setters for all visual options

3. **`use-graph-layout.ts`** (110 lines)
   - Layout type management with cluster validation
   - Auto-resets cluster mode for non-force-directed layouts
   - Syncs with network store

4. **`use-graph-selection.ts`** (159 lines)
   - Reagraph selection state and click handling
   - Configures useSelection hook with hotkeys (Ctrl+A, Esc)
   - Tracks currently selected node for detail views

5. **`use-lasso-selection.ts`** (148 lines)
   - Multi-node lasso selection state
   - Lasso menu positioning and visibility
   - Selected node IDs tracking

6. **`use-graph-coordination.ts`** (156 lines)
   - Coordinates interactions between multiple systems
   - Manages refs (graphRef, nodePositionsRef)
   - Handles "send to context" with toast notifications
   - Cleanup across lasso + selection + store

### **NetworkGraphContext** (Pure Composition)
Context now purely composes hooks (~295 lines, down from 473):
- Integrates 6 hooks into unified API
- No business logic, only composition
- Minimal state management
- Provides error boundary

### **Zustand Stores** (Persistent State)
- `networkStore`: Core graph data (nodes, edges)
- `filterStore`: Filter criteria
- `appStore`: Global app settings

## Layout Types

The graph supports three main layout types:

1. **Force Directed (forceDirected2d)**
   - "Show me everything and how it relates"
   - Uses physics simulation for natural spacing

2. **Concentric (concentric2d)**
   - "Show me by importance level"
   - Arranges nodes in concentric circles
   - Requires 'level' property for optimal results

3. **Radial (radialOut2d)**
   - "Show me everything related to THIS topic"
   - Arranges nodes radiating outward from central points

## Node Interface

The Node type is defined in `lib/types/node.ts` and represents a UI-enhanced node with display properties:

```typescript
interface Node {
  // Core properties (from app-state)
  id: string;
  label: string;
  type: string;
  summary: string;      // Brief description for tooltip
  content: string;      // Full article content for modal
  
  // Visual properties (added for display)
  size: number;         // Calculated by node-sizing utils
  color: string;        // Calculated by node-colors utils
  
  // Optional metadata
  similarity?: number;  // Search relevance score
  url?: string;         // Link to source document
  
  // Position properties (for graph layout)
  x?: number;
  y?: number;
  vx?: number;         // Velocity x
  vy?: number;         // Velocity y
  
  // Classification properties
  sourceType?: string; // "regulation", "article", etc.
  continent?: string;
  country?: string;
}
```

## Usage Example

```tsx
import { NetworkGraph } from '@/components/network/NetworkGraph';

export default function GraphPage() {
  return (
    <div className="h-screen">
      <NetworkGraph />
    </div>
  );
}
```

## Best Practices

1. **Never modify the NetworkGraphProvider state directly**
   - Always use the provided methods from `useNetworkGraph()`

2. **Use utility functions for node calculations**
   - Import from `lib/utils/node-colors.ts` for color calculations
   - Import from `lib/utils/node-sizing.ts` for size calculations
   - These are pure functions and easy to test

3. **Leverage reusable hooks**
   - Use `useClickOutside` for click-outside detection
   - Use `useNodeContextOperations` for context menu operations
   - Reduces code duplication

4. **Keep heavy computations in the context**
   - Use memoization for expensive operations

5. **Use the error boundary**
   - Wrap graph components with `NetworkGraphErrorBoundary`

6. **Follow Reagraph best practices**
   - See the Reagraph documentation for performance tips
   - Type definitions in `types/reagraph.d.ts` include improvements

## Code Organization

The refactored structure follows these principles:

- **Single Responsibility**: Each file/function has one clear purpose
- **Separation of Concerns**: Business logic separated from UI components
- **DRY (Don't Repeat Yourself)**: Reusable hooks and utilities
- **Type Safety**: Minimal use of `any`, proper TypeScript types throughout

## Hook Usage Examples

### Using Individual Hooks

```tsx
// 1. Graph data transformation
const { graphNodes, graphEdges, getNodeColor, getNodeSize } = useGraphData(
  filteredResults,
  filteredLinks,
  { colorMode: 'continent', nodeSizeMode: 'contentLength' }
);

// 2. Visualization settings
const {
  showLabels,
  colorMode,
  setShowLabels,
  setColorMode
} = useGraphVisualizationSettings();

// 3. Layout management
const { layoutType, handleLayoutChange } = useGraphLayout();

// 4. Selection handling
const {
  selections,
  selectedNode,
  onNodeClick,
  clearSelections
} = useGraphSelection({ graphNodes, graphEdges, graphRef });

// 5. Lasso selection
const {
  lassoSelectedNodes,
  showLassoMenu,
  handleLasso
} = useLassoSelection();

// 6. Coordination
const {
  graphRef,
  handleSendToContext,
  closeLassoMenu
} = useGraphCoordination({
  closeLassoMenuFromHook,
  clearSelections
});
```

### Architecture Improvements (Recent Refactor)

The context was refactored from 473→295 lines by extracting logic into focused hooks:

**Benefits:**
- ✅ Each hook handles one responsibility (SRP)
- ✅ Independently testable units
- ✅ Reduced complexity in context (10+ → 4-5 responsibilities)
- ✅ No unnecessary wrapper functions
- ✅ Simplified dependency tracking (32→20 dependencies)

**Pattern:**
```tsx
// Context composes hooks
const visualSettings = useGraphVisualizationSettings();
const layout = useGraphLayout();
const selection = useGraphSelection({ graphNodes, graphEdges, graphRef });

// Provides unified API
return <NetworkGraphContext.Provider value={{
  ...visualSettings,
  ...layout,
  ...selection,
  // + coordination logic
}} />
```

This pattern makes it easy to:
- Add new hooks without touching existing code
- Test hooks in isolation
- Understand data flow (hook → context → components)

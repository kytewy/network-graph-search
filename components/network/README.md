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
- **`hooks/use-click-outside.ts`**: Reusable hook for detecting clicks outside elements
- **`hooks/use-node-context-operations.ts`**: Hook for managing node context operations

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

The network graph uses a combination of React Context and Zustand stores:

1. **NetworkGraphContext**: Manages temporary UI state like:
   - Current selections
   - Hover state
   - Lasso selection
   - Layout preferences

2. **Zustand Stores**: Handle persistent application state:
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

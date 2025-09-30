# Network Graph Components

This directory contains components for visualizing and interacting with network graphs using Reagraph.

## Component Architecture

### Core Components

- **`NetworkGraph.tsx`**: Main entry point that wraps `NetworkGraphCanvas` with the provider
- **`NetworkGraphCanvas.tsx`**: Renders the actual graph visualization using Reagraph
- **`NodeComponents.tsx`**: Defines the core Node interface and node-related components
- **`LassoSelectionMenu.tsx`**: UI for interacting with multiple selected nodes
- **`DocumentOverlay.tsx`**: Displays detailed information about a selected node

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

```typescript
interface Node {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  summary: string;
  content: string;
  similarity?: number;
  url?: string;
  x?: number;
  y?: number;
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

2. **Keep heavy computations in the context**
   - Use memoization for expensive operations

3. **Use the error boundary**
   - Wrap graph components with `NetworkGraphErrorBoundary`

4. **Follow Reagraph best practices**
   - See the Reagraph documentation for performance tips

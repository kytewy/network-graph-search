# System Architecture

> High-level overview of the Network Graph Search application

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **Reagraph** - Network graph visualization (WebGL powered)
- **TypeScript** - Type safety throughout
- **Tailwind CSS + shadcn/ui** - Modern UI components
- **Zustand** - State management

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Python** - Clustering analysis
- **scikit-learn** - TF-IDF + KMeans clustering
- **Pinecone** - Vector database (optional)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Search    │  │    Filters   │  │   Analysis   │        │
│  │  Interface  │  │    Panel     │  │   Workspace  │        │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           ↓                                 │
│              ┌────────────────────────┐                     │
│              │  Zustand Stores        │                     │
│              │  - app-state           │                     │
│              │  - network-store       │                     │
│              │  - filter-store        │                     │
│              │  - context-store       │                     │
│              └────────────┬───────────┘                     │
│                           ↓                                 │
│              ┌────────────────────────┐                     │
│              │ NetworkGraphContext    │                     │
│              │ - Graph data hooks     │                     │
│              │ - Selection management │                     │
│              │ - Layout coordination  │                     │
│              └────────────┬───────────┘                     │
│                           ↓                                 │
│              ┌────────────────────────┐                     │
│              │   Reagraph Canvas      │                     │
│              │   (3D Force Graph)     │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                     │
│  ┌──────────────────┐        ┌─────────────────────┐        │
│  │  /api/           │        │  /api/              │        │
│  │  vector-search   │        │  cluster-analysis   │        │
│  └────────┬─────────┘        └─────────┬───────────┘        │
│           │                            │                    │
│           ↓                            ↓                    │
│  ┌──────────────────┐        ┌─────────────────────┐        │
│  │   Pinecone       │        │   Python Subprocess │        │
│  │   (Semantic      │        │   (TF-IDF + KMeans) │        │
│  │    Search)       │        │                     │        │
│  └──────────────────┘        └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Why Next.js API Routes instead of Flask?**

- ✅ Easier to take advantage of rapid prototyping, front-end interaction
  is what I am trying to demonstrate

### 2. **Why Reagraph instead of D3.js directly?**

- ✅ React-native API (no DOM manipulation)
- ✅ Built-in physics simulation
- ✅ WebGL rendering for performance
- ✅ TypeScript support out of the box

### 3. **Why TF-IDF + KMeans instead of BERTopic?**

- ✅ Fast (< 2 seconds for 100 documents)
- ✅ Deterministic results
- ✅ No GPU required
- ✅ Predictable resource usage
- ✅ Simple to implement to get user flow

### 4. **Why Zustand instead of Redux?**

- ✅ Less boilerplate
- ✅ No providers needed
- ✅ Simple API
- ✅ Built-in DevTools support

## Data Flow

### Search Flow

```
User Input → SearchInput component
    ↓
performSearch() in app-state
    ↓
/api/vector-search (Pinecone)
    ↓
Update searchResults in store
    ↓
applyFilters() creates filteredResults
    ↓
NetworkGraphContext transforms to Reagraph nodes
    ↓
Graph visualization updates
```

### Clustering Flow

```
User selects nodes → ContextManagement
    ↓
addNodesToContext() in context-store
    ↓
User clicks "Analyze Clusters"
    ↓
/api/cluster-analysis (Python subprocess)
    ↓
TF-IDF vectorization + KMeans clustering
    ↓
applyAiClusters() in NetworkGraphContext
    ↓
Nodes get ai_clusters property
    ↓
Graph re-renders with cluster colors
```

## Component Architecture

### Hook Composition Pattern

The graph visualization uses a **hook composition pattern** to separate concerns:

```tsx
// NetworkGraphContext composes focused hooks
const visualSettings = useGraphVisualizationSettings();
const layout = useGraphLayout();
const selection = useGraphSelection({ graphNodes, graphEdges, graphRef });
const lasso = useLassoSelection();
const coordination = useGraphCoordination({ clearSelections });

// Provides unified API to components
return (
	<NetworkGraphContext.Provider
		value={{
			...visualSettings,
			...layout,
			...selection,
			...lasso,
			...coordination,
		}}
	/>
);
```

**Benefits:**

- Each hook has a single responsibility
- Easy to test hooks independently
- Composable and reusable
- No God components with 500+ lines

### Component Decomposition

**Example: FilterPanel** - Split monolithic component into presentational sub-components:

```
FilterPanel.tsx (coordinator)
├── GeographicFilters.tsx (presentation)
└── SourceTypeFilters.tsx (presentation)
```

**Result:** 63% reduction in main component (300 → 111 lines)

### Core Graph Components

- **`NetworkGraph.tsx`** - Entry point, wraps canvas with provider
- **`NetworkGraphCanvas.tsx`** - Renders Reagraph visualization
- **`VisualizationControls.tsx`** - Layout and color mode controls
- **`LassoSelectionMenu.tsx`** - Multi-node selection interface
- **`ClusteringInterface.tsx`** - AI-powered clustering with collapsible results

### Layout Types

1. **Force Directed** (`forceDirected2d`) - Natural clustering, physics-based
2. **Concentric** (`concentric2d`) - Hierarchical importance levels
3. **Radial** (`radialOut2d`) - Topic-centered exploration

## Performance Considerations

### Graph Rendering

- Uses WebGL for 1000+ node graphs
- Reagraph's force simulation is optimized
- Node positions cached in context

### API Optimization

- Vector search cached in Pinecone
- Clustering runs on-demand only
- No real-time updates (user-triggered)

### State Management

- Selective subscriptions prevent unnecessary re-renders
- Memoized selectors for computed values
- Minimal prop drilling

## Deployment

See [README Quick Start](../README.md#-quick-start) for setup instructions.

### Build & Deploy

```bash
npm run build
npm start
```

## Related Documentation

- **[Main README](../README.md)** - Project overview and quick start
- **[Technical Decisions](./tech-decisions.md)** - Why we chose these technologies
- **[Data Pipeline](./data-pipeline.md)** - Data collection and upload process

---

**Last Updated:** 2025-10-06

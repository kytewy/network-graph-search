# System Architecture

> High-level overview of the Network Graph Search application

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **Reagraph** - Network graph visualization (D3.js powered)
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
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Search    │  │    Filters   │  │   Analysis   │      │
│  │  Interface  │  │    Panel     │  │   Workspace  │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
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
│  ┌──────────────────┐        ┌─────────────────────┐       │
│  │  /api/           │        │  /api/              │       │
│  │  vector-search   │        │  cluster-analysis   │       │
│  └────────┬─────────┘        └─────────┬───────────┘       │
│           │                             │                   │
│           ↓                             ↓                   │
│  ┌──────────────────┐        ┌─────────────────────┐       │
│  │   Pinecone       │        │   Python Subprocess │       │
│  │   (Semantic      │        │   (TF-IDF + KMeans) │       │
│  │    Search)       │        │                     │       │
│  └──────────────────┘        └─────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Why Next.js API Routes instead of Flask?**

- ✅ Single codebase (no separate backend server)
- ✅ Serverless deployment ready
- ✅ TypeScript end-to-end
- ✅ Built-in API optimization

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
- ✅ Good enough for document clustering

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

## Component Organization

See detailed documentation:

- **[State Management](./state-management.md)** - Zustand stores architecture
- **[Components Guide](./components.md)** - Component structure and usage
- **[Data Pipeline](./data-pipeline.md)** - Data scraping and upload scripts

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

### Requirements

- Node.js 18+
- Python 3.9+ (for clustering)
- Pinecone account (optional, for search)

### Environment Variables

```bash
PINECONE_API_KEY=xxx
PINECONE_INDEX_NAME=network-graph
PINECONE_NAMESPACE=default
```

### Build & Deploy

```bash
npm run build
npm start
```

## Future Enhancements

### Nice to Have

- [ ] Query Expansion
- [ ] LLM-powered cluster naming
- [ ] More and different data domains

## Related Documentation

- **Main README** - Project overview and quick start
- **State Management** - Deep dive into Zustand architecture
- **Components** - Component usage and patterns
- **Data Pipeline** - Data collection and upload process

---

**Last Updated:** 2025-10-05

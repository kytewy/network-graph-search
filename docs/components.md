# Component Architecture

> Comprehensive guide to components in the Network Graph Search application

## Directory Structure

```
components/
├── analysis/          # Analysis and clustering components
├── filters/           # Filter UI components
├── network/           # Graph visualization components
├── search/            # Search interface components
└── ui/                # shadcn/ui base components
```

---

## 📊 Network Graph Components

### Core Components

- **`NetworkGraph.tsx`** - Main entry point that wraps `NetworkGraphCanvas` with provider
- **`NetworkGraphCanvas.tsx`** - Renders the actual Reagraph visualization
- **`NodeContextMenu.tsx`** - Right-click context menu for nodes
- **`LassoSelectionMenu.tsx`** - Multi-node selection interface
- **`DocumentOverlay.tsx`** - Detailed node information display
- **`ColorLegend.tsx`** - Visual legend for node colors
- **`VisualizationControls.tsx`** - Layout and display mode controls

### NetworkGraphContext Architecture

The graph uses a **hook composition pattern**:

```tsx
// Context composes focused hooks
const visualSettings = useGraphVisualizationSettings();
const layout = useGraphLayout();
const selection = useGraphSelection({ graphNodes, graphEdges, graphRef });
const lasso = useLassoSelection();
const coordination = useGraphCoordination({ clearSelections });

// Provides unified API
return <NetworkGraphContext.Provider value={{
  ...visualSettings,
  ...layout,
  ...selection,
  ...lasso,
  ...coordination
}} />
```

### Custom Hooks

**Graph Core:**
- `use-graph-data.ts` - Transforms nodes/edges to Reagraph format
- `use-graph-visualization-settings.ts` - Visual settings (labels, colors, sizes, clusters)
- `use-graph-layout.ts` - Layout management with cluster validation
- `use-graph-selection.ts` - Reagraph selection state and click handling
- `use-graph-coordination.ts` - Coordinates refs and multi-system interactions
- `use-lasso-selection.ts` - Multi-node lasso selection state

**Analysis:**
- `use-analysis-chat.ts` - AI-powered chat analysis
- `use-selected-nodes-analysis.ts` - Analyze selected nodes
- `use-node-context-operations.ts` - Context menu operations
- `use-node-filtering.ts` - Node filtering logic

**Utilities:**
- `use-click-outside.ts` - Detect clicks outside elements
- `use-search.ts` - Search functionality
- `use-similarity-calculation.ts` - Node similarity calculation

### Layout Types

1. **Force Directed** (`forceDirected2d`)
   - Physics-based natural spacing
   - Best for exploring relationships
   - Supports clustering visualization

2. **Concentric** (`concentric2d`)
   - Arranges by importance level
   - Requires `level` property on nodes
   - Good for hierarchical views

3. **Radial** (`radialOut2d`)
   - Radiates from central nodes
   - Good for topic-centered exploration

### Usage Example

```tsx
import { NetworkGraphProvider } from '@/lib/contexts/network-graph-context';
import { NetworkGraphCanvas } from '@/components/network/NetworkGraphCanvas';

export default function GraphPage() {
  return (
    <NetworkGraphProvider>
      <div className="h-screen">
        <NetworkGraphCanvas />
      </div>
    </NetworkGraphProvider>
  );
}
```

---

## 🔍 Search Components

### Active Components

**SearchInput.tsx** (69 lines)
- Text input with search button
- Result count control (topK adjustment)
- Loading state management
- Enter key support

**SearchResults.tsx** (49 lines)
- Scrollable results list
- Result count summary
- Similarity scores display

**SimilarityHistogram.tsx**
- Visual distribution of similarity scores
- Interactive range selection
- Filter integration

### Usage

```tsx
import { SearchInput } from '@/components/search/SearchInput';

function Sidebar() {
  return (
    <div>
      <SearchInput />
      <SimilarityHistogram />
      <FilterPanel />
    </div>
  );
}
```

### State Management

All search components use **app-state** store:

```tsx
const query = useAppStore((state) => state.query);
const isLoading = useAppStore((state) => state.isLoading);
const performSearch = useAppStore((state) => state.performSearch);
```

---

## 🎛️ Filter Components

### Component Hierarchy

```
FilterPanel.tsx (111 lines)
├── GeographicFilters.tsx (208 lines)
│   ├── Continent selection
│   ├── Expandable country lists
│   └── Search term highlighting
└── SourceTypeFilters.tsx (42 lines)
    └── Badge-style type filters
```

### FilterPanel (Main Coordinator)

**Responsibilities:**
- Manages local UI state
- Accesses Zustand store
- Delegates rendering to sub-components
- Provides clear filters functionality

**Props:** None (uses stores directly)

### GeographicFilters

**Features:**
- Continent selection with node counts
- Expandable country lists
- Country search highlighting
- Visual feedback for selections

**Props:**
```tsx
interface GeographicFiltersProps {
  availableContinents: string[];
  selectedContinents: Set<string>;
  selectedCountries: Set<string>;
  expandedContinents: Set<string>;
  countrySearchTerm: string;
  filteredResultsCount: number;
  toggleContinent: (continent: string) => void;
  toggleCountry: (country: string) => void;
  toggleExpandedContinent: (continent: string) => void;
  getNodeCountByContinent: (continent: string) => number;
  getNodeCountByCountry: (country: string) => number;
  getCountriesByContinent: (continent: string) => string[];
}
```

### SourceTypeFilters

**Features:**
- Badge-style UI
- Simple toggle interaction
- Visual selection feedback

**Props:**
```tsx
interface SourceTypeFiltersProps {
  sourceTypes: string[];
  selectedSourceTypes: Set<string>;
  toggleSourceType: (type: string) => void;
}
```

### Architecture Benefits

✅ **Component Decomposition** (not hook extraction)
- 63% reduction in main component (300→111 lines)
- Clear separation: coordinator vs presentational
- Each file has one purpose
- Easier to test independently

---

## 🧪 Analysis Components

### ContextManagement.tsx

**Tab-based interface** for analysis workspace:

```tsx
<ContextManagement rightPanelExpanded={boolean} />
```

**Three tabs:**
1. **Nodes** - Selected node details
2. **Analysis** - AI-powered chat analysis
3. **Clustering** - TF-IDF + KMeans clustering

**Features:**
- Responsive design (icon-only on small screens)
- Proper tab navigation with aria-labels
- Border-bottom active indicators
- Hover states

### ClusteringInterface.tsx

**Features:**
- Analyze button with loading state
- Cluster results with executive summary
- Expandable node lists per cluster
- Top terms display
- Persistent results

**Props:**
```tsx
interface ClusteringInterfaceProps {
  contextNodes: Node[];
  rightPanelExpanded: boolean;
}
```

**State Management:**
Uses `context-store` for persistence:
```tsx
const clusterResults = useContextStore((state) => state.clusterResults);
const setClusterResults = useContextStore((state) => state.setClusterResults);
```

### ChatInterface.tsx

**AI-powered analysis:**
- Chat input for natural language queries
- Conversation history
- Context-aware responses
- Loading states

---

## 🎨 UI Components (shadcn/ui)

Base components from shadcn/ui:

- `button.tsx` - Button variants
- `card.tsx` - Card layouts
- `input.tsx` - Form inputs
- `badge.tsx` - Status badges
- `select.tsx` - Dropdown selects
- `tabs.tsx` - Tab navigation
- `toast.tsx` - Notifications

**Usage:**
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card>
  <Button variant="outline">Click Me</Button>
</Card>
```

---

## 🎯 Best Practices

### 1. State Management

```tsx
// ✅ GOOD - Selective subscriptions
const query = useAppStore((state) => state.query);

// ❌ BAD - Re-renders on any change
const store = useAppStore();
```

### 2. Component Composition

```tsx
// ✅ GOOD - Small, focused components
<FilterPanel>
  <GeographicFilters {...props} />
  <SourceTypeFilters {...props} />
</FilterPanel>

// ❌ BAD - Monolithic component
<FilterPanel /> // with 500 lines of mixed logic
```

### 3. Props vs Store

```tsx
// ✅ GOOD - Use stores for global state
const nodes = useAppStore((state) => state.filteredResults);

// ✅ GOOD - Use props for component communication
<GeographicFilters onToggle={handleToggle} />

// ❌ BAD - Prop drilling 5 levels deep
```

### 4. Hook Organization

```tsx
// ✅ GOOD - One responsibility per hook
const { graphNodes, graphEdges } = useGraphData(...);
const { layoutType, handleLayoutChange } = useGraphLayout();

// ❌ BAD - God hook with everything
const { ...everything } = useEverything();
```

---

## 🔄 Data Flow

### Search → Graph Flow

```
User types query
    ↓
SearchInput component
    ↓
performSearch() in app-state
    ↓
/api/vector-search
    ↓
searchResults updated
    ↓
applyFilters() → filteredResults
    ↓
NetworkGraphContext transforms to graphNodes
    ↓
Reagraph renders graph
```

### Filter → Graph Flow

```
User clicks filter
    ↓
FilterPanel toggleContinent()
    ↓
app-state.applyFilters()
    ↓
filteredResults updated
    ↓
useGraphData() transforms
    ↓
Graph re-renders
```

### Clustering Flow

```
User selects nodes
    ↓
addNodesToContext()
    ↓
User clicks "Analyze Clusters"
    ↓
/api/cluster-analysis
    ↓
applyAiClusters() in NetworkGraphContext
    ↓
Nodes get ai_clusters property
    ↓
Graph re-renders with cluster colors
```

---

## 📁 File Locations

```
components/
├── analysis/
│   ├── ChatInterface.tsx
│   ├── ClusteringInterface.tsx
│   └── ContextManagement.tsx
├── filters/
│   ├── FilterPanel.tsx
│   ├── GeographicFilters.tsx
│   └── SourceTypeFilters.tsx
├── network/
│   ├── NetworkGraph.tsx
│   ├── NetworkGraphCanvas.tsx
│   ├── NodeContextMenu.tsx
│   ├── LassoSelectionMenu.tsx
│   ├── DocumentOverlay.tsx
│   ├── ColorLegend.tsx
│   └── VisualizationControls.tsx
├── search/
│   ├── SearchInput.tsx
│   ├── SearchResults.tsx
│   └── SimilarityHistogram.tsx
└── ui/
    └── [shadcn components]

lib/contexts/
└── network-graph-context.tsx

hooks/
├── use-graph-data.ts
├── use-graph-visualization-settings.ts
├── use-graph-layout.ts
├── use-graph-selection.ts
├── use-graph-coordination.ts
├── use-lasso-selection.ts
└── [other hooks...]
```

---

## 🚀 Adding New Components

### Step 1: Determine Category
- Analysis? → `components/analysis/`
- Graph-related? → `components/network/`
- Search? → `components/search/`
- Filter? → `components/filters/`

### Step 2: Check State Needs
- Global state? → Use appropriate Zustand store
- Local state? → `useState` in component
- Shared logic? → Create custom hook

### Step 3: Follow Patterns
- Use TypeScript interfaces for props
- Keep components focused (< 200 lines)
- Extract reusable hooks
- Use shadcn/ui for base UI

---

## 📖 Related Documentation

- **[State Management](./state-management.md)** - Zustand store architecture
- **[Architecture](./ARCHITECTURE.md)** - System design overview
- **[Data Pipeline](./data-pipeline.md)** - Data collection and upload

---

_Last updated: 2025-10-05_

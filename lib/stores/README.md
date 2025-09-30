# Store Architecture

**State management for the Network Graph Search application using Zustand.**

## 📁 Store Files

| Store                       | Size  | Purpose               | Status                   |
| --------------------------- | ----- | --------------------- | ------------------------ |
| **app-state.ts**            | 14KB  | Core app data & logic | ✅ Primary store         |
| **network-store.ts**        | 2.1KB | Graph display state   | ✅ Active                |
| **filter-store.ts**         | 5.5KB | Filter criteria       | ⚠️ Has duplicates        |
| **unified-search-store.ts** | 9.2KB | Search orchestration  | ⚠️ To merge (Phase 2)    |
| **context-store.ts**        | 1KB   | Analysis workspace    | ✅ Active                |
| **ui-store.ts**             | 3.1KB | UI toggles            | ✅ Active (Phase 1 done) |
| **country_map.ts**          | 801B  | Geographic data       | ✅ Data file             |

**Total:** 7 stores (6 state + 1 data)

---

## 🚀 Quick Start

### **Basic Usage**

```tsx
import { useAppStore } from '@/lib/stores/app-state';

function MyComponent() {
	// Read state
	const query = useAppStore((state) => state.query);
	const isLoading = useAppStore((state) => state.isLoading);

	// Get actions
	const performSearch = useAppStore((state) => state.performSearch);

	// Use them
	const handleSearch = () => performSearch(query);

	return (
		<div>
			<input value={query} onChange={(e) => setQuery(e.target.value)} />
			<button onClick={handleSearch} disabled={isLoading}>
				{isLoading ? 'Searching...' : 'Search'}
			</button>
		</div>
	);
}
```

### **Performance Tip: Selective Subscriptions**

```tsx
// ❌ BAD - Component re-renders on ANY state change
const appState = useAppStore();

// ✅ GOOD - Only re-renders when query changes
const query = useAppStore((state) => state.query);
```

---

## 📋 Store Responsibilities

### **1. app-state** - Your Main Store

**When to use:** Search, results, filtering, visualization settings

```tsx
import { useAppStore } from '@/lib/stores/app-state';

// Search
const query = useAppStore((state) => state.query);
const performSearch = useAppStore((state) => state.performSearch);

// Results
const searchResults = useAppStore((state) => state.searchResults);
const filteredResults = useAppStore((state) => state.filteredResults);

// Filtering
const applyFilters = useAppStore((state) => state.applyFilters);
const toggleSimilarityRange = useAppStore(
	(state) => state.toggleSimilarityRange
);

// Visualization
const colorMode = useAppStore((state) => state.colorMode);
const setColorMode = useAppStore((state) => state.setColorMode);
```

---

### **2. network-store** - Graph Display

**When to use:** Graph interactions (selection, highlighting, layout)

```tsx
import { useNetworkStore } from '@/lib/stores/network-store';

// Display nodes (gets from app-state)
const nodes = useNetworkStore((state) => state.nodes);
const links = useNetworkStore((state) => state.links);

// Selection
const selectedNodes = useNetworkStore((state) => state.selectedNodes);
const setSelectedNodes = useNetworkStore((state) => state.setSelectedNodes);

// Highlighting
const highlightedNodes = useNetworkStore((state) => state.highlightedNodes);
const setHighlightedNodes = useNetworkStore(
	(state) => state.setHighlightedNodes
);

// Layout
const layoutType = useNetworkStore((state) => state.layoutType);
const setLayoutType = useNetworkStore((state) => state.setLayoutType);
```

---

### **3. filter-store** - Filter Criteria

**When to use:** Filter UI components (checkboxes, dropdowns)

```tsx
import { useFilterStore } from '@/lib/stores/filter-store';

// Filter selections
const selectedNodeTypes = useFilterStore((state) => state.selectedNodeTypes);
const selectedContinents = useFilterStore((state) => state.selectedContinents);

// Toggle filters
const toggleContinent = useFilterStore((state) => state.toggleContinent);
const toggleCountry = useFilterStore((state) => state.toggleCountry);

// Filter UI state
const expandedContinents = useFilterStore((state) => state.expandedContinents);
const countrySearchTerm = useFilterStore((state) => state.countrySearchTerm);
```

---

### **4. ui-store** - UI Toggles

**When to use:** Panel visibility, show/hide toggles

```tsx
import { useUIStore } from '@/lib/stores/ui-store';

// Panel toggles
const showLabels = useUIStore((state) => state.showLabels);
const setShowLabels = useUIStore((state) => state.setShowLabels);

// Analysis toggles
const showThemeAnalysis = useUIStore((state) => state.showThemeAnalysis);
const collapsedThemes = useUIStore((state) => state.collapsedThemes);

// UI expansions
const histogramExpanded = useUIStore((state) => state.histogramExpanded);
const setHistogramExpanded = useUIStore((state) => state.setHistogramExpanded);
```

---

### **5. context-store** - Analysis Workspace

**When to use:** Managing nodes in analysis context

```tsx
import { useContextStore } from '@/lib/stores/context-store';

// Context nodes
const contextNodes = useContextStore((state) => state.contextNodes);

// Actions
const addNodesToContext = useContextStore((state) => state.addNodesToContext);
const removeNodeFromContext = useContextStore(
	(state) => state.removeNodeFromContext
);
const clearContext = useContextStore((state) => state.clearContext);
```

---

### **6. unified-search-store** - Search Workflow

**When to use:** Vector search operations

```tsx
import { useUnifiedSearchStore } from '@/lib/stores/unified-search-store';

// Search state
const searchTerm = useUnifiedSearchStore((state) => state.searchTerm);
const isSearching = useUnifiedSearchStore((state) => state.isSearching);

// Perform search
const performVectorSearch = useUnifiedSearchStore(
	(state) => state.performVectorSearch
);

// Results
const searchResultNodes = useUnifiedSearchStore(
	(state) => state.searchResultNodes
);
```

⚠️ **Note:** This will be merged into app-state in Phase 2

---

## 🎯 Decision Tree: Which Store?

```
Need to add state? Ask yourself:

├─ Is it search/results/filtering?
│  └─ ✅ app-state
│
├─ Is it graph display/interaction (selection, highlighting)?
│  └─ ✅ network-store
│
├─ Is it filter criteria (user's current selections)?
│  └─ ✅ filter-store
│
├─ Is it UI visibility/toggles (no business logic)?
│  └─ ✅ ui-store
│
└─ Is it analysis workspace?
   └─ ✅ context-store
```

---

## ⚠️ Common Pitfalls

### **1. Don't Create Duplicates**

```tsx
// ❌ BAD - Creating duplicate state
interface MyStore {
	searchTerm: string; // This already exists in app-state!
}

// ✅ GOOD - Check STORE_OWNERSHIP.md first
// Use existing state from app-state
```

### **2. Don't Mix Concerns**

```tsx
// ❌ BAD - UI store with business logic
interface UIState {
	showPanel: boolean; // ✅ OK
	searchResults: Node[]; // ❌ This is business data!
}

// ✅ GOOD - Keep UI pure
interface UIState {
	showPanel: boolean;
	showLabels: boolean;
	collapsedSections: string[];
}
```

### **3. Don't Directly Mutate Other Stores**

```tsx
// ❌ BAD - Direct cross-store mutation
const myAction = () => {
	const otherStore = useOtherStore.getState();
	otherStore.setData(newData); // Tight coupling!
};

// ✅ GOOD - Each store manages its own data
const myAction = () => {
	set({ myData: newData });
	// Let other stores subscribe and react
};
```

---

## 🔄 Data Flow Pattern

```
┌─────────────────────┐
│   User Action       │
│  (Search button)    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   app-state         │
│  performSearch()    │
│  - Calls API        │
│  - Sets results     │
│  - Applies filters  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  network-store      │
│  - Gets data        │
│  - Displays graph   │
└─────────────────────┘
           ↓
┌─────────────────────┐
│   UI Updates        │
│  (Graph renders)    │
└─────────────────────┘
```

**Key Principle:** Data flows DOWN, actions flow UP

---

## 📚 Advanced Patterns

### **Computed Values**

```tsx
// Use selectors for derived state
const filteredNodeCount = useAppStore((state) => state.filteredResults.length);

// Or create a selector function
const selectHighSimilarityNodes = (state) =>
	state.searchResults.filter((node) => node.similarity > 0.8);

const highSimNodes = useAppStore(selectHighSimilarityNodes);
```

### **Actions with Side Effects**

```tsx
// Complex actions live in the store
export const useAppStore = create((set, get) => ({
	performSearch: async (query) => {
		set({ isLoading: true });

		try {
			const results = await fetch('/api/search', {
				body: JSON.stringify({ query }),
			});

			set({
				searchResults: results,
				hasSearched: true,
				searchStatus: `Found ${results.length} results`,
			});

			// Apply filters automatically
			get().applyFilters();
		} catch (error) {
			set({
				error: error.message,
				searchStatus: 'Search failed',
			});
		} finally {
			set({ isLoading: false });
		}
	},
}));
```

### **Store Subscriptions**

```tsx
// Subscribe to store changes outside React
const unsubscribe = useAppStore.subscribe(
	(state) => state.searchResults,
	(results) => {
		console.log('Results changed:', results.length);
	}
);

// Don't forget to cleanup!
unsubscribe();
```

---

## 🐛 Debugging

### **Zustand DevTools**

```tsx
// Already enabled in app-state!
import { devtools } from 'zustand/middleware';

export const useAppStore = create()(
	devtools((set, get) => ({
		// Your store...
	}))
);
```

**Then open Redux DevTools in browser to see:**

- State changes
- Time-travel debugging
- Action history

### **Log State Changes**

```tsx
// Temporary debugging
const MyComponent = () => {
	const state = useAppStore();
	console.log('Current app state:', state);

	return <div>...</div>;
};
```

---

## 📖 Further Reading

- **STORE_OWNERSHIP.md** - Detailed ownership & Phase 2 roadmap
- [Zustand Docs](https://github.com/pmndrs/zustand) - Official documentation
- **Phase 1 Changes** - See git history for recent consolidation

---

## 🚨 Need Help?

**Before adding new state:**

1. Check `STORE_OWNERSHIP.md` - Does it already exist?
2. Check this README - Which store is responsible?
3. Ask: "Is this UI state or business logic?"

**Common Questions:**

- "Where does X state live?" → Check `STORE_OWNERSHIP.md`
- "Can I add Y to Z store?" → Use the decision tree above
- "Why are there duplicates?" → Phase 2 will fix them

---

_Last updated: 2025-09-30 (Phase 1 complete)_

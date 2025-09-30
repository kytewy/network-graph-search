# Store Ownership Guide (Phase 1 Complete)

**Last Updated:** 2025-09-30  
**Status:** Phase 1 consolidation complete ✅

## 📋 Store Responsibilities

### **app-state.ts** - Core Application Data & Logic
**Responsibility:** Single source of truth for search, results, and filtering

**Owns:**
- ✅ Search state (`query`, `isLoading`, `error`, `topK`, `hasSearched`, `searchStatus`)
- ✅ Search results (`searchResults`, `filteredResults`)
- ✅ Links/edges (`links`, `filteredLinks`)
- ✅ Filtering logic (`applyFilters()`, location filters, similarity filters)
- ✅ Visualization settings (`colorMode`, `nodeSizeMode`, `clusterMode`, `showLabels`)
- ✅ UI state (`rightPanelExpanded`)
- ✅ Complex actions (`performSearch()`)

**Size:** 463 lines (14KB)

---

### **network-store.ts** - Graph Display State
**Responsibility:** State for the network graph visualization (separate from data)

**Owns:**
- Display nodes/links (gets from app-state)
- Selection state (`selectedNodes`, `expandedNodes`)
- Highlighting (`highlightedNodes`, `highlightedLinks`)
- Layout type (`layoutType`)

**Size:** 2.1KB

**Note:** Should NOT own data - only display/interaction state

---

### **filter-store.ts** - Filter Criteria
**Responsibility:** User's current filter selections

**Owns:**
- Filter criteria (`selectedNodeTypes`, `selectedContinents`, `selectedCountries`, `selectedSourceTypes`, `deselectedNodeTypes`)
- Filter UI state (`expandedContinents`, `countrySearchTerm`, `minNodeSize`, `maxNodeSize`)
- Search term (`searchTerm`) - ⚠️ **DUPLICATE with unified-search-store**

**Size:** 5.5KB

**⚠️ Future cleanup:** Remove visualization settings (already in app-state)

---

### **unified-search-store.ts** - Search Orchestration
**Responsibility:** Perform vector search and manage search workflow

**Owns:**
- Search parameters (`searchTerm`, `topResults`, `searchHistory`)
- Search status (`isSearching`, `searchStatus`, `hasSearched`)
- Search results (`searchResultNodes`, `searchResultLinks`)
- Vector search action (`performVectorSearch()`)

**Size:** 9.2KB

**⚠️ Future cleanup:** Merge into app-state (Phase 2)

---

### **ui-store.ts** - Pure UI State
**Responsibility:** UI toggles and panel visibility (NO business logic)

**Owns:**
- Label toggles (`showLabels`, `showDescriptionSummary`, `showThemeAnalysis`)
- Analysis panel toggles (`showSummaryAnalysis`, `showBusinessAnalysis`, `showThemesAnalysis`)
- UI expansions (`collapsedThemes`, `showMethodology`, `histogramExpanded`)
- Other UI (`showFilterTypes`, `showActiveNodes`, `showSearchHistory`)
- API key (`apiKey`)

**Size:** 3.1KB

**✅ Phase 1 Complete:**
- ~~`hasSearched`~~ → Moved to app-state
- ~~`searchStatus`~~ → Moved to app-state
- ~~`rightPanelExpanded`~~ → Removed (duplicate, already in app-state)

---

### **context-store.ts** - Analysis Context
**Responsibility:** Nodes selected for analysis

**Owns:**
- `contextNodes` - nodes in analysis workspace
- `addNodesToContext()`, `removeNodeFromContext()`, `clearContext()`

**Size:** 1KB

---

## 🔴 Known Duplication Issues (To Fix in Phase 2)

| State | app-state | unified-search | filter-store |
|-------|-----------|----------------|--------------|
| `searchTerm` | ❌ | ✅ | ✅ |
| `topResults` | ✅ | ✅ | ✅ |
| `selectedSimilarityRange` | ✅ | ✅ | ✅ |
| `colorMode` | ✅ | ❌ | ✅ |
| `nodeSizeMode` | ✅ | ❌ | ✅ |
| `hasSearched` | ✅ (Phase 1) | ✅ | ❌ |
| `searchStatus` | ✅ (Phase 1) | ✅ | ❌ |

---

## 🚨 Architecture Violations

### **1. Tight Coupling**
`unified-search-store` directly mutates `network-store`:
```typescript
// ❌ BAD: Direct mutation
const networkStore = useNetworkStore.getState();
networkStore.setNodes(filteredNodes);
```

**Fix (Phase 2):** app-state should own data, network-store should subscribe to it

---

### **2. Multiple Sources of Truth**
- Search results live in 3 places (app-state, unified-search, network-store)
- Filter criteria split between filter-store and app-state

**Fix (Phase 2):** Consolidate into app-state

---

## ✅ Phase 1 Results

**Moved to Correct Owner:**
- `hasSearched`: ui-store → app-state (search state belongs with search)
- `searchStatus`: ui-store → app-state (search state belongs with search)

**Removed Duplicates:**
- `rightPanelExpanded`: Removed from ui-store (already in app-state)

**Benefits:**
- ✅ Clearer ownership
- ✅ Easier to find where state lives
- ✅ Reduced confusion for new developers

---

## 📝 Best Practices

### **When Adding New State:**

1. **Ask: "What is this state's purpose?"**
   - Search/data/filtering → `app-state`
   - Graph display/interaction → `network-store`
   - UI toggles/visibility → `ui-store`
   - Analysis workspace → `context-store`

2. **Check for duplicates first!**
   - Search this file before adding
   - Don't create a third copy of existing state

3. **Keep stores focused:**
   - Each store should have ONE clear responsibility
   - If a store is doing 3+ different jobs, split it

4. **Document ownership:**
   - Update this file when adding new state
   - Add comments explaining why state lives where it does

---

## 🔮 Future Phases

### **Phase 2: Major Consolidation**
- Merge `unified-search-store` → `app-state`
- Remove visualization settings from `filter-store`
- Break tight coupling (unified-search → network-store)

### **Phase 3: Clarify Data Flow**
- Establish: app-state owns data, network-store displays it
- Add architectural diagrams
- Document state flow patterns

---

*This document is maintained as part of store consolidation efforts. Update it whenever you modify store responsibilities!*

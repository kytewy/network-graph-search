# Search Components

Simple, focused search interface components.

## Active Components

### **SearchInput.tsx** (69 lines)
Main search interface with query input and result count control.

**Features:**
- Text input for search queries
- Search button with loading state
- Result count control (topK: ±5 increments, min 5)
- Enter key to search
- Connected to app store for state management

**Usage:**
```tsx
import { SearchInput } from '@/components/search/SearchInput';

<SearchInput />
```

**Store Dependencies:**
- `query` - Current search query
- `isLoading` - Search loading state
- `topK` - Number of results to fetch
- `performSearch()` - Execute search function

---

### **SearchResults.tsx** (49 lines)
Displays search results in a scrollable list.

**Features:**
- Shows filtered results with scores
- Result count summary
- Scrollable container (max 500px)
- Returns null when no results

**Usage:**
```tsx
import { SearchResults } from '@/components/search/SearchResults';

<SearchResults />
```

**Store Dependencies:**
- `searchResults` - All search results
- `filteredResults` - Filtered subset of results

---

## File Structure

```
components/search/
├── SearchInput.tsx              (69 lines) ✅ Active
├── SearchResults.tsx            (49 lines) ✅ Active
├── DEPRECATED_FEATURES.md                  📄 Archive
└── README.md                               📄 This file
```

---

## Deprecated Files

The following files were removed (916 lines total):
- ~~`SearchPanel.tsx`~~ (392 lines) - Unused, features archived
- ~~`SimpleSearchPanel.tsx`~~ (524 lines) - Unused, features archived
- ~~`VectorSearchPanel.tsx`~~ (69 lines) - Renamed to `SearchInput.tsx`

See `DEPRECATED_FEATURES.md` for archived features and potential enhancements.

---

## Integration

**Used in:** `app/graph/page.tsx`

```tsx
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';

// In sidebar
<SearchInput />
<SimilarityHistogram />  // From visualization components
// <SearchResults />  // Currently commented out
<FilterPanel />
```

---

## State Management

All search components use **app store** (`@/lib/stores/app-state`) for centralized state:

```tsx
const query = useAppStore((state) => state.query);
const isLoading = useAppStore((state) => state.isLoading);
const searchResults = useAppStore((state) => state.searchResults);
const performSearch = useAppStore((state) => state.performSearch);
```

No local state, no prop drilling - clean and simple! ✨

---

## Future Enhancements

Potential features from deprecated components (see `DEPRECATED_FEATURES.md`):
- 🤖 AI Query Expansion (✨ button)
- 📝 Auto-resizing textarea for long queries
- 🔧 API response processor utility

---

*Last updated: 2025-09-30*  
*Components: 2 active, 3 deprecated (deleted)*

# Deprecated Search Components - Features Archive

This document archives valuable features from unused search components before deletion.

## 🗑️ Files Being Deprecated

- **SearchPanel.tsx** (392 lines) - Not used in app
- **SimpleSearchPanel.tsx** (524 lines) - Not used in app

**Currently Used:** Only `VectorSearchPanel.tsx` is active in the application.

---

## 💡 Valuable Features to Preserve

### 1. **AI Query Expansion** (SearchPanel.tsx)
**Feature:** "Expand Query with AI" button (✨ icon)  
**Location:** Lines 127-156

```tsx
const handleExpandQuery = async () => {
  if (!hasApiKey || !searchTerm.trim()) return;
  
  const response = await fetch('/api/expand-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: searchTerm }),
  });
  
  if (response.ok) {
    const { expandedQuery } = await response.json();
    setSearchTerm(expandedQuery);
  }
};
```

**Value:**
- Allows users to expand search queries using AI
- Requires API key (shows disabled state when not available)
- Good UX pattern for AI-enhanced search
- **Consider:** Add to VectorSearchPanel if query expansion is needed

---

### 2. **Similarity Range Filtering Logic** (Both Files)
**Feature:** Filter results by similarity percentage ranges  
**Ranges:** `<20`, `21-40`, `41-60`, `61-80`, `81-100`

```tsx
// Filter nodes by similarity score
nodes = nodes.filter((node) => {
  const similarity = Math.round((node.score || node.similarity || 0) * 100);
  
  return selectedRanges.some(range => {
    switch (range) {
      case '<20': return similarity >= 0 && similarity <= 19;
      case '21-40': return similarity >= 20 && similarity <= 40;
      case '41-60': return similarity >= 41 && similarity <= 60;
      case '61-80': return similarity >= 61 && similarity <= 80;
      case '81-100': return similarity >= 81 && similarity <= 100;
      default: return false;
    }
  });
});
```

**Value:**
- **Already implemented in `SimilarityHistogram` component** ✅
- Pattern is reusable for any similarity-based filtering
- Maps well to histogram visualization

---

### 3. **Auto-Resizing Textarea** (SearchPanel.tsx)
**Feature:** Search input that grows with content  
**Location:** Lines 224-244

```tsx
<Textarea
  onInput={(e) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 8 * 24) + 'px';
  }}
  className="min-h-[4rem] max-h-[8rem]"
  style={{ height: 'auto', minHeight: '4rem' }}
/>
```

**Value:**
- Better UX for long queries
- Self-limiting to 8 lines (8 * 24px)
- Good pattern for chat/search interfaces
- **Consider:** Add to VectorSearchPanel for better long-query UX

---

### 4. **API Response Processing** (SimpleSearchPanel.tsx)
**Feature:** Normalize different API response formats  
**Location:** Lines 238-265

```tsx
const processApiResponse = (data: any) => {
  let results = [];
  
  // Pinecone format
  if (data.rawResponse?.result?.hits) {
    results = data.rawResponse.result.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      label: hit.fields?.label || hit._id,
      category: hit.fields?.category || '',
      // ... more field mappings
    }));
  }
  // Generic format
  else if (data.results && Array.isArray(data.results)) {
    results = data.results;
  }
  
  return results;
};
```

**Value:**
- Handles multiple API response formats
- Field mapping and normalization
- **Consider:** Extract to `/lib/utils/api-response-processor.ts` if needed

---

### 5. **Enter Key to Search** (SearchPanel.tsx)
**Feature:** Submit search on Enter, new line on Shift+Enter  
**Location:** Lines 228-233

```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSearch();
  }
}}
```

**Value:**
- Standard UX pattern for search
- Allows multi-line input with Shift+Enter
- **Status:** Already in VectorSearchPanel ✅

---

### 6. **Performance Optimizations**

**Deep Comparison for State Updates** (SearchPanel.tsx, lines 116-118):
```tsx
// Prevents unnecessary re-renders
if (JSON.stringify(safeSearchNodes) !== JSON.stringify(processedResults)) {
  setProcessedResults(safeSearchNodes);
}
```

**Batch State Updates** (SearchPanel.tsx, lines 187-190):
```tsx
setTimeout(() => {
  setProcessedResults([]);
  setFilteredNodes([]);
}, 0);
```

**Value:**
- Good patterns for preventing render loops
- However, JSON.stringify is expensive - consider using refs instead

---

## 🎯 Recommendations

### **Keep (Already Implemented)**
- ✅ Similarity range filtering - in SimilarityHistogram
- ✅ Enter to search - in VectorSearchPanel
- ✅ Vector search - in VectorSearchPanel

### **Consider Adding to VectorSearchPanel**
- 🤔 AI Query Expansion (if `/api/expand-query` exists)
- 🤔 Auto-resizing textarea (better for long queries)

### **Extract to Utilities**
- 📦 API response processor → `/lib/utils/api-response-processor.ts`
- 📦 Similarity range filter logic → Already in histogram

### **Archive & Delete**
- 🗑️ SearchPanel.tsx - All features either duplicated or deprecated
- 🗑️ SimpleSearchPanel.tsx - Embedded network graph not used

---

## 📊 Summary

| Feature | Status | Action |
|---------|--------|--------|
| AI Query Expansion | **Unique** | Document for future use |
| Auto-resize Textarea | **Nice-to-have** | Could add to VectorSearchPanel |
| Similarity Filtering | ✅ Exists in SimilarityHistogram | No action needed |
| API Response Processing | **Utility** | Extract if needed |
| Enter to Search | ✅ In VectorSearchPanel | No action needed |

---

## 🚀 Next Steps

1. **Review** this document with the team
2. **Extract** AI Query Expansion if `/api/expand-query` exists
3. **Add** auto-resize textarea to VectorSearchPanel (optional)
4. **Delete** SearchPanel.tsx and SimpleSearchPanel.tsx
5. **Update** imports in any remaining files

---

*Document created: 2025-09-30*  
*Files to be deleted: SearchPanel.tsx (392 lines), SimpleSearchPanel.tsx (524 lines)*  
*Total lines archived: 916*

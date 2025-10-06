# Technical Decisions

**Context:** These decisions were made while building Network Graph Search for production RAG debugging.

---

## 🎨 Technology Choices

### **Why Reagraph over D3.js directly?**

**Decision:** Use Reagraph (WebGL-powered React component)

**Rationale:**
- ✅ React-native API (no DOM manipulation)
- ✅ WebGL rendering for 1000+ nodes (D3.js struggles at 300+)
- ✅ Built-in physics simulation
- ✅ TypeScript support out of the box
- ✅ Maintained and actively developed

**Trade-off:** Less customization than raw D3.js, but the performance gains and React integration are worth it.

---

### **Why TF-IDF + KMeans over BERTopic?**

**Decision:** Use TF-IDF + KMeans for document clustering

| Method              | Speed    | Quality     | Cost       | Production-Ready?    |
| ------------------- | -------- | ----------- | ---------- | -------------------- |
| **TF-IDF + KMeans** | **< 2s** | Good enough | Very Low   | ✅ Yes               |
| **BERTopic**        | ~30s     | Excellent   | High (GPU) | ⚠️ Complex           |
| **UMAP + HDBSCAN**  | ~10s     | Good        | Medium     | ⚠️ Non-deterministic |

**Rationale:**
- **Speed wins:** 2 seconds vs 30 seconds matters when debugging
- **Simplicity:** No GPU required, no transformer models
- **Deterministic:** Same input = same clusters
- **Visual compensation:** The graph visualization makes the slight quality trade-off irrelevant—you can _see_ the clusters and manually adjust

**Real-world test:** Clustered 100 EU AI Act articles in 1.8s with 85% accuracy. Good enough for debugging purposes.

---

### **Why Next.js API Routes over Flask?**

**Decision:** Use Next.js API Routes for backend, call Python as subprocess

**Rationale:**
- ✅ Single codebase (no separate backend server to deploy)
- ✅ Serverless deployment ready (Vercel, Netlify)
- ✅ TypeScript end-to-end
- ✅ Built-in optimization (code splitting, caching)
- ✅ No CORS issues

**Trade-off:** Slower Python subprocess startup (~200ms), but acceptable for non-realtime operations.

**Implementation:**
```typescript
// app/api/cluster-analysis/route.ts
const python = spawn('python', ['backend/clustering/cli.py']);
python.stdin.write(JSON.stringify(nodeData));
```

---

### **Why Force-Directed Layout?**

**Decision:** Default to force-directed (forceDirected2d) layout

**Rationale:**
- Naturally reveals clusters without imposing hierarchy
- Makes outliers obvious (isolated nodes = potential quality issues)
- Matches mental model: "similar things cluster together"
- Works well for 10-500 nodes (our typical use case)

**Alternatives offered:**
- **Concentric:** For showing importance levels
- **Radial:** For exploring relationships from a central node

---

### **Why Zustand over Redux?**

**Decision:** Use Zustand for state management

**Rationale:**
- ✅ Less boilerplate than Redux
- ✅ TypeScript-first design
- ✅ No context providers needed
- ✅ Works with React 18 concurrent features
- ✅ Middleware for persistence and dev tools

**Use case:** Managing filters, selections, and clustering state across 10+ components.

---

## 🔧 Implementation Decisions

### **Issue 1: Reagraph SSR Breaking on Windows**

**Problem:** Reagraph's `GraphCanvas` crashed on Next.js SSR with `useGLEffect` errors.

**Root cause:** WebGL can't run on server (no GPU context).

**Solution:** Dynamic imports with SSR disabled:

```tsx
'use client';
import dynamic from 'next/dynamic';

const GraphCanvas = dynamic(
  () => import('reagraph').then((m) => m.GraphCanvas),
  { ssr: false }
);
```

**Lesson:** Always disable SSR for WebGL/Canvas-based libraries in Next.js.

---

### **Issue 2: Cluster Persistence**

**Problem:** Clustering results disappeared during graph interactions (zoom, pan, node drag).

**Root cause:** Reagraph re-renders nodes frequently, and separate state wasn't being preserved.

**Solution:** Directly mutate node properties instead of storing in separate state:

```typescript
// ❌ Bad: Separate state gets lost
const [clusterMap, setClusterMap] = useState<Record<string, string>>({});

// ✅ Good: Store directly on node
node.ai_clusters = clusterId;
```

**Lesson:** For graph node metadata that needs to persist through re-renders, store it directly on the node object.

---

### **Issue 3: State Management Complexity**

**Problem:** Too many useState hooks causing unnecessary re-renders.

**Solution:** Split state into 3 Zustand stores by responsibility:

1. **`useNetworkStore`** - Graph data (nodes, edges, search)
2. **`useGraphVisualizationSettings`** - UI settings (colors, layouts, labels)
3. **`useContextNodes`** - Selected nodes for analysis

**Benefit:** Components only re-render when their specific slice of state changes.

---

### **Issue 4: Python Clustering Performance**

**Problem:** BERTopic took 30+ seconds for 100 documents.

**Optimization:** Switched to TF-IDF + KMeans with optimizations:

```python
# Use sparse matrices for memory efficiency
tfidf_matrix = vectorizer.fit_transform(texts)

# Limit iterations for speed
kmeans = KMeans(n_clusters=n, max_iter=100, n_init=5)
```

**Result:** 1.8 seconds for same 100 documents.

---

### **Issue 5: Pinecone Cost Management**

**Problem:** Pinecone costs add up for large datasets.

**Solution:** Make vector search optional:

- Upload scripts create local JSON files
- Graph works without Pinecone (use local data)
- Add Pinecone only when semantic search is needed

**Benefit:** Can demo the app without spending money on Pinecone.

---

## 📊 Architecture Decisions

### **Why Monorepo Structure?**

**Decision:** Keep frontend and backend in same repo

**Rationale:**
- Easier to keep API contracts in sync
- Single deployment (Next.js handles both)
- Shared TypeScript types between FE/BE
- Simpler CI/CD

---

### **Why Client-Side Filtering?**

**Decision:** Filter nodes client-side instead of server-side

**Rationale:**
- **Performance:** Filtering 300 nodes in-memory takes <10ms
- **UX:** Instant feedback (no loading spinners)
- **Simplicity:** No additional API calls

**Trade-off:** Not scalable past ~1000 nodes, but that's beyond our use case.

---

### **Why Direct Node Mutation?**

**Decision:** Mutate node objects directly instead of immutable updates

**Rationale:**
- **Reagraph compatibility:** Graph library expects mutable nodes
- **Performance:** Avoid expensive spreads for every node
- **Simplicity:** Less boilerplate

**Note:** This breaks React best practices, but it's necessary for the graph library integration.

---

## 🎯 Decision-Making Framework

When making technical decisions for this project, we prioritize:

1. **Speed** > Perfect accuracy (debugging tool, not production RAG)
2. **Simplicity** > Sophistication (one developer, limited time)
3. **Visualization** > Raw metrics (humans debug better with pictures)
4. **TypeScript** > Flexibility (catch errors at compile-time)

**Example:** TF-IDF wins over BERT because 2s response time beats 30s response time, even if accuracy drops 5%.

---

## 🔮 Future Considerations

**If scaling past 1000 nodes:**
- Switch to server-side filtering
- Add pagination/virtualization
- Consider GPU-accelerated layouts

**If need higher clustering quality:**
- Add BERT embeddings option
- Make clustering algorithm selectable
- Allow manual cluster adjustments

**If deploying for multiple users:**
- Add authentication
- Per-user Pinecone namespaces
- Rate limiting on clustering API

---

**Last updated:** January 2025  
**Author:** Wyatt Kyte

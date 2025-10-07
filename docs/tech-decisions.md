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

| Method              | Speed    | Quality     | Cost       | Production-Ready? |
| ------------------- | -------- | ----------- | ---------- | ----------------- |
| **TF-IDF + KMeans** | **< 2s** | Good enough | Very Low   | ✅ Yes            |
| **BERTopic**        | ~30s     | Excellent   | High (GPU) | ⚠️ Complex        |

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

\`\`\`typescript
// app/api/cluster-analysis/route.ts
const python = spawn('python', ['backend/clustering/cli.py']);
python.stdin.write(JSON.stringify(nodeData));
\`\`\`

---

### **Why Force-Directed Layout?**

**Decision:** Default to force-directed (forceDirected2d) layout

**Rationale:**

- Naturally reveals clusters without imposing hierarchy
- Makes outliers obvious (isolated nodes = potential quality issues)
- Allows Clustering to be done visually

**Alternatives offered:**

- **Concentric:** For showing importance levels
- **Radial:** For exploring relationships from a central node

---

### **Why Zustand over Redux?**

**Decision:** Use Zustand for state management

**Rationale:**

- ✅ Less boilerplate than Redux
- ✅ TypeScript-first design
- ✅ Works with React 18 concurrent features
- ✅ Middleware for persistence and dev tools

**Use case:** Managing filters, selections, and clustering state across 10+ components.

---

### **State Management Architecture**

**Decision:** Split state into 4 domain-specific Zustand stores

**Store Structure:**

| Store             | Purpose               | Example State                                       |
| ----------------- | --------------------- | --------------------------------------------------- |
| **app-state**     | Core search & results | `searchResults` , `filteredResults` , `colorMode`   |
| **network-store** | Graph interactions    | `selectedNodes` , `highlightedNodes` , `layoutType` |
| **context-store** | Analysis workspace    | `contextNodes` , `clusterResults`                   |
| **ui-store**      | UI toggles            | `showLabels` , `histogramExpanded`                  |

**Key Patterns:**

1. **Selective subscriptions** - Components only subscribe to state slices they need

   \`\`\`tsx
   // ✅ Good - only re-renders when query changes
   const query = useAppStore((state) => state.query);

   // ❌ Bad - re-renders on any state change
   const store = useAppStore();
   \`\`\`

2. **Direct node mutation** - For Reagraph compatibility

   \`\`\`tsx
   // Store cluster data directly on nodes
   node.ai_clusters = clusterId;
   \`\`\`

3. **No cross-store mutations** - Each store manages its own domain

**Benefits:**

- Clear ownership of state
- Prevents unnecessary re-renders
- Easy to debug with Redux DevTools
- Scalable for adding new features

---

## 🔧 Implementation Decisions

### **Issue 1: Cluster Persistence**

**Problem:** Clustering results disappeared during graph interactions (zoom, pan, node drag).

**Root cause:** Reagraph re-renders nodes frequently, and separate state wasn't being preserved.

**Solution:** Directly mutate node properties instead of storing in separate state:

\`\`\`typescript
// ❌ Bad: Separate state gets lost
const [clusterMap, setClusterMap] = useState<Record<string, string>>({});

// ✅ Good: Store directly on node
node.ai_clusters = clusterId;
\`\`\`

**Lesson:** For graph node metadata that needs to persist through re-renders, store it directly on the node object.

---

### **Issue 2: State Management Complexity**

**Problem:** Too many useState hooks causing unnecessary re-renders.

**Solution:** Split state into 4 Zustand stores by responsibility:

1. **`app-state`** - Core search & results
2. **`network-store`** - Graph interactions
3. **`context-store`** - Analysis workspace
4. **`ui-store`** - UI toggles

**Benefit:** Components only re-render when their specific slice of state changes.

---

## 🏗️ Development Challenges & Solutions

### **Challenge 1: Managing Component Complexity**

**Problem:** Started with rapid "vibe coding" for prototyping, which led to a 2000-line God component using dozens of `useState` hooks.

**Impact:**

- Difficult to debug
- Unnecessary re-renders
- Hard to understand data flow
- Maintenance nightmare

**Solution:** Multi-phase refactoring:

1. **Component decomposition** - Split monolithic component into 20+ focused components
2. **State extraction** - Migrated from `useState` to 5 domain-specific Zustand stores
3. **Hook composition** - Created custom hooks for shared logic (e.g., `useGraphData`, `useGraphSelection`)

**Result:**

- Main page reduced from 2000 → 200 lines
- Clear state ownership and data flow
- Components only re-render when needed

**Lesson:** Start with rapid prototyping, but refactor early. Don't wait until 2000 lines.

---

### **Challenge 2: Handling Highly Connected Graph Data**

**Problem:** Switched from fake data to real EU AI Act documents. Articles heavily cross-reference each other, creating a dense, unreadable graph with 500+ edges.

**Initial Approach:** Using HTML5 to showcase a simple graph

**Issues:**

- Graph looked like a hairball
- Impossible to identify clusters
- Performance degraded with so many edges

**Solution:** Switched to Reagraph (WebGL-powered graph library)

- Implemented smart edge filtering (only show high-weight connections)
- Added toggle to show/hide all connections on demand
- Used force-directed layout to naturally reveal clusters

**Result:** Clean, readable graphs with 10x better performance. WebGL handles 500+ edges smoothly where HTML5 Canvas struggled.

---

### **Challenge 3: Choosing the Right Clustering Algorithm**

**Problem:** Needed document clustering for quality analysis, but had conflicting constraints:

- Only 300 documents (small dataset)
- Needed end-to-end pipeline working first
- Limited time for infrastructure setup

**Initial Plan:** Use BERTopic for state-of-the-art clustering

**Why BERTopic didn't work:**

- 30+ second clustering time (killed UX)
- Requires loading large transformer models (2GB+)
- Would need separate Docker container for model hosting
- Overkill for 300 documents

**Decision:** Use TF-IDF + KMeans instead

**Trade-offs:**

| Criterion             | BERTopic              | TF-IDF + KMeans      |
| --------------------- | --------------------- | -------------------- |
| **Speed**             | ~30s                  | < 2s ✅              |
| **Quality**           | Excellent (95%)       | Good enough (85%)    |
| **Infrastructure**    | Complex (GPU, models) | Simple (CPU only) ✅ |
| **Time to implement** | 2-3 days              | 2 hours ✅           |

**Rationale:**

- **Speed matters more:** Users won't wait 30s for clustering during debugging
- **Visual compensation:** The graph makes clustering errors obvious—users can see and manually adjust
- **Iterative development:** Get the full pipeline working first, optimize later if needed
- **Good enough is enough:** 85% accuracy suffices for a debugging tool

**Result:** Shipped working clustering in hours instead of days. Can always upgrade to BERTopic later if needed.

---

### **Challenge 4: Reagraph Documentation Gap**

**Problem:** Reagraph (the WebGL graph library) is relatively new and not well-represented in LLM training data.

**Impact:**

- ChatGPT/Claude hallucinated non-existent APIs
- Had to manually read source code and TypeScript definitions
- Trial-and-error for basic integrations

**Solution:** Baby steps with documentation

- Read actual Reagraph source code on GitHub
- Built minimal working examples for each feature
- Documented working patterns for team (and future me)

**Key learnings documented:**

- Dynamic imports required for SSR (`ssr: false`)
- Node mutations persist through re-renders
- Selection state must be managed carefully
- Layout types have different requirements

**Lesson:** When using bleeding-edge libraries, budget extra time for documentation deep-dives.

---

### **Challenge 5: Balancing Speed vs. Quality**

**Core tension:** Building a debugging tool, not a production RAG system.

**Decision framework adopted:**

| Priority           | Rationale                                                       |
| ------------------ | --------------------------------------------------------------- |
| 1. Speed           | Debugging sessions are interactive—can't wait 30s per operation |
| 2. Simplicity      | Solo developer with limited time                                |
| 3. Visual feedback | Humans debug better with pictures than metrics                  |
| 4. Iteration speed | Ship working feature, gather feedback, improve                  |

**Examples:**

- TF-IDF over BERTopic (2s vs 30s)
- Client-side filtering (instant vs server round-trip)
- Force-directed over hierarchical layout (reveals clusters naturally)

**Result:** Working tool in hands of users in weeks, not months.

---

## 🔮 Future Considerations

**If scaling past 1000 nodes:**

- Switch to server-side filtering
- Hierarchical clustering
- Add pagination/virtualization
- Consider GPU-accelerated layouts

**If need higher clustering quality:**

- Add BERT embeddings option
- Make clustering algorithm selectable

**If deploying for multiple users:**

- Add authentication
- Rate limiting on clustering API
- Search with more metadata

---

**Last updated:** October 2025

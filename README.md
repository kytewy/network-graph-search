# Network Graph Search

> Semantic document search with interactive graph visualization and AI-powered clustering

Built while solving RAG quality issues with various clients. Turns hours of manual document review into minutes of visual pattern recognition.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Reagraph](https://img.shields.io/badge/Reagraph-4-purple)](https://reagraph.dev/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow?logo=python)](https://www.python.org/)

---

## 🎯 The Problem

**RAG systems often fail because vector databases return irrelevant results.** Traditional debugging? Manually reviewing hundreds of documents in spreadsheets, hoping to spot patterns.

There had to be a better way.

---

## 💡 The Solution

A visual document exploration tool that:

1. **Searches semantically** using Pinecone vector database
2. **Visualizes relationships** in an interactive 3D force-directed graph
3. **Clusters automatically** using TF-IDF + KMeans (< 2 seconds)
4. **Enables rapid triaging** through visual pattern recognition

**Result:** Quality issues invisible in spreadsheets become obvious when visualized.

---

## ✨ Key Features

### 🔍 **Semantic Search**

- Query 299+ AI governance documents via Pinecone
- Adjustable similarity thresholds
- Real-time filtering by geography, type, and score

### 📊 **Interactive Graph Visualization**

- **Reagraph** (WebGL-powered) for 1000+ node graphs
- Three layout modes: Force-Directed, Concentric, Radial
- Zoom, pan, node selection, lasso multi-select

### 🤖 **AI-Powered Clustering**

- TF-IDF + KMeans clustering (< 2 seconds for 100 docs)
- Automatic cluster summaries and top terms
- Color-coded cluster visualization

### 🎨 **Visual Analysis**

- 5 color modes (continent, type, similarity, clusters)
- Interactive similarity histogram
- Geographic and type-based filtering

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Python 3.9+** (for clustering)
- **Pinecone account** (optional, for vector search)

### 1. Install Dependencies

```bash
# Clone repository
git clone https://github.com/kytewy/network-graph-search
cd network-graph-search

# Install Node dependencies
pnpm install

# Install Python dependencies (for clustering)
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp example.env .env

# Add your Pinecone credentials (optional)
PINECONE_API_KEY=your_api_key
PINECONE_INDEX_NAME=network-graph
PINECONE_NAMESPACE=default
```

### 3. Run Development Server

```bash
pnpm dev
```

Visit **http://localhost:3000/graph**

### 4. Upload Data (First Time)

```bash
# Upload 299 AI governance documents to Pinecone
python scripts/upload_all_data.py
```

---

## 🏗️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **Reagraph** - WebGL graph visualization (D3.js powered)
- **TypeScript** - Type safety throughout
- **Tailwind CSS + shadcn/ui** - Modern UI components
- **Zustand** - State management

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Python** - Clustering subprocess
- **scikit-learn** - TF-IDF + KMeans clustering
- **Pinecone** - Vector database (optional)

## 🎨 Why These Technologies?

### **Why Reagraph over D3.js directly?**

- ✅ React-native API (no DOM manipulation)
- ✅ WebGL rendering for 1000+ nodes
- ✅ Built-in physics simulation
- ✅ TypeScript support

### **Why TF-IDF + KMeans over BERTopic?**

| Method              | Speed    | Quality     | Cost       | Production-Ready?    |
| ------------------- | -------- | ----------- | ---------- | -------------------- |
| **TF-IDF + KMeans** | **< 2s** | Good enough | Very Low   | ✅ Yes               |
| **BERTopic**        | ~30s     | Excellent   | High (GPU) | ⚠️ Complex           |
| **UMAP + HDBSCAN**  | ~10s     | Good        | Medium     | ⚠️ Non-deterministic |

**Decision:** TF-IDF + KMeans wins for speed and simplicity. The graph visualization makes the slight quality trade-off irrelevant—you can _see_ the clusters.

### **Why Next.js API Routes over Flask?**

- ✅ Single codebase (no separate backend server)
- ✅ Serverless deployment ready
- ✅ TypeScript end-to-end
- ✅ Built-in optimization

### **Why Force-Directed Layout?**

- Naturally reveals clusters without imposing hierarchy
- Makes outliers obvious (isolated nodes)
- Matches mental model: "similar things cluster together"

---

## 📁 Project Structure

```
network-graph-search/
├── app/                      # Next.js App Router pages
│   ├── graph/               # Main graph visualization page
│   └── api/                 # API routes
│       ├── vector-search/  # Pinecone search endpoint
│       └── cluster-analysis/ # Clustering endpoint
├── components/              # React components
│   ├── analysis/           # Clustering & chat interfaces
│   ├── filters/            # Geographic & type filters
│   ├── network/            # Graph visualization
│   └── search/             # Search UI
├── backend/                 # Python clustering
│   └── clustering/
│       ├── analyzer.py     # TF-IDF + KMeans implementation
│       └── cli.py          # CLI interface for API
├── lib/
│   ├── contexts/           # React Context providers
│   ├── stores/             # Zustand state management
│   └── utils/              # Utility functions
├── hooks/                   # Custom React hooks
├── scripts/                 # Data upload scripts
└── docs/                    # Technical documentation
```

---

## 🔧 Key Technical Decisions

### **Issue 1: Reagraph SSR Breaking on Windows**

**Problem:** Reagraph's `GraphCanvas` crashed with `useGLEffect` errors.

**Solution:** Dynamic imports with SSR disabled:

```tsx
const GraphCanvas = dynamic(
	() => import('reagraph').then((m) => m.GraphCanvas),
	{ ssr: false }
);
```

### **Issue 2: Cluster Persistence**

**Problem:** Clustering results disappeared during graph interactions.

**Solution:** Directly mutate node properties (`node.ai_clusters = clusterId`) instead of storing in separate state. This ensures persistence through graph re-renders.

### **Issue 3: State Management Complexity**

**Problem:** Multiple overlapping stores caused confusion.

**Solution:** Adopted hook composition pattern in `NetworkGraphContext`:

- 6 focused hooks (graph-data, selection, layout, etc.)
- Each handles one responsibility
- Context composes them into unified API

---

## 🎯 Use Cases

### **1. RAG Quality Assurance**

Search → Cluster → Visually identify off-topic documents

### **2. Document Set Analysis**

View entire corpus as graph → Discover unexpected relationships

### **3. Content Gap Analysis**

Identify sparse areas → Find missing content

---

## 📚 Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design deep dive
- **[State Management](./docs/state-management.md)** - Zustand stores guide
- **[Components](./docs/components.md)** - Component architecture
- **[Data Pipeline](./docs/data-pipeline.md)** - Data upload scripts

---

## 📊 Performance

| Operation         | Time    | Notes                |
| ----------------- | ------- | -------------------- |
| Vector Search     | ~200ms  | Pinecone latency     |
| TF-IDF Clustering | < 2s    | CPU-only, local      |
| Graph Rendering   | < 100ms | WebGL client-side    |
| Full Page Load    | ~500ms  | Including data fetch |

**Tested with 299 documents. Scales to 1000+ nodes.**

---

## 🛣️ Roadmap

### **Current Features** ✅

- Semantic search with Pinecone
- Interactive Reagraph visualization
- TF-IDF + KMeans clustering
- Geographic & type filtering

### **Next Steps**

- [ ] Demo mode (works without Pinecone)
- [ ] Export graph as image
- [ ] LLM-powered cluster naming
- [ ] Real-time collaboration

---

## 🤝 Contributing

Contributions welcome! Areas of interest:

- Alternative clustering algorithms
- New visualization layouts
- Performance optimizations
- UI/UX improvements

---

## License

MIT

---

## 👤 Author

**Wyatt Kyte**

Built while solving RAG quality issues. Focus: Making AI systems interpretable and debuggable through visualization.

---

**Have questions?** Check the [documentation](./docs/ARCHITECTURE.md) or open an issue.

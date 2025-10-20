# Context Triaging

> Semantic document search with interactive graph visualization and AI-powered clustering

<p align="center">
  <img src="./docs/images/demo.jpg" alt="Network Graph Search" width="100%">
  <br>
  <em>30 documents clustered in under 2 seconds - the red outlier in cluster_4 is immediately visible</em>
</p>

---

## 🚀 Quick Start

**Prerequisites:** Docker and Docker Compose only

```bash
# 1. Clone the repository
git clone https://github.com/kytewy/network-graph-search
cd network-graph-search

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your API keys (PINECONE_API_KEY, PINECONE_HOST, OPENAI_API_KEY)

# 3. Start the application
docker compose up
```

**→ Visit [localhost:3000/graph](http://localhost:3000/graph)**

✨ **Hot reload enabled** - code changes refresh automatically!

### First Time Setup

If this is your first time running the app, you'll need to upload sample documents:

```bash
# Upload 299 EU AI Act articles to Pinecone
docker compose exec app python scripts/upload_all_data.py
```

### Production Deployment

For production deployment (Render.com, etc.), use the production Dockerfile:

```bash
# Build production image
docker build -f Dockerfile -t network-graph-search .

# Run production container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PYTHON_PATH=/usr/bin/python3 \
  -e PINECONE_API_KEY=your_key \
  -e PINECONE_HOST=your_host \
  -e OPENAI_API_KEY=your_key \
  network-graph-search
```

## 🎯 The Problem

Traditional RAG systems retrieve documents based on embedding cosine similarity, not actual relevance.

**Real example:** Query "AI regulations" returns 50 redundant GDPR documents, all ranking highly, with zero indication they're duplicates.

**The cost:**

- **LLMs waste tokens** on redundant context ($0.15 per duplicate-heavy query)
- **Users can't see** knowledge gaps or document relationships
- **Hours spent** manually reviewing 500+ documents to find one bad retrieval

**Root cause:** RAG quality issues are invisible in ranked lists.

---

## 💡 The Solution

**Visual document exploration** that makes patterns obvious:

- **Semantic search** with Pinecone vectors
- **Interactive graph visualization** using Reagraph (WebGL)
- **Instant clustering** with TF-IDF + KMeans (< 2s)
- **Multi-dimensional filtering** by geography, type, similarity

**Result:** 4 hours of manual review → 2 minutes of visual analysis

---

## ✨ Key Features

- **🔍 Semantic search** across 300+ documents with adjustable thresholds
- **📊 Interactive 2D graphs** with force-directed, concentric, and radial layouts
- **🤖 Instant clustering** with automatic summaries and top terms
- **🎨 4 color modes** (continent, type, similarity, source type)
- **🎯 Advanced filtering** by geography, document type, and similarity score
- **⚡ Lasso selection** for bulk node operations
- **📈 Similarity histogram** for distribution analysis

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

## 🎯 Use Cases

### 1. Find RAG Retrieval Errors in Minutes

**Before:** Manually review 500 documents in spreadsheet to find why "Cookie Recipes" appeared in privacy query  
**After:** Search → Cluster → Red outlier node in wrong cluster jumps out immediately

**Time saved:** 4 hours → 2 minutes

---

### 2. Reduce LLM Context Costs by 60%

**Before:** RAG returns 15 similar GDPR documents (3000 tokens, $0.45/query)  
**After:** Clustering identifies 5 unique perspectives (1200 tokens, $0.18/query)

**Cost saved:** $0.27 per query × 1000 queries/month = **$270/month**

---

### 3. Discover Knowledge Gaps Visually

**Before:** Can't tell if documentation covers all regulatory frameworks  
**After:** Graph shows dense cluster for GDPR, sparse area for CCPA → gaps obvious

**Action:** Identify missing content in 30 seconds vs hours of manual audit

---

### 4. Eliminate Duplicate Documents

**Before:** 50 documents, unknown overlap  
**After:** Tight cluster of 12 nearly-identical articles → merge or remove duplicates

**Corpus quality:** Reduced from 50 to 38 unique documents (-24% redundancy)

---

### 5. Enrich Metadata at Scale

**Before:** Manually tag 300 documents with categories  
**After:** Natural clusters emerge → bulk-tag all nodes in "GDPR Compliance" cluster

**Tagging speed:** 5 hours → 30 minutes

## 📚 Documentation

- **[Architecture Guide](./docs/architecture.md)** - Tech stack, system design, and data flow
- **[Technical Decisions](./docs/tech-decisions.md)** - Why we chose these technologies
- **[Data Pipeline](./docs/data-pipeline.md)** - Data upload scripts

---

## 📊 Performance

| Operation         | Time    | Notes                |
| ----------------- | ------- | -------------------- |
| Vector Search     | ~200ms  | Pinecone latency     |
| TF-IDF Clustering | < 2s    | CPU-only, local      |
| Graph Rendering   | < 100ms | WebGL client-side    |
| Full Page Load    | ~500ms  | Including data fetch |

**Tested with 300+ documents. Scales to 1000+ nodes.**

---

## 🛣️ Roadmap

### **Current Features** ✅

- ✅ Semantic search with Pinecone
- ✅ Interactive Reagraph visualization (force-directed, concentric, radial layouts)
- ✅ TF-IDF + KMeans clustering with automatic summaries
- ✅ Geographic & type filtering
- ✅ Lasso selection for bulk operations
- ✅ Similarity histogram

### **In Development** 🚧

- 🚧 LLM integration for node summary/business analysis (Summary & Business Analysis buttons in workspace)

### **Planned Features** 📋

- [ ] LLM-powered cluster naming
- [ ] Enhanced metadata extraction
- [ ] Expanded data ingestion pipeline
- [ ] LLM Chat with document citations
- [ ] Bulk metadata tagging

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

**Have questions?** Check the [documentation](./docs/sys-architecture.md) or open an issue.

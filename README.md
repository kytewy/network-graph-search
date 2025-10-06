# Network Graph Search

> Semantic document search with interactive graph visualization and AI-powered clustering

Born from production RAG debugging - turns hours of document review into minutes of visual analysis.

<!-- **[Live Demo](https://your-demo-url.com)** *(Add when deployed)* -->

![Graph Visualization Demo](./docs/images/demo.jpg)
_Search results visualized as an interactive network - spot patterns and outliers instantly_

---

## 🚀 Quick Start

**Get running in 3 minutes:**

```bash
# 1. Clone and install
git clone https://github.com/kytewy/network-graph-search
cd network-graph-search
pnpm install && pip install -r requirements.txt

# 2. Set up environment (add your Pinecone)
cp example.env

# 3. Run the app
pnpm dev
```

**→ Visit [localhost:3000/graph](http://localhost:3000/graph)**

Search for documents, explore the graph, analyze clusters. [Full setup guide below](#-detailed-setup).

---

## 🎯 The Problem

**When your RAG returns "Cookie Baking Best Practices" for a query about data privacy**, you need to review 500+ documents to find why.

Traditional debugging methods:

- **Spreadsheets:** Can't see relationships between documents
- **Text search:** Misses semantic issues
- **Manual review:** Hours per investigation

**The core issue:** RAG quality problems are invisible in tabular data.

---

## 💡 The Solution

A visual document exploration tool that makes patterns obvious:

- **Semantic search** with Pinecone vectors
- **Interactive graph visualization** using Reagraph (WebGL)
- **AI-powered clustering** with TF-IDF + KMeans (< 2s)
- **Multi-dimensional filtering** by geography, type, similarity

**Result:** Hours of document review → Minutes of visual analysis

---

## ✨ Key Features

- **🔍 Semantic search** across 300+ documents with adjustable thresholds
- **📊 Interactive 3D graphs** with force-directed, concentric, and radial layouts
- **🤖 Instant clustering** with automatic summaries and top terms
- **🎨 4 color modes** (continent, type, similarity, source type)
- **🎯 Advanced filtering** by geography, document type, and similarity score
- **⚡ Lasso selection** for bulk node operations
- **📈 Similarity histogram** for distribution analysis

---

## 🏗️ Tech Stack

**Frontend:** Next.js 14 + TypeScript + Reagraph (WebGL graphs)  
**Backend:** Python (TF-IDF + KMeans) + Pinecone (semantic search)  
**State:** Zustand + React Context  
**Styling:** Tailwind CSS + Radix UI

**Why these choices?** [See Technical Decisions](./docs/TECH_DECISIONS.md)

---

## 📋 Detailed Setup

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

### **1. RAG Quality Assurance**

Search → Cluster → Visually identify off-topic documents

### **2. Document Set Analysis**

View entire corpus as graph → Discover unexpected relationships

### **3. Content Gap Analysis**

Identify sparse areas → Find missing content

---

## 📚 Documentation

- **[Technical Decisions](./docs/TECH_DECISIONS.md)** - Why we chose these technologies
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

**Tested with 300+ documents. Scales to 1000+ nodes.**

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

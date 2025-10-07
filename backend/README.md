# Backend Directory

Server-side logic called by Next.js API routes via Python subprocesses.

## Structure

\`\`\`
backend/
└── clustering/
    ├── __init__.py
    ├── analyzer.py      # TF-IDF + KMeans clustering
    ├── cli.py           # Stdin/stdout wrapper
    └── requirements.txt # Python dependencies
\`\`\`

## Clustering Module

**Purpose**: Cluster network nodes by content similarity.

**Algorithm**: TF-IDF vectorization + KMeans clustering

**Usage**: Called by `/api/cluster-analysis` Next.js route

### Installation

\`\`\`bash
cd backend/clustering
pip install -r requirements.txt
\`\`\`

Dependencies: `scikit-learn`, `numpy`

### Testing

\`\`\`bash
# Test via API
./scripts/test_cluster_api.sh
\`\`\`

See `PHASE_1_BACKEND_COMPLETE.md` for detailed setup and usage.

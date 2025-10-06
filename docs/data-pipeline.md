# Data Pipeline Scripts

> Data collection and upload pipeline for the AI Governance Network Graph

This directory contains Python scripts for scraping AI governance documents and uploading them to Pinecone vector database for semantic search and graph visualization.

## 🚀 Quick Start

**Upload all data sources:**

```bash
python scripts/upload_all_data.py
```

This uploads **299 AI governance documents** from multiple authoritative sources.

## 📊 Data Sources

| Source | Count | Description |
|--------|-------|-------------|
| **EU AI Act Articles** | 113 | Complete text of EU AI Act articles with cross-references |
| **EU AI Act Recitals** | 180 | Preamble recitals providing context and intent |
| **Canadian AI Governance** | 4 | OSFI guidelines, DAIS submissions, ethics reports |
| **IAPP Resources** | 2 | Industry analysis and US state legislation trackers |
| **Total** | **299** | Comprehensive AI governance corpus |

## 📁 Files

### Main Entry Point
- **`upload_all_data.py`** - Unified upload script for all data sources (⭐ use this)

### Data Sources
- **`data_canada.py`** - Canadian AI governance documents (OSFI, DAIS, Montreal Declaration)

### Scrapers
- **`scrape_eu_ai_articles.py`** - Scrapes EU AI Act articles from artificialintelligenceact.eu
- **`scrape_eu_ai_recitals.py`** - Scrapes EU AI Act recitals
- **`data_enforce.py`** - Helper for scraping enforcement dates

### Testing & Utilities
- **`test_pinecone_search.py`** - Verify data upload with sample queries
- **`test_cluster_api.sh`** - API endpoint testing
- **`generate_eu_data.py`** - Generate TypeScript sample data for frontend

## 🔧 Prerequisites

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
PINECONE_API_KEY=your_api_key_here
PINECONE_INDEX_NAME=network-graph
PINECONE_NAMESPACE=example-namespace
```

### 2. Python Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `pinecone` - Vector database client
- `beautifulsoup4` - Web scraping
- `requests` - HTTP client
- `python-dotenv` - Environment variables

## 📦 Scripts Overview

### Data Collection (`data_collection/`)

**`articles.py`** - Scrapes 113 EU AI Act articles
- Extracts title, content, summary, enforcement dates
- Generates `eu_ai_act.json`
- Creates cross-reference graph (connected_to field)

**`recital.py`** - Scrapes 180 EU AI Act recitals
- Provides legislative intent and context
- Generates `test_recitals_1_to_180.json`

**`data_enforce.py`** - Helper for enforcement date extraction

### Data Sources (`data_sources/`)

**`canada_data.py`** - Canadian AI governance documents
- OSFI Guideline E-23
- DAIS AI policy submissions
- Montreal Declaration ethical guidelines

**`more_data.py`** - Additional industry resources
- IAPP model drift analysis
- US state AI legislation tracker

### Upload (`upload/`)

**`upload_all_data.py`** ⭐ - **Main entry point**
- Unified upload for all data sources
- Progress tracking and error handling
- Batch processing for rate limit compliance
- Upload statistics and verification

**`upload_to_pinecone.py`** - Legacy EU-only uploader

### Testing (`testing/`)

**`test_pinecone_search.py`** - Verify data upload
- Runs sample queries
- Validates search results
- Tests graph relationships

**`test_cluster_api.sh`** - API endpoint testing

### Utilities (`utilities/`)

**`generate_eu_data.py`** - Generate TypeScript sample data
- Creates `lib/sample-eu-data.ts`
- For frontend development and testing

## 🔄 Typical Workflow

### 1. Collect Data (when updating sources)

```bash
# Scrape EU AI Act
python scripts/data_collection/articles.py  # Select option 2
python scripts/data_collection/recital.py
```

### 2. Upload to Pinecone

```bash
# Upload all sources
python scripts/upload/upload_all_data.py
```

### 3. Verify Upload

```bash
# Test search functionality
python scripts/testing/test_pinecone_search.py
```

### 4. Run Application

```bash
# Start Next.js frontend
npm run dev
```

## 🏗️ Data Schema

All records follow a standardized schema:

```python
{
    "_id": "A1",                    # Unique identifier
    "chunk_text": "...",            # Combined text for embedding
    "label": "Article 1",           # Display name
    "summary": "...",               # Brief description
    "content": "...",               # Full text
    "url": "https://...",           # Source link
    "category": "article",          # Document type
    "type": "article",              # Classification
    "continent": "Europe",          # Geographic origin
    "country": "European Union",    # Country
    "sourceType": "Government",     # Authority type
    "connected_to": ["R1", "R5"]    # Cross-references (optional)
}
```

## 📝 Notes

- **Idempotent uploads**: Re-running scripts safely overwrites existing records
- **Rate limiting**: 2-second delays between batches prevent API throttling
- **Content truncation**: Automatic handling of Pinecone's 40KB metadata limit
- **Error handling**: Graceful degradation with detailed error messages

## 🤝 Contributing

When adding new data sources:

1. Follow the standardized schema above
2. Add to `upload_all_data.py` for unified processing
3. Update this README with new source information
4. Test with `test_pinecone_search.py`

---

**Questions?** See the main [Architecture documentation](./ARCHITECTURE.md) or open an issue.

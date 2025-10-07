# Data Pipeline

> Data collection and upload for the AI Governance Network Graph

## 🚀 Quick Start

**Upload all data sources:**

```bash
python scripts/upload_all_data.py
```

This uploads **299 AI governance documents** from multiple authoritative sources.

## 📊 Data Sources

| Source                     | Count   | Description                                               |
| -------------------------- | ------- | --------------------------------------------------------- |
| **EU AI Act Articles**     | 113     | Complete text of EU AI Act articles with cross-references |
| **EU AI Act Recitals**     | 180     | Preamble recitals providing context and intent            |
| **Canadian AI Governance** | 4       | OSFI guidelines, DAIS submissions, ethics reports         |
| **IAPP Resources**         | 2       | Industry analysis and US state legislation trackers       |
| **Total**                  | **299** | Comprehensive AI governance corpus                        |

## 🔧 Prerequisites

Create a `.env` file in the project root:

```bash
PINECONE_API_KEY=your_api_key_here
PINECONE_INDEX_NAME=network-graph
PINECONE_NAMESPACE=example-namespace
```

Install dependencies:

```bash
pip install -r requirements.txt
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

## 📦 Key Scripts

- **`scripts/upload_all_data.py`** - Main upload script (use this)
- **`scripts/scrape_eu_ai_articles.py`** - Scrapes EU AI Act articles
- **`scripts/scrape_eu_ai_recitals.py`** - Scrapes EU AI Act recitals
- **`scripts/test_pinecone_search.py`** - Verify uploads with sample queries

## 📝 Implementation Notes

- **Idempotent uploads**: Safe to re-run without duplicates
- **Rate limiting**: 2-second delays between batches
- **Content truncation**: Handles Pinecone's 40KB metadata limit automatically

---

**Questions?** See the main [Architecture documentation](./architecture.md)

**Last updated:** October 2025

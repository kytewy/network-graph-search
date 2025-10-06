#!/usr/bin/env python3
"""
Unified Data Upload Script
Uploads all data sources to Pinecone in a single command.

Usage:
    python scripts/upload_all_data.py

This script consolidates:
- EU AI Act Articles (from eu_ai_act.json)
- EU AI Act Recitals (from test_recitals_1_to_180.json)
- Canadian AI Governance Data (from canada_data.py)
- IAPP AI Governance Articles (from more_data.py)
"""

import json
import os
import sys
import time
from typing import List, Dict, Any
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def load_json_file(file_path: str) -> Any:
    """Load JSON data from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"⚠️  Warning: {file_path} not found")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON from {file_path}: {e}")
        return None

def validate_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Validate that a record has required fields and truncate large content."""
    if not record.get('_id') or not record.get('chunk_text'):
        raise ValueError(f"Record {record.get('_id', 'unknown')} must have _id and chunk_text fields")
    
    # Pinecone metadata limit is 40KB (40,960 bytes) for ALL metadata combined
    # This includes JSON serialization overhead, field names, and all fields
    # Being very conservative to account for:
    # - JSON encoding overhead (~20-30% extra)
    # - UTF-8 multi-byte characters
    # - All other metadata fields (label, summary, category, etc.)
    
    MAX_CHUNK_TEXT_LENGTH = 10000   # Used for embeddings - can be shorter
    MAX_CONTENT_LENGTH = 15000      # Used for display
    MAX_SUMMARY_LENGTH = 2000       # Summaries are usually reasonable, don't truncate unless very long
    
    # Truncate chunk_text (used for embedding generation)
    if len(record['chunk_text']) > MAX_CHUNK_TEXT_LENGTH:
        original_length = len(record['chunk_text'])
        record['chunk_text'] = record['chunk_text'][:MAX_CHUNK_TEXT_LENGTH]
        print(f"   ⚠️  Truncated chunk_text for {record['_id']}: {original_length} → {len(record['chunk_text'])} chars")
    
    # Truncate content (used for display)
    if 'content' in record and len(record['content']) > MAX_CONTENT_LENGTH:
        original_length = len(record['content'])
        record['content'] = record['content'][:MAX_CONTENT_LENGTH] + "... [Content truncated]"
        print(f"   ⚠️  Truncated content for {record['_id']}: {original_length} → {len(record['content'])} chars")
    
    # Truncate summary if too long
    if 'summary' in record and len(record.get('summary', '')) > MAX_SUMMARY_LENGTH:
        original_length = len(record['summary'])
        record['summary'] = record['summary'][:MAX_SUMMARY_LENGTH] + "..."
        print(f"   ⚠️  Truncated summary for {record['_id']}: {original_length} → {len(record['summary'])} chars")
    
    # Estimate total metadata size (rough approximation)
    # Serialize to JSON to get actual byte size
    import json
    metadata_size = len(json.dumps(record, ensure_ascii=False).encode('utf-8'))
    
    if metadata_size > 40000:  # Warning threshold
        print(f"   ⚠️  WARNING: {record['_id']} metadata size is {metadata_size} bytes (limit: 40960)")
        # If still too large, aggressively truncate content further
        if metadata_size > 40000:
            record['content'] = record.get('content', '')[:8000] + "... [Truncated]"
            record['chunk_text'] = record['chunk_text'][:8000]
            print(f"   🔧 Aggressively truncated {record['_id']} to fit within limits")
    
    return record

def create_pinecone_index(pc: Pinecone, index_name: str) -> None:
    """Create Pinecone index if it doesn't exist."""
    if not pc.has_index(index_name):
        print(f"🔧 Creating new index: {index_name}")
        
        pc.create_index_for_model(
            name=index_name,
            cloud="aws",
            region="us-east-1",
            embed={
                "model": "llama-text-embed-v2",
                "field_map": {"text": "chunk_text"}
            }
        )
        
        print("⏳ Waiting for index to be ready...")
        max_wait = 300  # 5 minutes max
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                index = pc.Index(index_name)
                stats = index.describe_index_stats()
                print(f"✅ Index {index_name} is ready!")
                break
            except Exception:
                print("   Index still initializing...")
                time.sleep(10)
        else:
            raise TimeoutError(f"Index {index_name} did not become ready within {max_wait} seconds")
    else:
        print(f"✅ Index {index_name} already exists")

def load_eu_articles(project_dir: str) -> List[Dict[str, Any]]:
    """Load EU AI Act articles."""
    print("\n📄 Loading EU AI Act Articles...")
    file_path = os.path.join(project_dir, 'eu_ai_act.json')
    articles_data = load_json_file(file_path)
    
    if not articles_data:
        print("   No articles found")
        return []
    
    records = []
    for article in articles_data:
        record = {
            "_id": str(article['id']),
            "chunk_text": f"{article['title']}. {article.get('summary', '')}. {article['content']}",
            "category": "article",
            "label": article['title'],
            "type": "article",
            "summary": article.get('summary', article['title']),
            "content": article['content'],
            "continent": article.get('continent', 'Europe'),
            "country": 'European Union',
            "sourceType": article.get('sourceType', 'Government'),
            "connected_to": article.get('connected_to', []),
            "url": article.get('url')
        }
        records.append(validate_record(record))
    
    print(f"   ✅ Loaded {len(records)} articles")
    return records

def load_eu_recitals(project_dir: str) -> List[Dict[str, Any]]:
    """Load EU AI Act recitals."""
    print("\n📄 Loading EU AI Act Recitals...")
    file_path = os.path.join(project_dir, 'test_recitals_1_to_180.json')
    recitals_data = load_json_file(file_path)
    
    if not recitals_data:
        print("   No recitals found")
        return []
    
    recitals = recitals_data.get('recitals', [])
    records = []
    
    for recital in recitals:
        record = {
            "_id": str(recital['id']),
            "chunk_text": f"{recital['title']}. {recital['content']}",
            "category": "recital",
            "label": recital['title'],
            "type": "recital",
            "summary": recital.get('title', ''),
            "content": recital['content'],
            "continent": recital.get('continent', 'Europe'),
            "country": 'European Union',
            "sourceType": recital.get('sourceType', 'Government'),
            "url": recital.get('url')
        }
        records.append(validate_record(record))
    
    print(f"   ✅ Loaded {len(records)} recitals")
    return records

def load_canadian_data() -> List[Dict[str, Any]]:
    """Load Canadian AI governance data."""
    print("\n📄 Loading Canadian AI Governance Data...")
    
    # Import the canadian_records from data_canada.py
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from data_canada import canadian_records
        
        # Validate each record
        validated_records = [validate_record(record) for record in canadian_records]
        print(f"   ✅ Loaded {len(validated_records)} Canadian records")
        return validated_records
    except ImportError as e:
        print(f"   ⚠️  Could not import canadian_data: {e}")
        return []
    except Exception as e:
        print(f"   ❌ Error loading Canadian data: {e}")
        return []

def load_iapp_data() -> List[Dict[str, Any]]:
    """Load IAPP AI governance articles."""
    print("\n📄 Loading IAPP Data...")
    
    # Define IAPP records inline (from more_data.py)
    # Article 1
    article_content_1 = """Ankit Gupta

Contributor

AIGP, CIPP/US, CIPM, FIP

9 Minute Read

Editor's note: The IAPP is policy neutral. We publish contributed opinion and analysis pieces to enable our members to hear a broad spectrum of views in our domains.

Artificial intelligence systems have rapidly transitioned from the lab to core business operations — bringing their associated risks along with them.

Not long ago, AI governance conversations centered on checklists for ethics, bias and model transparency. In 2025, governance teams find themselves confronted with real-time incidents that resemble those of cybersecurity or crisis management.

From AI models unpredictably drifting off course to employees inadvertently leaking data into chatbots, and even deepfakes duping staff — these risks are no longer hypothetical. They're happening, often in highly regulated environments where they were least expected."""
    
    record1 = {
        "_id": 'IAPP_1',
        "chunk_text": "Model drift, data leaks and deepfakes: Rethinking AI governance in the age of autonomous risk. " + article_content_1,
        "category": "guide",
        "label": "Model drift, data leaks and deepfakes: Rethinking AI governance in the age of autonomous risk",
        "type": "article",
        "summary": "Model drift, data leaks and deepfakes: Rethinking AI governance in the age of autonomous risk",
        "content": article_content_1,
        "continent": 'North America',
        "country": 'USA',
        "sourceType": 'NGO',
        "url": "https://iapp.org/news/a/model-drift-data-leaks-and-deepfakes-rethinking-ai-governance-in-the-age-of-autonomous-risk"
    }
    
    # Article 2
    article_content_2 = """US State AI Governance Legislation Tracker
This tracker focuses on cross-sectoral AI governance bills that apply to private sector organizations.

Last updated: 15 July 2025

As with seemingly every aspect of AI, legislative activity related to potential AI risks and harms has moved with unprecedented speed. Often it can take decades for policymakers to begin responding to new technologies with targeted laws. But after generative AI captured the world's attention, it took only a matter of months for U.S. state legislatures to consider responsive legislation."""
    
    record2 = {
        "_id": 'IAPP_2',
        "chunk_text": "US State AI Governance Legislation Tracker. " + article_content_2,
        "category": "tracker",
        "label": "US State AI Governance Legislation Tracker",
        "type": "article",
        "summary": "A comprehensive tracker monitoring unprecedented speed of US state AI legislation development, focusing on cross-sectoral laws directly impacting private sector organizations.",
        "content": article_content_2,
        "continent": 'North America',
        "country": 'USA',
        "sourceType": 'NGO',
        "url": "https://iapp.org/resources/article/us-state-ai-governance-legislation-tracker/"
    }
    
    records = [validate_record(record1), validate_record(record2)]
    print(f"   ✅ Loaded {len(records)} IAPP records")
    return records

def upload_records_batch(index, namespace: str, records: List[Dict[str, Any]], source_name: str) -> None:
    """Upload records to Pinecone in batches."""
    if not records:
        print(f"   ⚠️  No records to upload for {source_name}")
        return
    
    print(f"\n📤 Uploading {len(records)} {source_name} records...")
    
    batch_size = 90  # Stay under Pinecone's 96 limit
    total_records = len(records)
    
    for i in range(0, total_records, batch_size):
        batch = records[i:i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total_records + batch_size - 1) // batch_size
        
        print(f"   Batch {batch_num}/{total_batches} ({len(batch)} records)...")
        index.upsert_records(namespace, batch)
        
        # Small delay between batches
        if batch_num < total_batches:
            time.sleep(2)
    
    print(f"   ✅ {source_name} uploaded successfully")

def main():
    """Main upload function."""
    print("=" * 70)
    print("🚀 UNIFIED DATA UPLOAD TO PINECONE")
    print("=" * 70)
    
    # Environment Configuration
    config = {
        'api_key': os.getenv("PINECONE_API_KEY"),
        'index_name': os.getenv("PINECONE_INDEX_NAME", "network-graph"),
        'namespace': os.getenv("PINECONE_NAMESPACE", "example-namespace"),
    }
    
    if not config['api_key']:
        print("❌ PINECONE_API_KEY environment variable not set")
        return 1
    
    try:
        # Initialize Pinecone
        print("\n🔌 Connecting to Pinecone...")
        pc = Pinecone(api_key=config['api_key'])
        
        # Create index if needed
        create_pinecone_index(pc, config['index_name'])
        
        # Target the index
        index = pc.Index(config['index_name'])
        
        # Get project directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        
        # Load all data sources
        print("\n" + "=" * 70)
        print("📚 LOADING DATA SOURCES")
        print("=" * 70)
        
        eu_articles = load_eu_articles(project_dir)
        eu_recitals = load_eu_recitals(project_dir)
        canadian_data = load_canadian_data()
        iapp_data = load_iapp_data()
        
        # Upload all data sources
        print("\n" + "=" * 70)
        print("📤 UPLOADING TO PINECONE")
        print("=" * 70)
        
        upload_records_batch(index, config['namespace'], eu_articles, "EU Articles")
        upload_records_batch(index, config['namespace'], eu_recitals, "EU Recitals")
        upload_records_batch(index, config['namespace'], canadian_data, "Canadian Data")
        upload_records_batch(index, config['namespace'], iapp_data, "IAPP Data")
        
        # Wait for indexing
        print("\n⏳ Waiting for indexing to complete...")
        time.sleep(10)
        
        # Display stats
        print("\n" + "=" * 70)
        print("📊 UPLOAD STATISTICS")
        print("=" * 70)
        
        stats = index.describe_index_stats()
        total_uploaded = len(eu_articles) + len(eu_recitals) + len(canadian_data) + len(iapp_data)
        
        print(f"\n✅ Successfully uploaded {total_uploaded} total records!")
        print(f"\nIndex Statistics:")
        print(f"  • Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"  • Namespace '{config['namespace']}': {stats.get('namespaces', {}).get(config['namespace'], {}).get('vector_count', 0)} vectors")
        print(f"  • Dimension: {stats.get('dimension', 'unknown')}")
        print(f"  • Index fullness: {stats.get('index_fullness', 0):.1%}")
        
        print("\n" + "=" * 70)
        print("🎉 ALL DATA UPLOADED SUCCESSFULLY!")
        print("=" * 70)
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Upload failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
import json
import os
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
        print(f"Warning: {file_path} not found")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from {file_path}: {e}")
        return None

def validate_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Validate that a record has required fields."""
    if not record.get('_id') or not record.get('chunk_text'):
        raise ValueError('Record must have _id and chunk_text fields')
    return record

def create_pinecone_index(pc: Pinecone, index_name: str) -> None:
    """Create Pinecone index if it doesn't exist (following official docs pattern)."""
    # Check if index exists using has_index method from docs
    if not pc.has_index(index_name):
        print(f"Creating new index: {index_name}")
        
        # Use create_index_for_model as shown in official docs
        pc.create_index_for_model(
            name=index_name,
            cloud="aws",
            region="us-east-1",
            embed={
                "model": "llama-text-embed-v2",  # Using model from docs
                "field_map": {"text": "chunk_text"}  # Note: field_map not fieldMap in Python
            }
        )
        
        # Wait for index to be ready (manual wait since no waitUntilReady in Python)
        print("Waiting for index to be ready...")
        max_wait = 300  # 5 minutes max
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                # Try to get index stats to check if ready
                index = pc.Index(index_name)
                stats = index.describe_index_stats()
                print(f"Index {index_name} is ready!")
                break
            except Exception:
                print("Index still initializing...")
                time.sleep(10)
        else:
            raise TimeoutError(f"Index {index_name} did not become ready within {max_wait} seconds")
    else:
        print(f"Index {index_name} already exists")

def upload_to_pinecone() -> None:
    """Upload EU data to Pinecone following official documentation patterns."""
    
    # Environment Configuration
    config = {
        'api_key': os.getenv("PINECONE_API_KEY"),
        'index_name': os.getenv("PINECONE_INDEX_NAME", "network-graph"),
        'namespace': os.getenv("PINECONE_NAMESPACE", "example-namespace"),  # Using example-namespace from docs
    }
    
    if not config['api_key']:
        raise ValueError("PINECONE_API_KEY environment variable not set")
    
    # Initialize Pinecone client (following docs pattern)
    pc = Pinecone(api_key=config['api_key'])
    
    # Create index if needed
    create_pinecone_index(pc, config['index_name'])
    
    # Target the index (following docs pattern)
    index = pc.Index(config['index_name'])
    
    # Load JSON files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    
    eu_ai_act_path = os.path.join(project_dir, 'eu_ai_act.json')
    recitals_path = os.path.join(project_dir, 'test_recitals_1_to_180.json')
    
    # Load data
    articles_data = load_json_file(eu_ai_act_path)
    recitals_data = load_json_file(recitals_path)
    
    articles = articles_data if articles_data else []
    recitals = recitals_data.get('recitals', []) if recitals_data else []
    
    print(f"Loaded {len(articles)} articles and {len(recitals)} recitals")
    
    # Prepare records for Pinecone (following docs structure)
    records = []
    
    # Process articles
    for article in articles:
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
            "sourceType": article.get('sourceType', 'Government')
        }
        records.append(validate_record(record))
    
    # Process recitals
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
            "sourceType": recital.get('sourceType', 'Government')
        }
        records.append(validate_record(record))
    
    if not records:
        print("No records to upload. Please check your JSON files.")
        return
    
    print(f"Uploading {len(records)} records to Pinecone...")
    
    try:
        # Upsert records in batches (Pinecone limit: 96 records per batch)
        batch_size = 90  # Stay under the 96 limit
        total_records = len(records)
        
        for i in range(0, total_records, batch_size):
            batch = records[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total_records + batch_size - 1) // batch_size
            
            print(f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
            index.upsert_records(config['namespace'], batch)
            
            # Small delay between batches to avoid rate limits
            if batch_num < total_batches:
                time.sleep(2)
        
        print("All records uploaded successfully")
        
        # Wait for the upserted vectors to be indexed (from docs)
        print("Waiting for indexing to complete...")
        time.sleep(10)
        
        # View stats for the index (following docs pattern)
        stats = index.describe_index_stats()
        print("Upload Statistics:")
        print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"  Namespace '{config['namespace']}': {stats.get('namespaces', {}).get(config['namespace'], {}).get('vector_count', 0)} vectors")
        print(f"  Dimension: {stats.get('dimension', 'unknown')}")
        print(f"  Index fullness: {stats.get('index_fullness', 0):.1%}")
        
        print("Upload complete!")
        
    except Exception as e:
        print(f"Error during upload: {e}")
        raise

def test_search(index_name: str, namespace: str) -> None:
    """Test search functionality following docs patterns."""
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(index_name)
    
    # Define test query (similar to docs example)
    query = "European Union artificial intelligence regulation"
    
    print(f"\nTesting search with query: '{query}'")
    
    try:
        # Search the index (following docs pattern)
        results = index.search(
            namespace=namespace,
            query={
                "top_k": 5,
                "inputs": {
                    'text': query
                }
            }
        )
        
        # Print the results (following docs format)
        print("Search Results:")
        for hit in results['result']['hits']:
            print(f"  ID: {hit['_id']:<10} | Score: {hit['_score']:.3f} | Category: {hit['fields']['category']:<10}")
            print(f"       Text: {hit['fields']['chunk_text'][:100]}...")
            print()
            
    except Exception as e:
        print(f"Search test failed: {e}")

def main():
    """Main function to run the upload and test."""
    try:
        # Upload data
        upload_to_pinecone()
        
        # Test search functionality
        config = {
            'index_name': os.getenv("PINECONE_INDEX_NAME", "network-graph"),
            'namespace': os.getenv("PINECONE_NAMESPACE", "example-namespace"),
        }
        
        test_search(config['index_name'], config['namespace'])
        
    except Exception as e:
        print(f"Upload failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
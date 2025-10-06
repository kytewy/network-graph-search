#!/usr/bin/env python3
import os
import json
from typing import Dict, Any, List
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_pinecone_search():
    """Test Pinecone search functionality with the uploaded data."""
    # Environment Configuration
    config = {
        'api_key': os.getenv("PINECONE_API_KEY"),
        'index_name': os.getenv("PINECONE_INDEX_NAME", "network-graph"),
        'namespace': os.getenv("PINECONE_NAMESPACE", "example-namespace"),
    }
    
    if not config['api_key']:
        raise ValueError("PINECONE_API_KEY environment variable not set")
    
    # Initialize Pinecone client
    pc = Pinecone(api_key=config['api_key'])
    
    # Target the index
    index = pc.Index(config['index_name'])
    
    # Define test queries
    test_queries = [
        "artificial intelligence regulation",
        "data privacy requirements",
        "high-risk AI systems",
        "transparency obligations"
    ]
    
    print("Testing Pinecone search functionality...\n")
    
    for query in test_queries:
        print(f"Query: '{query}'")
        
        try:
            # Search the index
            results = index.search(
                namespace=config['namespace'],
                query={
                    "top_k": 5,
                    "inputs": {
                        'text': query
                    }
                }
            )
            
            # Print the results
            print(f"Found {len(results['result']['hits'])} results:")
            for i, hit in enumerate(results['result']['hits'], 1):
                print(f"  {i}. ID: {hit['_id']:<10} | Score: {hit['_score']:.3f}")
                print(f"     Type: {hit['fields'].get('type', 'unknown')} | Category: {hit['fields'].get('category', 'unknown')}")
                text = hit['fields'].get('chunk_text', '')
                if text:
                    print(f"     Text: {text[:100]}...")
                print()
                
        except Exception as e:
            print(f"Search failed: {e}")
        
        print("-" * 50)
    
    # Test index stats
    try:
        stats = index.describe_index_stats()
        print("\nIndex Statistics:")
        print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"  Namespace '{config['namespace']}': {stats.get('namespaces', {}).get(config['namespace'], {}).get('vector_count', 0)} vectors")
        print(f"  Dimension: {stats.get('dimension', 'unknown')}")
        print(f"  Index fullness: {stats.get('index_fullness', 0):.1%}")
    except Exception as e:
        print(f"Error getting index stats: {e}")

if __name__ == "__main__":
    test_pinecone_search()

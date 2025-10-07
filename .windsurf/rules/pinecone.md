---
trigger: manual
---

# Pinecone Vector Database Rule for Windsurf

## Overview

This rule helps you work with Pinecone vector databases, including index creation, data upserting, searching, and filtering operations.

## Prerequisites

- Install the Pinecone client: `npm install @pinecone-database/pinecone`
- Have a Pinecone API key ready
- Understand your cloud provider and region preferences

## Core Setup Pattern

### 1. Initialize Pinecone Client

\`\`\`javascript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
	apiKey: process.env.PINECONE_API_KEY || 'YOUR_API_KEY',
});
\`\`\`

### 2. Create Index with Integrated Embedding

\`\`\`javascript
const indexName = 'your-index-name';
await pc.createIndexForModel({
	name: indexName,
	cloud: 'aws', // or 'gcp', 'azure'
	region: 'us-east-1', // choose appropriate region
	embed: {
		model: 'llama-text-embed-v2', // or other supported models
		fieldMap: {
			text: 'chunk_text', // maps input field to record field
		},
	},
	waitUntilReady: true,
});
\`\`\`

## Data Operations

### 3. Target Index and Namespace

\`\`\`javascript
const index = pc.index(indexName).namespace('your-namespace');
\`\`\`

### 4. Upsert Records

\`\`\`javascript
// Records should have structure: { _id, chunk_text, category, ...metadata }
await index.upsertRecords(records);

// Wait for indexing (adjust time based on data size)
await new Promise((resolve) => setTimeout(resolve, 10000));
\`\`\`

### 5. Check Index Stats

\`\`\`javascript
const stats = await index.describeIndexStats();
console.log(`Total records: ${stats.totalRecordCount}`);
\`\`\`

## Search Operations

### 6. Basic Search with Text

\`\`\`javascript
const searchResults = await index.searchRecords({
	query: {
		topK: 10,
		inputs: { text: 'your search query' },
	},
	fields: ['chunk_text', 'category'], // specify fields to return
});
\`\`\`

### 7. Search with Metadata Filtering

\`\`\`javascript
const filteredResults = await index.searchRecords({
	query: {
		topK: 5,
		inputs: { text: 'your query' },
		filter: {
			category: 'science', // exact match
			// or use operators: { category: { "$eq": "science" } }
		},
	},
	fields: ['chunk_text', 'category'],
});
\`\`\`

### 8. Advanced Filtering with Operators

\`\`\`javascript
const advancedFilter = {
	$and: [
		{ category: { $in: ['science', 'physics'] } },
		{ year: { $gte: 2020 } },
	],
};

const results = await index.searchRecords({
	query: {
		topK: 10,
		inputs: { text: 'query' },
		filter: advancedFilter,
	},
});
\`\`\`

### 9. Search with Reranking

\`\`\`javascript
const rerankedResults = await index.searchRecords({
	query: {
		topK: 10,
		inputs: { text: 'your query' },
	},
	rerank: {
		model: 'bge-reranker-v2-m3',
		topN: 5,
		rankFields: ['chunk_text'],
	},
});
\`\`\`

## Best Practices

### Error Handling

\`\`\`javascript
try {
	const results = await index.searchRecords({
		query: { topK: 5, inputs: { text: query } },
	});
	return results;
} catch (error) {
	console.error('Pinecone search failed:', error);
	throw error;
}
\`\`\`

### Environment Configuration

\`\`\`javascript
// Use environment variables for configuration
const config = {
	apiKey: process.env.PINECONE_API_KEY,
	indexName: process.env.PINECONE_INDEX_NAME || 'default-index',
	namespace: process.env.PINECONE_NAMESPACE || 'default-namespace',
	cloud: process.env.PINECONE_CLOUD || 'aws',
	region: process.env.PINECONE_REGION || 'us-east-1',
};
\`\`\`

### Data Validation

\`\`\`javascript
function validateRecord(record) {
	if (!record._id || !record.chunk_text) {
		throw new Error('Record must have _id and chunk_text fields');
	}
	return record;
}
\`\`\`

## Common Filter Operators Reference

| Operator  | Purpose               | Example                                       |
| --------- | --------------------- | --------------------------------------------- |
| `$eq`     | Equals                | `{ "category": { "$eq": "science" } }`        |
| `$ne`     | Not equals            | `{ "category": { "$ne": "drama" } }`          |
| `$gt`     | Greater than          | `{ "year": { "$gt": 2020 } }`                 |
| `$gte`    | Greater than or equal | `{ "year": { "$gte": 2020 } }`                |
| `$lt`     | Less than             | `{ "score": { "$lt": 0.8 } }`                 |
| `$lte`    | Less than or equal    | `{ "score": { "$lte": 0.9 } }`                |
| `$in`     | In array              | `{ "genre": { "$in": ["comedy", "drama"] } }` |
| `$nin`    | Not in array          | `{ "genre": { "$nin": ["horror"] } }`         |
| `$exists` | Field exists          | `{ "metadata": { "$exists": true } }`         |
| `$and`    | Logical AND           | `{ "$and": [condition1, condition2] }`        |
| `$or`     | Logical OR            | `{ "$or": [condition1, condition2] }`         |

## Usage Examples

### Complete Workflow Example

\`\`\`javascript
async function pineconeWorkflow() {
	// 1. Initialize
	const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

	// 2. Create or connect to index
	const indexName = 'knowledge-base';
	const index = pc.index(indexName).namespace('docs');

	// 3. Search with filter
	const results = await index.searchRecords({
		query: {
			topK: 5,
			inputs: { text: 'machine learning algorithms' },
			filter: { category: 'science' },
		},
		fields: ['chunk_text', 'category'],
	});

	// 4. Process results
	results.result.hits.forEach((hit) => {
		console.log(`Score: ${hit.score.toFixed(3)}`);
		console.log(`Text: ${hit.fields.chunk_text}`);
		console.log(`Category: ${hit.fields.category}`);
		console.log('---');
	});
}
\`\`\`

## When to Use This Rule

1. **Vector Search Applications**: Building semantic search, RAG systems, recommendation engines
2. **Knowledge Bases**: Storing and querying document chunks or knowledge articles
3. **Content Discovery**: Finding similar content based on semantic meaning
4. **Filtering Requirements**: When you need to combine vector similarity with metadata filtering
5. **Reranking Needs**: When you want to improve search relevance with reranking models

## Notes

- Always use environment variables for API keys
- Wait for indexing after upserts (especially for large datasets)
- Use namespaces to organize different data sets
- Consider using reranking for better search quality
- Monitor index stats to understand usage and performance

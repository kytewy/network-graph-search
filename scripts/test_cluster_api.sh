#!/bin/bash
# Test script for cluster analysis API
# Usage: bash test_cluster_api.sh

echo "Testing /api/cluster-analysis endpoint..."
echo ""

curl -X POST http://localhost:3000/api/cluster-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "id": "1",
        "label": "Getting Started",
        "content": "Introduction to the API and basic concepts",
        "type": "document"
      },
      {
        "id": "2",
        "label": "API Overview",
        "content": "Complete reference for all API endpoints",
        "type": "document"
      },
      {
        "id": "3",
        "label": "Authentication",
        "content": "How to authenticate API requests using tokens",
        "type": "document"
      },
      {
        "id": "4",
        "label": "Security",
        "content": "Best practices for securing your API integration",
        "type": "document"
      },
      {
        "id": "5",
        "label": "Rate Limits",
        "content": "Understanding rate limiting policies and quotas",
        "type": "document"
      },
      {
        "id": "6",
        "label": "Error Handling",
        "content": "How to handle API errors gracefully",
        "type": "document"
      },
      {
        "id": "7",
        "label": "Webhooks",
        "content": "Setting up webhooks to receive real-time notifications",
        "type": "document"
      },
      {
        "id": "8",
        "label": "Pagination",
        "content": "Handling large result sets with pagination",
        "type": "document"
      },
      {
        "id": "9",
        "label": "Versioning",
        "content": "API versioning strategy and migration guide",
        "type": "document"
      },
      {
        "id": "10",
        "label": "Performance",
        "content": "Tips for optimizing API performance and reducing latency",
        "type": "document"
      }
    ]
  }' | python -m json.tool

echo ""
echo "Test complete!"

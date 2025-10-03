#!/usr/bin/env python3
"""
CLI wrapper for BERTopic clustering analysis.
Reads JSON from stdin, performs clustering, outputs JSON to stdout.

This is the entry point called by the Next.js API route.
"""

import sys
import json
from analyzer import perform_cluster_analysis


if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        nodes = data.get('nodes', [])
        
        if not nodes:
            result = {
                "success": False,
                "error": "No nodes provided"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        # Perform clustering
        result = perform_cluster_analysis(nodes)
        
        # Check if there was an error
        if 'error' in result:
            output = {
                "success": False,
                "error": result['error'],
                "clusterAssignments": result.get('clusterAssignments', {}),
                "clusters": result.get('clusters', []),
                "executiveSummary": result.get('executiveSummary', '')
            }
        else:
            output = {
                "success": True,
                **result,
                "metadata": {
                    "totalNodes": len(nodes),
                    "numClusters": len(result.get('clusters', [])),
                    "isMockData": False
                }
            }
        
        # Output result as JSON
        print(json.dumps(output))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Clustering failed: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.exit(1)

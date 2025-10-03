"""
Simple clustering for network graph nodes.

Strategy: Always use TF-IDF + KMeans. No transformers, no UMAP.
Fast, predictable, good enough for documentation clustering.
"""

from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans


def perform_cluster_analysis(nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Cluster nodes by content similarity.
    
    Returns cluster assignments and topic keywords.
    """
    
    # Extract text content
    documents = []
    node_ids = []
    
    for node in nodes:
        content = node.get('content') or node.get('summary') or node.get('label', '')
        if content:
            documents.append(content)
            node_ids.append(node['id'])
    
    # Need minimum documents
    if len(documents) < 5:
        return {
            'error': 'Need at least 5 nodes',
            'clusterAssignments': {},
            'clusters': [],
            'executiveSummary': 'Not enough nodes for clustering.',
            'metadata': {'totalNodes': len(documents), 'numClusters': 0}
        }
    
    # Vectorize documents
    vectorizer = TfidfVectorizer(
        max_features=100,
        ngram_range=(1, 2),
        stop_words='english',
        min_df=1
    )
    X = vectorizer.fit_transform(documents)
    
    # Cluster with KMeans
    n_clusters = min(5, max(2, len(documents) // 4))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(X)
    
    # Extract top keywords per cluster
    feature_names = vectorizer.get_feature_names_out()
    clusters_data = {}
    
    for cluster_id in range(n_clusters):
        top_idx = kmeans.cluster_centers_[cluster_id].argsort()[-5:][::-1]
        keywords = [feature_names[i] for i in top_idx]
        
        clusters_data[cluster_id] = {
            'id': f"cluster_{cluster_id}",
            'nodeIds': [],
            'keywords': keywords
        }
    
    # Assign nodes to clusters
    cluster_assignments = {}
    for node_id, label in zip(node_ids, labels):
        cluster_id = f"cluster_{label}"
        cluster_assignments[node_id] = cluster_id
        clusters_data[label]['nodeIds'].append(node_id)
    
    # Build response
    clusters = []
    for cid, data in clusters_data.items():
        clusters.append({
            'cluster_id': data['id'],
            'label': f"Topic {cid}",
            'size': len(data['nodeIds']),
            'top_terms': data['keywords'],
            'description': f"Documents about: {', '.join(data['keywords'][:3])}",
            'node_ids': data['nodeIds']
        })
    
    # Summary
    summary = f"# Cluster Analysis\n\nFound **{len(clusters)} clusters** from {len(documents)} nodes.\n\n"
    for c in clusters:
        summary += f"- **{c['label']}** ({c['size']} nodes): {', '.join(c['top_terms'][:3])}\n"
    
    return {
        'success': True,
        'cluster_assignments': cluster_assignments,
        'clusters': clusters,
        'executive_summary': summary,
        'metadata': {
            'total_nodes': len(documents),
            'num_clusters': len(clusters)
        }
    }
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimilarityHistogram } from '@/components/similarity-histogram';
import { useUnifiedSearchStore } from '@/lib/stores/unified-search-store';
import { useNetworkStore } from '@/lib/stores/network-store';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
	() => import('reagraph').then((m) => m.GraphCanvas),
	{ ssr: false }
);

// Define the allowed layout types for Reagraph
type LayoutType =
	| 'forceDirected2d'
	| 'forceDirected3d'
	| 'hierarchical'
	| 'radial'
	| 'forceAtlas2'
	| 'noOverlap';

// Define the type for the GraphCanvas layoutType prop (remove concentric as it's not supported)
type GraphCanvasLayoutType =
	| 'forceDirected2d'
	| 'forceDirected3d'
	| 'hierarchical'
	| 'radial'
	| 'forceAtlas2'
	| 'noOverlap';

// Network Graph Canvas component that reads directly from the network store
const NetworkGraphCanvas = ({
	graphRef,
}: {
	graphRef: React.RefObject<GraphCanvasRef>;
}) => {
	const networkNodes = useNetworkStore((state) => state.nodes);
	const networkLinks = useNetworkStore((state) => state.links);
	const [layoutType, setLayoutType] =
		useState<GraphCanvasLayoutType>('forceDirected2d');

	// Convert network store nodes to Reagraph nodes with safety checks
	const graphNodes = useMemo(() => {
		if (!networkNodes || networkNodes.length === 0) return [];

		return networkNodes.map((node) => ({
			id: node.id,
			label: node.label || node.id,
			fill: node.category === 'article' ? '#4f46e5' : '#10b981',
			size: Math.max(4, Math.min(20, (node.score || 0.5) * 15)), // Ensure size is within bounds
			score: node.score || 0.5,
			category: node.category || '',
			data: node,
		}));
	}, [networkNodes]);

	// Convert network store links to Reagraph edges with safety checks
	const graphEdges = useMemo(() => {
		if (!networkLinks || networkLinks.length === 0) return [];

		return networkLinks.map((link) => ({
			id: link.id || `${link.source}-${link.target}`,
			source: link.source,
			target: link.target,
			label: link.label || '',
			type: link.type || 'default',
			data: link,
		}));
	}, [networkLinks]);

	// Only use selection when we have valid graph data
	const selectionConfig = useMemo(() => {
		if (graphNodes.length === 0) {
			return { selections: [], onNodeClick: () => {}, onCanvasClick: () => {} };
		}

		return {
			ref: graphRef,
			nodes: graphNodes,
			edges: graphEdges,
		};
	}, [graphNodes, graphEdges, graphRef]);

	// Selection handling - only when we have data
	const { selections, onNodeClick, onCanvasClick } =
		useSelection(selectionConfig);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">
					Network Graph: {graphNodes.length} nodes, {graphEdges.length} edges
				</h3>
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-600">Layout:</span>
					<select
						className="border rounded p-1 text-sm"
						value={layoutType}
						onChange={(e) =>
							setLayoutType(e.target.value as GraphCanvasLayoutType)
						}>
						<option value="forceDirected2d">Force Directed 2D</option>
						<option value="forceDirected3d">Force Directed 3D</option>
						<option value="radial">Radial</option>
						<option value="hierarchical">Hierarchical</option>
						<option value="forceAtlas2">Force Atlas 2</option>
						<option value="noOverlap">No Overlap</option>
					</select>
				</div>
			</div>

			<div className="h-[500px] w-full border rounded bg-gray-50 overflow-hidden relative">
				{graphNodes.length > 0 ? (
					<div className="absolute inset-0">
						<GraphCanvas
							ref={graphRef}
							nodes={graphNodes}
							edges={graphEdges}
							layoutType={layoutType}
							layoutOverrides={{
								linkDistance: 80,
								nodeStrength: -250,
								gravity: 0.5,
							}}
							selections={selections || []}
							onNodeClick={onNodeClick}
							onCanvasClick={onCanvasClick}
							sizingType="attribute"
							sizingAttribute="score"
							minNodeSize={4}
							maxNodeSize={16}
							labelType="auto"
							edgeStyle="curved"
							// clusterAttribute="category"
							animated={false} // Disable animation initially to prevent errors
							cameraMode="pan"
						/>
					</div>
				) : (
					<div className="flex items-center justify-center h-full text-gray-500">
						No graph data available. Try a different search query.
					</div>
				)}
			</div>
		</div>
	);
};

/**
 * Simple search panel that displays raw Pinecone response with reranking
 */
export default function SimpleSearchPanel() {
	const [query, setQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [rawResponse, setRawResponse] = useState<any>(null);
	const [rerankedResponse, setRerankedResponse] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [filteredNodes, setFilteredNodes] = useState<any[]>([]);
	const [processedResults, setProcessedResults] = useState<any[]>([]);
	const [topK, setTopK] = useState<number>(10);
	const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
	const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
	const [layoutType, setLayoutType] =
		useState<GraphCanvasLayoutType>('forceDirected2d');

	// Get network store data for graph visualization
	const networkNodes = useNetworkStore((state) => state.nodes);
	const networkLinks = useNetworkStore((state) => state.links);
	const setNetworkNodes = useNetworkStore((state) => state.setNodes);
	const setNetworkLinks = useNetworkStore((state) => state.setLinks);

	// Reference for the graph canvas
	const graphRef = useRef<GraphCanvasRef | null>(null);

	// Create memoized graph data for selection hook
	const memoizedGraphNodes = useMemo(() => {
		if (!networkNodes || networkNodes.length === 0) return [];

		return networkNodes.map((node) => ({
			id: node.id,
			label: node.label || node.id,
			fill: node.category === 'article' ? '#4f46e5' : '#10b981',
			size: Math.max(4, Math.min(20, (node.score || 0.5) * 15)),
			score: node.score || 0.5,
			category: node.category || '',
			data: node,
		}));
	}, [networkNodes]);

	const memoizedGraphEdges = useMemo(() => {
		if (!networkLinks || networkLinks.length === 0) return [];

		return networkLinks.map((link) => ({
			id: link.id || `${link.source}-${link.target}`,
			source: link.source,
			target: link.target,
			label: link.label || '',
			type: link.type || 'default',
			data: link,
		}));
	}, [networkLinks]);

	// Safe selection configuration
	const selectionConfig = useMemo(() => {
		if (memoizedGraphNodes.length === 0) {
			return { selections: [], onNodeClick: () => {}, onCanvasClick: () => {} };
		}

		return {
			ref: graphRef,
			nodes: memoizedGraphNodes,
			edges: memoizedGraphEdges,
		};
	}, [memoizedGraphNodes, memoizedGraphEdges]);

	// Use useSelection with safety checks
	const { selections, onNodeClick, onCanvasClick } =
		useSelection(selectionConfig);

	// Connect to unified search store
	const setSearchTerm = useUnifiedSearchStore((state) => state.setSearchTerm);
	const setHasSearched = useUnifiedSearchStore((state) => state.setHasSearched);
	const setSearchResultNodes = useUnifiedSearchStore(
		(state) => state.setSearchResultNodes
	);
	const selectedSimilarityRange = useUnifiedSearchStore(
		(state) => state.selectedSimilarityRange || []
	);

	// Process API response to extract and normalize scores
	const processApiResponse = (data: any) => {
		if (!data) return [];

		let results = [];

		// Check if the response has a rawResponse.result.hits structure (Pinecone format)
		if (
			data.rawResponse?.result?.hits &&
			Array.isArray(data.rawResponse.result.hits)
		) {
			results = data.rawResponse.result.hits.map((hit: any) => ({
				id: hit._id,
				score: hit._score,
				label: hit.fields?.label || hit._id,
				category: hit.fields?.category || '',
				type: hit.fields?.type || '',
				text: hit.fields?.chunk_text || hit.fields?.content || '',
				summary: hit.fields?.summary || '',
				content: hit.fields?.content || '',
				fields: hit.fields || {},
			}));
		} else if (data.results && Array.isArray(data.results)) {
			results = data.results;
		}

		return results;
	};

	// Effect to filter nodes based on selected similarity ranges
	useEffect(() => {
		const safeProcessedResults = processedResults || [];
		const safeRanges = selectedSimilarityRange || [];

		if (safeProcessedResults.length > 0) {
			let nodes = [...safeProcessedResults];

			if (safeRanges.length > 0) {
				nodes = nodes.filter((node: any) => {
					const similarity = Math.round((node?.score || 0) * 100);

					return safeRanges.some((range) => {
						switch (range) {
							case '<20':
								return similarity >= 0 && similarity <= 19;
							case '21-40':
								return similarity >= 20 && similarity <= 40;
							case '41-60':
								return similarity >= 41 && similarity <= 60;
							case '61-80':
								return similarity >= 61 && similarity <= 80;
							case '81-100':
								return similarity >= 81 && similarity <= 100;
							default:
								return false;
						}
					});
				});
			}

			setFilteredNodes(nodes);
		} else {
			setFilteredNodes([]);
		}
	}, [processedResults, selectedSimilarityRange]);

	const handleSearch = async () => {
		if (!query.trim()) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/reranked-vector-search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, topK }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Search failed');
			}

			setRerankedResponse(data);
			setRawResponse(data.rawResponse);

			const results = processApiResponse(data);
			setProcessedResults(results);

			// Update unified search store
			setSearchTerm(query);
			setHasSearched(true);
			setSearchResultNodes(results);
			setFilteredNodes(results);

			// Update network store with the search results
			if (
				data &&
				data.rawResponse &&
				data.rawResponse.result &&
				data.rawResponse.result.hits
			) {
				const hits = data.rawResponse.result.hits;

				// Create nodes for network store
				const nodes = hits.map((hit: any) => ({
					id: hit._id,
					label: hit.fields?.label || hit._id,
					score: hit._score || 0.5,
					category: hit.fields?.category || '',
					type: hit.fields?.type || '',
					summary: hit.fields?.summary || '',
					data: hit.fields,
				}));

				// Create edges for network store
				const nodeIds = new Set(nodes.map((node: any) => node.id));
				const links: any[] = [];

				hits.forEach((hit: any) => {
					const connectedTo = hit.fields?.connected_to || [];
					if (Array.isArray(connectedTo)) {
						connectedTo.forEach((targetId: string) => {
							if (nodeIds.has(targetId)) {
								links.push({
									id: `${hit._id}-${targetId}`,
									source: hit._id,
									target: targetId,
									label: `${hit.fields?.label || hit._id} → ${targetId}`,
									type: 'connected',
									weight: 1,
								});
							}
						});
					}
				});

				// Update network store
				setNetworkNodes(nodes);
				setNetworkLinks(links);

				// Also update local state for backward compatibility
				setGraphNodes(
					nodes.map((node: any) => ({
						...node,
						fill: node.category === 'article' ? '#4f46e5' : '#10b981',
						size: Math.max(4, Math.min(20, node.score * 15)),
					}))
				);
				setGraphEdges(links);
			}
		} catch (err: any) {
			console.error('Search error:', err);
			setError(err.message || 'An error occurred during search');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 p-4 w-full">
			<h2 className="text-xl font-bold">Reranked Vector Search</h2>

			<div className="flex flex-col gap-2">
				<div className="flex gap-2">
					<Input
						placeholder="Enter search query..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
						className="flex-1"
					/>
					<Button onClick={handleSearch} disabled={isLoading}>
						{isLoading ? 'Searching...' : 'Search'}
					</Button>
				</div>

				<div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
					<span className="text-sm text-gray-600">Results to fetch:</span>
					<div className="flex items-center">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTopK(Math.max(5, topK - 5))}
							disabled={topK <= 5}
							className="h-8 w-8 p-0">
							-
						</Button>
						<span className="mx-2 font-medium">{topK}</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTopK(topK + 5)}
							className="h-8 w-8 p-0">
							+
						</Button>
					</div>
				</div>
			</div>

			{rerankedResponse && (
				<div className="mt-4 p-4 border rounded-md bg-gray-50">
					<h3 className="text-lg font-semibold mb-3">Filter by Similarity</h3>
					<p className="text-sm text-gray-600 mb-3">
						Click on bars to filter results by similarity score
					</p>
					<SimilarityHistogram filteredNodes={processedResults || []} />
				</div>
			)}

			{error && (
				<div className="text-red-500 p-2 bg-red-50 rounded">Error: {error}</div>
			)}

			{rerankedResponse && (
				<Tabs defaultValue="network-graph" className="w-full mt-4">
					<TabsList>
						<TabsTrigger value="network-graph">Network Graph</TabsTrigger>
						<TabsTrigger value="results">Search Results</TabsTrigger>
						<TabsTrigger value="api">API Response</TabsTrigger>
						<TabsTrigger value="raw">Raw Response</TabsTrigger>
					</TabsList>

					<TabsContent value="network-graph" className="mt-2">
						<Card className="p-4">
							<NetworkGraphCanvas graphRef={graphRef} />
						</Card>
					</TabsContent>

					<TabsContent value="results" className="mt-2">
						<Card className="p-4 overflow-auto max-h-[500px]">
							<h3 className="text-lg font-semibold mb-2">
								Search Results: {filteredNodes?.length || 0} of{' '}
								{processedResults?.length || 0}
							</h3>
							{filteredNodes.map((result: any, index: number) => (
								<div key={result.id} className="mb-4 p-3 border rounded">
									<div className="flex justify-between">
										<span className="font-semibold">
											#{index + 1} - {result.label || result.id}
										</span>
										<span className="text-sm bg-blue-100 px-2 py-1 rounded">
											Score: {result.score ? result.score.toFixed(4) : 'N/A'}
										</span>
									</div>
									<div className="text-sm text-gray-500 mt-1">
										Category: {result.category || 'Unknown'} | Type:{' '}
										{result.type || 'Unknown'}
									</div>
									<p className="mt-2 text-sm">
										{result.text?.substring(0, 200) ||
											result.content?.substring(0, 200) ||
											'No content available'}
										...
									</p>
								</div>
							))}
						</Card>
					</TabsContent>

					<TabsContent value="api" className="mt-2">
						<Card className="p-4 overflow-auto max-h-[500px]">
							<h3 className="text-lg font-semibold mb-2">API Response:</h3>
							<pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
								{JSON.stringify(rerankedResponse, null, 2)}
							</pre>
						</Card>
					</TabsContent>

					<TabsContent value="raw" className="mt-2">
						<Card className="p-4 overflow-auto max-h-[500px]">
							<h3 className="text-lg font-semibold mb-2">
								Raw Pinecone Response:
							</h3>
							<pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
								{JSON.stringify(rawResponse, null, 2)}
							</pre>
						</Card>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}

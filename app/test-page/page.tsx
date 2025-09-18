'use client';

import { useRef, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Using local histogram component with local state
import dynamic from 'next/dynamic';
import type { GraphCanvasRef } from 'reagraph';
import { useSelection } from 'reagraph';
import { useAppStore, type Node, type Link } from '@/lib/stores/app-state';

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

// Network Graph Canvas component using app store
const NetworkGraphCanvas = () => {
	const filteredResults = useAppStore((state) => state.filteredResults);
	const filteredLinks = useAppStore((state) => state.filteredLinks);
	const [layoutType, setLayoutType] = useState<LayoutType>('forceDirected2d');
	const graphRef = useRef<GraphCanvasRef | null>(null);

	// Convert nodes to Reagraph nodes
	const graphNodes = useMemo(() => {
		if (!filteredResults || filteredResults.length === 0) return [];

		return filteredResults.map((node) => ({
			id: node.id,
			label: node.label || node.id,
			fill: node.category === 'article' ? '#4f46e5' : '#10b981',
			size: Math.max(4, Math.min(20, (node.score || 0.5) * 15)), // Ensure size is within bounds
			score: node.score || 0.5,
			category: node.category || '',
			data: node,
		}));
	}, [filteredResults]);

	// Convert links to Reagraph edges
	const graphEdges = useMemo(() => {
		if (!filteredLinks || filteredLinks.length === 0) return [];

		return filteredLinks.map((link) => ({
			id: link.id || `${link.source}-${link.target}`,
			source: link.source,
			target: link.target,
			label: link.label || '',
			type: link.type || 'default',
			data: link,
		}));
	}, [filteredLinks]);

	// Selection configuration
	const selectionConfig = useMemo(() => {
		if (graphNodes.length === 0) {
			return { selections: [], onNodeClick: () => {}, onCanvasClick: () => {} };
		}

		return {
			ref: graphRef,
			nodes: graphNodes,
			edges: graphEdges,
		};
	}, [graphNodes, graphEdges]);

	// Selection handling
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
						onChange={(e) => setLayoutType(e.target.value as LayoutType)}>
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

// Main test page component
export default function TestPage() {
	// Get state and actions from app store
	const query = useAppStore((state) => state.query);
	const setQuery = useAppStore((state) => state.setQuery);
	const isLoading = useAppStore((state) => state.isLoading);
	const error = useAppStore((state) => state.error);
	const topK = useAppStore((state) => state.topK);
	const setTopK = useAppStore((state) => state.setTopK);
	const searchResults = useAppStore((state) => state.searchResults);
	const filteredResults = useAppStore((state) => state.filteredResults);
	const selectedSimilarityRanges = useAppStore(
		(state) => state.selectedSimilarityRanges
	);
	const clearSimilarityRanges = useAppStore(
		(state) => state.clearSimilarityRanges
	);
	const performSearch = useAppStore((state) => state.performSearch);

	// Handle search
	const handleSearch = () => {
		if (!query.trim()) return;
		performSearch(query, topK);
	};

	return (
		<div className="flex flex-col gap-6 p-6 w-full">
			<h1 className="text-2xl font-bold">Search and Visualization Test Page</h1>

			{/* Search Section */}
			<Card className="p-4">
				<h2 className="text-xl font-semibold mb-4">Search</h2>
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
			</Card>

			{error && (
				<div className="text-red-500 p-2 bg-red-50 rounded">Error: {error}</div>
			)}

			{/* Similarity Histogram Section */}
			{searchResults.length > 0 && (
				<Card className="p-4">
					<h2 className="text-xl font-semibold mb-2">Filter by Similarity</h2>
					<p className="text-sm text-gray-600 mb-3">
						Click on bars to filter results by similarity score.
						{selectedSimilarityRanges.length === 0
							? ' Currently showing all results.'
							: ` Currently filtering by: ${selectedSimilarityRanges.join(
									', '
							  )}`}
					</p>
					<AppSimilarityHistogram />
					<div className="mt-4 flex flex-wrap gap-2">
						{['<20', '21-40', '41-60', '61-80', '81-100'].map((range) => (
							<Button
								key={range}
								variant={
									selectedSimilarityRanges.includes(range)
										? 'default'
										: 'outline'
								}
								size="sm"
								onClick={() =>
									useAppStore.getState().toggleSimilarityRange(range)
								}
								className="text-xs">
								{range}%
							</Button>
						))}
						{selectedSimilarityRanges.length > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => clearSimilarityRanges()}
								className="text-xs ml-auto">
								Clear Filters
							</Button>
						)}
					</div>
				</Card>
			)}

			{/* Results Section */}
			{searchResults.length > 0 && (
				<Tabs defaultValue="network" className="w-full">
					<TabsList>
						<TabsTrigger value="network">Network Graph</TabsTrigger>
						<TabsTrigger value="results">Search Results</TabsTrigger>
					</TabsList>

					<TabsContent value="network" className="mt-2">
						<Card className="p-4">
							<NetworkGraphCanvas />
						</Card>
					</TabsContent>

					<TabsContent value="results" className="mt-2">
						<Card className="p-4 overflow-auto max-h-[500px]">
							<h3 className="text-lg font-semibold mb-2">
								Search Results: {filteredResults.length} of{' '}
								{searchResults.length}
							</h3>
							{filteredResults.map((result, index) => (
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
				</Tabs>
			)}
		</div>
	);
}

// SimilarityHistogram component that uses app store
const AppSimilarityHistogram = () => {
	const searchResults = useAppStore((state) => state.searchResults);
	const selectedSimilarityRanges = useAppStore(
		(state) => state.selectedSimilarityRanges
	);
	const toggleSimilarityRange = useAppStore(
		(state) => state.toggleSimilarityRange
	);

	const histogramData = useMemo(() => {
		const ranges = [
			{ range: '<20', min: 0, max: 19 },
			{ range: '21-40', min: 20, max: 40 },
			{ range: '41-60', min: 41, max: 60 },
			{ range: '61-80', min: 61, max: 80 },
			{ range: '81-100', min: 81, max: 100 },
		];

		// Always show bars if we have nodes
		if (!searchResults || searchResults.length === 0) {
			// Return minimal width bars (15%) when no results are available
			return ranges.map(({ range, min, max }) => ({
				range,
				count: 0,
				width: 15,
				min,
				max,
			}));
		}

		// Calculate based on search results using vector search scores
		const processedResults = searchResults.map((node) => {
			// Handle different score formats:
			// 1. _score from Pinecone API (already between 0-1)
			// 2. score from processed results (already between 0-1)
			// 3. similarity from other sources (already between 0-1)
			const similarity = node._score || node.score || node.similarity || 0;

			return {
				...node,
				// Convert to percentage (0-100)
				searchSimilarity: Math.round(similarity * 100),
			};
		});

		// Calculate counts for each range
		const rangeCounts = ranges.map(({ range, min, max }) => {
			const count = processedResults.filter((node) => {
				const similarity = node.searchSimilarity;
				return similarity >= min && similarity <= max;
			}).length;
			return { range, count, min, max };
		});

		// Find the maximum count across all ranges
		const maxCount = Math.max(
			...rangeCounts.map((item) => item.count),
			1 // Ensure we don't divide by zero
		);

		// Calculate widths based on the maximum count
		return rangeCounts.map(({ range, count, min, max }) => {
			// If count is 0, show a minimal bar width (15%)
			// Otherwise, scale the width based on the proportion of the maximum count
			const width = count === 0 ? 15 : Math.max(15, (count / maxCount) * 100);
			return { range, count, width, min, max };
		});
	}, [searchResults]);

	return (
		<div className="w-full">
			<div className="space-y-2">
				{histogramData.map((bar) => (
					<div key={bar.range} className="flex items-center gap-3">
						<div className="w-16 text-xs text-gray-600 text-right">
							{bar.range}%
						</div>
						<div className="flex-1 relative">
							<div
								className={`h-6 rounded cursor-pointer transition-all duration-200 flex items-center justify-end pr-2 ${
									selectedSimilarityRanges.includes(bar.range)
										? 'bg-purple-600 hover:bg-purple-700 shadow-md'
										: 'bg-gray-300 hover:bg-gray-400'
								}`}
								style={{ width: `${bar.width}%` }}
								onClick={() => toggleSimilarityRange(bar.range)}>
								{bar.count > 0 && (
									<span className="text-xs font-medium text-white">
										{bar.count}
									</span>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

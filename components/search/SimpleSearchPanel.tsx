'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimilarityHistogram } from '@/components/similarity-histogram';
import { useUnifiedSearchStore } from '@/lib/stores/unified-search-store';

/**
 * Simple search panel that displays raw Pinecone response with reranking
 * and includes a similarity histogram for filtering results
 */
export default function SimpleSearchPanel() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [rerankedResponse, setRerankedResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filteredNodes, setFilteredNodes] = useState<any[]>([]);
  const [processedResults, setProcessedResults] = useState<any[]>([]);
  const [topK, setTopK] = useState<number>(10); // Default topK value
  
  // Connect to unified search store
  const setSearchTerm = useUnifiedSearchStore((state) => state.setSearchTerm);
  const setHasSearched = useUnifiedSearchStore((state) => state.setHasSearched);
  const setSearchResultNodes = useUnifiedSearchStore((state) => state.setSearchResultNodes);
  const selectedSimilarityRange = useUnifiedSearchStore((state) => state.selectedSimilarityRange);

  // Process API response to extract and normalize scores
  const processApiResponse = (data: any) => {
    if (!data) return [];
    
    // Handle different API response formats
    let results = [];
    
    // Check if the response has a rawResponse.result.hits structure (Pinecone format)
    if (data.rawResponse?.result?.hits && Array.isArray(data.rawResponse.result.hits)) {
      results = data.rawResponse.result.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score, // This is already between 0-1 typically
        label: hit.fields?.label || hit._id,
        category: hit.fields?.category || '',
        type: hit.fields?.type || '',
        text: hit.fields?.chunk_text || hit.fields?.content || '',
        summary: hit.fields?.summary || '',
        content: hit.fields?.content || '',
        fields: hit.fields || {}
      }));
    } 
    // Handle standard results format
    else if (data.results && Array.isArray(data.results)) {
      results = data.results;
    }
    
    console.log('Processed results:', results);
    return results;
  };

  // Effect to filter nodes based on selected similarity ranges
  useEffect(() => {
    if (processedResults.length > 0) {
      let nodes = processedResults;
      
      // Apply similarity range filters if any are selected
      if (selectedSimilarityRange.length > 0) {
        nodes = nodes.filter((node: any) => {
          const similarity = Math.round((node.score || 0) * 100);
          return selectedSimilarityRange.some(range => {
            switch (range) {
              case '<20': return similarity >= 0 && similarity <= 19;
              case '21-40': return similarity >= 20 && similarity <= 40;
              case '41-60': return similarity >= 41 && similarity <= 60;
              case '61-80': return similarity >= 61 && similarity <= 80;
              case '81-100': return similarity >= 81 && similarity <= 100;
              default: return false;
            }
          });
        });
      }
      
      setFilteredNodes(nodes);
    }
  }, [processedResults, selectedSimilarityRange]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Call the reranked vector search API
      const response = await fetch('/api/reranked-vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, topK }),
      });

      const data = await response.json();
      console.log('Reranked search API response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }
      
      // Store the reranked response and raw response
      setRerankedResponse(data);
      setRawResponse(data.rawResponse);
      
      // Process the API response to extract results
      const results = processApiResponse(data);
      setProcessedResults(results);
      
      // Update unified search store
      setSearchTerm(query);
      setHasSearched(true);
      setSearchResultNodes(results);
      
      // Initialize filtered nodes
      setFilteredNodes(results);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search');
    } finally {
      setIsLoading(false);
    };
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
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
          >
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
              className="h-8 w-8 p-0"
            >
              -
            </Button>
            <span className="mx-2 font-medium">{topK}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setTopK(topK + 5)}
              className="h-8 w-8 p-0"
            >
              +
            </Button>
          </div>
        </div>
      </div>
      
      {rerankedResponse && (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Filter by Similarity</h3>
          <p className="text-sm text-gray-600 mb-3">Click on bars to filter results by similarity score</p>
          <SimilarityHistogram filteredNodes={processedResults} />
        </div>
      )}
      
      {error && (
        <div className="text-red-500 p-2 bg-red-50 rounded">
          Error: {error}
        </div>
      )}
      
      {rerankedResponse && (
        <Tabs defaultValue="results" className="w-full mt-4">
          <TabsList>
            <TabsTrigger value="results">Search Results</TabsTrigger>
            <TabsTrigger value="api">API Response</TabsTrigger>
            <TabsTrigger value="raw">Raw Response</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="mt-2">
            <Card className="p-4 overflow-auto max-h-[500px]">
              <h3 className="text-lg font-semibold mb-2">Search Results: {filteredNodes.length} of {processedResults.length || 0}</h3>
              {filteredNodes.map((result: any, index: number) => (
                <div key={result.id} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between">
                    <span className="font-semibold">#{index + 1} - {result.label || result.id}</span>
                    <span className="text-sm bg-blue-100 px-2 py-1 rounded">Score: {result.score ? result.score.toFixed(4) : 'N/A'}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Category: {result.category || 'Unknown'} | Type: {result.type || 'Unknown'}</div>
                  <p className="mt-2 text-sm">{result.text?.substring(0, 200) || result.content?.substring(0, 200) || 'No content available'}...</p>
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
              <h3 className="text-lg font-semibold mb-2">Raw Pinecone Response:</h3>
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

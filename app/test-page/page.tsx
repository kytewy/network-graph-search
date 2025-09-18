'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/stores/app-state';
import { VectorSearchPanel } from '@/components/search/VectorSearchPanel';
import { SimilarityHistogram } from '@/components/visualization/SimilarityHistogram';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { SearchResults } from '@/components/search/SearchResults';

/**
 * TestPage component
 * Integrates search, filtering, and visualization components
 * Using a modular component-based architecture
 */
export default function TestPage() {
  const error = useAppStore((state) => state.error);
  const searchResults = useAppStore((state) => state.searchResults);

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <h1 className="text-2xl font-bold">Search and Visualization Test Page</h1>

      {/* Search Panel */}
      <VectorSearchPanel />

      {/* Error Display */}
      {error && (
        <div className="text-red-500 p-2 bg-red-50 rounded">Error: {error}</div>
      )}

      {/* Similarity Histogram for Filtering */}
      <SimilarityHistogram />

      {/* Results Section with Tabs */}
      {searchResults.length > 0 && (
        <Tabs defaultValue="network" className="w-full">
          <TabsList>
            <TabsTrigger value="network">Network Graph</TabsTrigger>
            <TabsTrigger value="results">Search Results</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-2">
            <Card className="p-4">
              <NetworkGraph />
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-2">
            <SearchResults />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

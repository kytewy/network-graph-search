'use client';

import { useState } from 'react';
import { useUnifiedSearchStore } from '@/lib/stores/unified-search-store';
import { useNetworkStore } from '@/lib/stores/network-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function TestControls() {
  const [testNodes, setTestNodes] = useState([
    {
      id: 'test1',
      label: 'Test Node 1',
      summary: 'This is a test node for search functionality',
      content: 'Detailed content about test node 1',
      type: 'test',
      continent: 'Test Continent',
      country: 'Test Country',
      sourceType: 'Test',
      size: 10,
      similarity: 0.85,
      color: '#FF5733', // Adding color property required by the graph
      strength: 1 // Adding strength property for links
    },
    {
      id: 'test2',
      label: 'Test Node 2',
      summary: 'Another test node with different content',
      content: 'Detailed content about test node 2',
      type: 'test',
      continent: 'Test Continent',
      country: 'Test Country',
      sourceType: 'Test',
      size: 8,
      similarity: 0.65,
      color: '#33A1FF', // Adding color property required by the graph
      strength: 1 // Adding strength property for links
    },
    {
      id: 'test3',
      label: 'Test Node 3',
      summary: 'A third test node with lower similarity',
      content: 'Detailed content about test node 3',
      type: 'other',
      continent: 'Other Continent',
      country: 'Other Country',
      sourceType: 'Other',
      size: 12,
      similarity: 0.35,
      color: '#33FF57', // Adding color property required by the graph
      strength: 1 // Adding strength property for links
    }
  ]);

  const [testLinks, setTestLinks] = useState([
    {
      source: 'test1',
      target: 'test2',
      type: 'related',
      id: 'link1',
      strength: 1
    },
    {
      source: 'test2',
      target: 'test3',
      type: 'related',
      id: 'link2',
      strength: 1
    }
  ]);

  // Get state and actions from the unified search store
  const showEmptyState = useUnifiedSearchStore((state) => state.showEmptyState);
  const setShowEmptyState = useUnifiedSearchStore((state) => state.setShowEmptyState);
  const setSearchResultNodes = useUnifiedSearchStore((state) => state.setSearchResultNodes);
  const setSearchResultLinks = useUnifiedSearchStore((state) => state.setSearchResultLinks);
  const selectedSimilarityRange = useUnifiedSearchStore((state) => state.selectedSimilarityRange);
  const toggleSimilarityRange = useUnifiedSearchStore((state) => state.toggleSimilarityRange);

  const handleToggleEmptyState = () => {
    setShowEmptyState(!showEmptyState);
  };

  const handleLoadTestData = () => {
    console.log('[TestControls] Loading test data:', testNodes, testLinks);
    setSearchResultNodes(testNodes);
    setSearchResultLinks(testLinks);
    setShowEmptyState(false);
    // Set hasSearched to true to make histogram work
    useUnifiedSearchStore.getState().setHasSearched(true);
    // Set a dummy search term
    useUnifiedSearchStore.getState().setSearchTerm('test query');
    
    // Manually verify the network store is updated
    setTimeout(() => {
      const networkNodes = useNetworkStore.getState().nodes;
      console.log('[TestControls] Network store nodes after update:', networkNodes);
    }, 500);
  };

  const handleClearData = () => {
    setShowEmptyState(true);
  };

  return (
    <div className="p-4 border rounded-md bg-white mb-4">
      <h3 className="text-lg font-medium mb-3">Test Controls</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleToggleEmptyState} 
            variant={showEmptyState ? "outline" : "default"}
            size="sm"
          >
            {showEmptyState ? "Show Graph" : "Show Empty State"}
          </Button>
          
          <Button
            onClick={handleLoadTestData}
            variant="default"
            size="sm"
          >
            Load Test Data
          </Button>
          
          <Button
            onClick={handleClearData}
            variant="outline"
            size="sm"
          >
            Clear Data
          </Button>
        </div>
        
        <div>
          <Label className="block mb-2">Similarity Range Filters:</Label>
          <div className="flex flex-wrap gap-2">
            {['<20', '21-40', '41-60', '61-80', '81-100'].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={selectedSimilarityRange.includes(range) ? "default" : "outline"}
                onClick={() => toggleSimilarityRange(range)}
                className="text-xs"
              >
                {range}%
              </Button>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Status: {showEmptyState ? "Empty State" : "Showing Graph"} | 
          Filters: {selectedSimilarityRange.length > 0 ? selectedSimilarityRange.join(', ') : "None"}
        </div>
      </div>
    </div>
  );
}

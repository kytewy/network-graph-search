'use client';

import SimpleSearchPanel from '@/components/search/SimpleSearchPanel';

export default function SimpleSearchPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pinecone Vector Search</h1>
          <div className="text-sm text-gray-500">Filter results using the similarity histogram</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <SimpleSearchPanel />
        </div>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/services/vector_search';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query, topK = 10 } = body;

    // Validate required parameters
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Log search request
    console.log(`Executing reranked vector search for query: "${query}" with topK=${topK}`);

    // Use the searchPinecone function with reranking enabled
    const { results } = await searchPinecone(query, topK, true);

    // Log the results structure to understand the format
    console.log('Results structure:', JSON.stringify(results, null, 2));
    
    // Process the results based on the v6.1.2 searchRecords response format
    let processedResults = [];
    
    // Use any type to avoid TypeScript errors with the response format
    const responseData = results as any;
    
    // Check if results exists and has matches
    if (responseData && responseData.matches && Array.isArray(responseData.matches)) {
      processedResults = responseData.matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.chunk_text || '',
        category: match.metadata?.category || '',
        type: match.metadata?.type || '',
        label: match.metadata?.label || '',
        summary: match.metadata?.summary || '',
        content: match.metadata?.content || '',
        continent: match.metadata?.continent || '',
        country: match.metadata?.country || '',
        sourceType: match.metadata?.sourceType || ''
      }));
    } else {
      console.log('No matches found or unexpected results format');
    }

    // Return the search results
    return NextResponse.json({
      success: true,
      results: processedResults,
      rawResponse: results
    });
  } catch (error: any) {
    console.error('Vector search API error:', error);

    return NextResponse.json(
      {
        error: 'Error processing vector search',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

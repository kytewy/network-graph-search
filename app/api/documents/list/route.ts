import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export async function GET(request: NextRequest) {
	try {
		// Check if Pinecone is configured
		if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
			return NextResponse.json({
				success: false,
				error: 'Pinecone not configured',
				count: 0,
				documents: [],
			});
		}

		// Initialize Pinecone client at runtime
		const pc = new Pinecone({
			apiKey: process.env.PINECONE_API_KEY,
		});

		const index = pc.index(process.env.PINECONE_INDEX_NAME);

		// Query for a few sample documents
		const queryResponse = await index.query({
			vector: Array(1536).fill(0), // Dummy vector
			topK: 10,
			includeMetadata: true,
		});

		const documents = queryResponse.matches.map((match) => ({
			id: match.id,
			label: match.metadata?.label || 'Unknown',
			type: match.metadata?.type || 'Unknown',
			tags: match.metadata?.tags || [],
		}));

		return NextResponse.json({
			success: true,
			count: documents.length,
			documents,
		});
	} catch (error) {
		console.error('Error listing documents:', error);
		return NextResponse.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

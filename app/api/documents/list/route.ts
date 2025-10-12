import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
	apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index(process.env.PINECONE_INDEX_NAME!);

export async function GET(request: NextRequest) {
	try {
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

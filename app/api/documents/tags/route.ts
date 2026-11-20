import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { LIMITS, badRequest, rateLimit, serverError, tagWritesAllowed } from '@/lib/utils/api-guard';

function getPineconeIndex() {
	if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
		throw new Error('Pinecone configuration missing');
	}

	const pc = new Pinecone({
		apiKey: process.env.PINECONE_API_KEY,
	});

	const indexName = process.env.PINECONE_INDEX_NAME;
	const namespace = process.env.PINECONE_NAMESPACE || '';

	return namespace 
		? pc.index(indexName).namespace(namespace)
		: pc.index(indexName);
}

// GET endpoint to fetch tags for a document
export async function GET(request: NextRequest) {
	try {
		// Check if Pinecone is configured
		if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
			return NextResponse.json({ tags: [] }, { status: 200 });
		}

		const { searchParams } = new URL(request.url);
		const documentId = searchParams.get('documentId');

		if (!documentId) {
			return NextResponse.json(
				{ error: 'documentId is required' },
				{ status: 400 }
			);
		}

		// Fetch document from Pinecone
		const index = getPineconeIndex();
		const fetchResponse = await index.fetch([documentId]);

		if (!fetchResponse.records || !fetchResponse.records[documentId]) {
			return NextResponse.json(
				{ tags: [] },
				{ status: 200 }
			);
		}

		const record = fetchResponse.records[documentId];
		const tags = (record.metadata?.tags as string[]) || [];

		return NextResponse.json({ tags }, { status: 200 });
	} catch (error) {
		console.error('[Tags GET] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch tags' },
			{ status: 500 }
		);
	}
}

export async function PATCH(request: NextRequest) {
	const limited = rateLimit(request, 'tags');
	if (limited) return limited;

	// Writes change data in Pinecone; the public demo is read-only by default
	if (!tagWritesAllowed()) {
		return NextResponse.json(
			{ error: 'Tag editing is turned off on this deployment' },
			{ status: 403 }
		);
	}

	try {
		// Check if Pinecone is configured
		if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
			return NextResponse.json(
				{ error: 'Pinecone not configured' },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { documentIds, tag, action } = body;

		// Validation
		if (
			!Array.isArray(documentIds) ||
			documentIds.length === 0 ||
			documentIds.length > LIMITS.MAX_TAG_DOCS ||
			!documentIds.every((id: unknown) => typeof id === 'string')
		) {
			return badRequest(`documentIds must be 1 to ${LIMITS.MAX_TAG_DOCS} strings`);
		}

		if (!tag || typeof tag !== 'string' || tag.trim() === '' || tag.length > LIMITS.MAX_TAG_CHARS) {
			return badRequest(`tag must be 1 to ${LIMITS.MAX_TAG_CHARS} characters`);
		}

		if (action !== 'add' && action !== 'remove') {
			return NextResponse.json(
				{ error: 'action must be "add" or "remove"' },
				{ status: 400 }
			);
		}

		// Get Pinecone index
		const index = getPineconeIndex();

		// Fetch current metadata for each document
		const fetchResponse = await index.fetch(documentIds);
		
		if (!fetchResponse.records) {
			return NextResponse.json(
				{ error: 'Failed to fetch documents' },
				{ status: 500 }
			);
		}

		// Update tags for each document
		let updated = 0;
		for (const docId of documentIds) {
			const record = fetchResponse.records[docId];
			
			if (!record) {
				console.warn(`Document ${docId} not found in Pinecone`);
				continue;
			}

			const currentMetadata = record.metadata || {};
			let tags = currentMetadata.tags || [];

			// Ensure tags is an array
			if (!Array.isArray(tags)) {
				tags = [];
			}

			// Add or remove tag
			if (action === 'add') {
				if (Array.isArray(tags) && !tags.includes(tag)) {
					tags.push(tag);
				} else if (!Array.isArray(tags)) {
					tags = [tag];
				}
			} else if (action === 'remove') {
				tags = tags.filter((t: string) => t !== tag);
			}

			// Update metadata in Pinecone
			await index.update({
				id: docId,
				metadata: {
					...currentMetadata,
					tags: tags,
				},
			});

			updated++;
		}

		return NextResponse.json({
			success: true,
			updated,
			tag,
			action,
			message: `${action === 'add' ? 'Added' : 'Removed'} tag "${tag}" ${action === 'add' ? 'to' : 'from'} ${updated} document(s)`,
		});
	} catch (error) {
		return serverError('tags-patch', error, 'Failed to update tags');
	}
}

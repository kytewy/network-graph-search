import { NextRequest, NextResponse } from 'next/server';
import { findMissingDates } from '@/lib/sources/dates';
import { rateLimit, tagWritesAllowed } from '@/lib/utils/api-guard';
import { llmError } from '@/lib/utils/openai-client';

export const runtime = 'nodejs';

/** "Find missing dates": the AI's first pass over undated documents (a batch per press) */
export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'llm');
	if (limited) return limited;
	if (!tagWritesAllowed()) return NextResponse.json({ error: 'Changing documents is turned off on this deployment' }, { status: 403 });
	try {
		return NextResponse.json(await findMissingDates());
	} catch (error) {
		return llmError('sources-dates', error, 'Could not look for dates');
	}
}

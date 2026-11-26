import { NextRequest, NextResponse } from 'next/server';
import { createWorkstreamSchema } from '@/lib/contracts/workstreams';
import { createWorkstream } from '@/lib/workstreams/store';
import { badRequest, rateLimit, serverError, tagWritesAllowed } from '@/lib/utils/api-guard';

export const runtime = 'nodejs';

/** Starts a workstream from its name, goal and due date */
export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'tags');
	if (limited) return limited;
	if (!tagWritesAllowed()) return NextResponse.json({ error: 'Creating workstreams is turned off on this deployment' }, { status: 403 });
	const parsed = createWorkstreamSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid request');
	try {
		return NextResponse.json(await createWorkstream(parsed.data), { status: 201 });
	} catch (error) {
		return serverError('workstreams/create', error, 'Couldn’t create the workstream');
	}
}

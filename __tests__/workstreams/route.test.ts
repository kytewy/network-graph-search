import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const createWorkstream = vi.fn();
vi.mock('@/lib/workstreams/store', () => ({ createWorkstream: (i: unknown) => createWorkstream(i) }));

import { POST } from '@/app/api/workstreams/route';
import { resetRateLimits } from '@/lib/utils/api-guard';

const req = (b: unknown) => new NextRequest('http://localhost/api/workstreams', { method: 'POST', body: JSON.stringify(b) });

beforeEach(() => {
	resetRateLimits();
	createWorkstream.mockReset();
});

describe('POST /api/workstreams', () => {
	it('creates one and returns its id', async () => {
		createWorkstream.mockResolvedValue({ id: 'ws-1' });
		const res = await POST(req({ name: 'EU vs Canada', goal: 'Brief the risk committee' }));
		expect(res.status).toBe(201);
		expect(await res.json()).toEqual({ id: 'ws-1' });
		expect(createWorkstream).toHaveBeenCalledWith({ name: 'EU vs Canada', goal: 'Brief the risk committee' });
	});

	it('asks for a name', async () => {
		const res = await POST(req({ name: '' }));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toBe('Give it a name');
		expect(createWorkstream).not.toHaveBeenCalled();
	});
});

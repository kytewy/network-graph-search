import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const saveLink = vi.fn();
vi.mock('@/lib/sources/save-link', () => ({ saveLink: (...a: unknown[]) => saveLink(...a) }));
const fetchPage = vi.fn();
vi.mock('@/lib/sources/fetch-page', async (orig) => ({ ...(await orig<object>()), fetchPage: (...a: unknown[]) => fetchPage(...a) }));

import { POST as preview } from '@/app/api/sources/preview/route';
import { POST as add } from '@/app/api/sources/route';
import { LinkError } from '@/lib/sources/fetch-page';
import { resetRateLimits } from '@/lib/utils/api-guard';

const body = (b: unknown) => new NextRequest('http://localhost/api/sources', { method: 'POST', body: JSON.stringify(b) });
const text = '<article><h1>E-23</h1><p>' + 'Banks must keep a model inventory, AI models included. '.repeat(10) + '</p></article>';

beforeEach(() => {
	resetRateLimits();
	saveLink.mockReset();
	fetchPage.mockReset();
});

describe('POST /api/sources/preview', () => {
	it('shows the title, length and first lines without saving', async () => {
		fetchPage.mockResolvedValue({ url: 'https://osfi.ca/e23', html: `<html><head><title>E-23</title></head><body>${text}</body></html>` });
		const res = await preview(body({ url: 'https://osfi.ca/e23' }));
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toMatchObject({ url: 'https://osfi.ca/e23', title: 'E-23' });
		expect(json.length).toBeGreaterThan(200);
		expect(saveLink).not.toHaveBeenCalled();
	});

	it('turns a link problem into a 400 with a plain message', async () => {
		fetchPage.mockRejectedValue(new LinkError('Links to private or local addresses can’t be added'));
		const res = await preview(body({ url: 'http://127.0.0.1' }));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toMatch(/private or local/);
	});
});

describe('POST /api/sources', () => {
	it('adds a new link (201) and returns the existing one on a repeat (200)', async () => {
		fetchPage.mockResolvedValue({ url: 'https://osfi.ca/e23', html: `<html><body>${text}</body></html>` });
		const req = { url: 'https://osfi.ca/e23', publisher: 'Regulator', documentType: 'Guidance', country: 'Canada' };
		saveLink.mockResolvedValueOnce({ id: 'link-1', title: 'E-23', created: true });
		expect((await add(body(req))).status).toBe(201);
		saveLink.mockResolvedValueOnce({ id: 'link-1', title: 'E-23', created: false });
		expect((await add(body(req))).status).toBe(200);
	});

	it('refuses a publisher outside the taxonomy before fetching anything', async () => {
		const res = await add(body({ url: 'https://osfi.ca', publisher: 'Blog', documentType: 'Guidance' }));
		expect(res.status).toBe(400);
		expect(fetchPage).not.toHaveBeenCalled();
	});
});

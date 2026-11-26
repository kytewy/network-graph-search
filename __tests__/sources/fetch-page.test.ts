import { describe, expect, it } from 'vitest';
import { FETCH_LIMITS, LinkError, checkLink, fetchPage, isPrivateAddress } from '@/lib/sources/fetch-page';

const PUBLIC = 'http://93.184.216.34';

function reply(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
	return new Response(body, { status: init.status ?? 200, headers: { 'content-type': 'text/html; charset=utf-8', ...init.headers } });
}

describe('isPrivateAddress', () => {
	it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])(
		'%s is private', (ip) => expect(isPrivateAddress(ip)).toBe(true));
	it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700::1111'])('%s is public', (ip) => expect(isPrivateAddress(ip)).toBe(false));
});

describe('checkLink', () => {
	it.each([
		['not a link', 'doesn’t look like a web address'],
		['ftp://93.184.216.34/file', 'Only http and https'],
		['http://user:pw@93.184.216.34/', 'username or password'],
		['http://127.0.0.1:3000/api/db-health', 'private or local'],
		['http://[::1]/', 'private or local'],
		['http://10.0.0.5/admin', 'private or local'],
	])('refuses %s', async (raw, message) => {
		await expect(checkLink(raw)).rejects.toThrow(message);
	});

	it('accepts a public address and drops the #fragment', async () => {
		expect((await checkLink(`${PUBLIC}/page#top`)).toString()).toBe(`${PUBLIC}/page`);
	});
});

describe('fetchPage', () => {
	it('returns the HTML and the final address after a redirect', async () => {
		const calls: string[] = [];
		const fetcher = (async (url: URL) => {
			calls.push(url.toString());
			return calls.length === 1 ? reply('', { status: 301, headers: { location: '/moved' } }) : reply('<p>hi</p>');
		}) as unknown as typeof fetch;
		expect(await fetchPage(`${PUBLIC}/old`, fetcher)).toEqual({ url: `${PUBLIC}/moved`, html: '<p>hi</p>' });
	});

	it('refuses a redirect to a private address', async () => {
		const fetcher = (async () => reply('', { status: 302, headers: { location: 'http://192.168.0.1/' } })) as unknown as typeof fetch;
		await expect(fetchPage(PUBLIC, fetcher)).rejects.toThrow('private or local');
	});

	it('refuses anything that isn’t a web page', async () => {
		const fetcher = (async () => reply('%PDF', { headers: { 'content-type': 'application/pdf' } })) as unknown as typeof fetch;
		await expect(fetchPage(PUBLIC, fetcher)).rejects.toThrow('Only web pages');
	});

	it('stops a page that is too large, even without a length header', async () => {
		const big = 'x'.repeat(FETCH_LIMITS.maxBytes + 1);
		const fetcher = (async () => reply(big)) as unknown as typeof fetch;
		await expect(fetchPage(PUBLIC, fetcher)).rejects.toBeInstanceOf(LinkError);
	});

	it('reports an error status from the website', async () => {
		const fetcher = (async () => reply('nope', { status: 404 })) as unknown as typeof fetch;
		await expect(fetchPage(PUBLIC, fetcher)).rejects.toThrow('answered 404');
	});
});

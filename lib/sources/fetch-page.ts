/**
 * Fetches a web page for "Add by link", safely: only public http(s) addresses (never this machine or a
 * private network, checked again on every redirect), a time limit, a size cap, and HTML only. Server only.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const FETCH_LIMITS = { timeoutMs: 10_000, maxBytes: 5_000_000, maxRedirects: 3 } as const;

/** A problem the person can fix (bad link, page too big), as opposed to a server fault */
export class LinkError extends Error {}

/** True for loopback, private, link-local, carrier-grade NAT and other non-public addresses */
export function isPrivateAddress(ip: string): boolean {
	const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
	if (isIP(v4) === 4) {
		const [a, b] = v4.split('.').map(Number);
		return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
	}
	const v6 = ip.toLowerCase();
	return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

/** Parses the link and checks every address its host points to is public */
export async function checkLink(raw: string): Promise<URL> {
	let url: URL;
	try {
		url = new URL(raw.trim());
	} catch {
		throw new LinkError('That doesn’t look like a web address');
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new LinkError('Only http and https links can be added');
	if (url.username || url.password) throw new LinkError('Links with a username or password can’t be added');
	const host = url.hostname.replace(/^\[|\]$/g, '');
	const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
	if (addresses.length === 0) throw new LinkError('That website couldn’t be found');
	if (addresses.some(isPrivateAddress)) throw new LinkError('Links to private or local addresses can’t be added');
	url.hash = '';
	return url;
}

/** Downloads the page's HTML, following up to three redirects; returns the final address too */
export async function fetchPage(raw: string, fetcher: typeof fetch = fetch): Promise<{ url: string; html: string }> {
	let url = await checkLink(raw);
	for (let hop = 0; hop <= FETCH_LIMITS.maxRedirects; hop++) {
		const res = await fetcher(url, {
			redirect: 'manual',
			signal: AbortSignal.timeout(FETCH_LIMITS.timeoutMs),
			headers: { 'User-Agent': 'LanternBot/0.1 (+add by link)', Accept: 'text/html,application/xhtml+xml' },
		}).catch((e: Error) => {
			throw new LinkError(e.name === 'TimeoutError' ? 'The page took too long to load' : 'The page couldn’t be loaded');
		});
		const next = res.headers.get('location');
		if (res.status >= 300 && res.status < 400 && next) {
			url = await checkLink(new URL(next, url).toString());
			continue;
		}
		if (!res.ok) throw new LinkError(`The website answered ${res.status}`);
		const type = res.headers.get('content-type') ?? '';
		if (!/text\/html|application\/xhtml/.test(type)) throw new LinkError('Only web pages can be added for now (PDFs come with uploads)');
		if (Number(res.headers.get('content-length') ?? 0) > FETCH_LIMITS.maxBytes) throw new LinkError('The page is too large (over 5 MB)');
		return { url: url.toString(), html: await readCapped(res) };
	}
	throw new LinkError('The link redirects too many times');
}

/** Reads the body, stopping with an error past the size cap */
async function readCapped(res: Response): Promise<string> {
	const reader = res.body?.getReader();
	if (!reader) return '';
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > FETCH_LIMITS.maxBytes) {
			await reader.cancel();
			throw new LinkError('The page is too large (over 5 MB)');
		}
		chunks.push(value);
	}
	return new TextDecoder().decode(Buffer.concat(chunks));
}

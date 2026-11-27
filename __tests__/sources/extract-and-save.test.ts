import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({ db: () => { throw new Error('no database in unit tests'); } }));

import { extractArticle } from '@/lib/sources/extract';
import { SEARCH_COPY, linkId, searchRecord } from '@/lib/sources/save-link';
import { addLinkRequestSchema } from '@/lib/contracts/sources';

const para = 'Federally regulated financial institutions must keep an inventory of their models, including AI models. ';
const PAGE = `<html><head><title>Guideline E-23 | OSFI</title></head><body>
<nav><a href="/">Home</a><a href="/about">About us</a><a href="/contact">Contact</a></nav>
<article><h1>Guideline E-23: Model Risk Management</h1><p>${para.repeat(4)}</p><p>${para.repeat(3)}</p></article>
<footer>© Office of the Superintendent · Privacy · Terms</footer></body></html>`;

describe('extractArticle', () => {
	it('keeps the article text and drops the menu and footer', () => {
		const a = extractArticle(PAGE, 'https://www.osfi-bsif.gc.ca/e23');
		expect(a.text).toContain('inventory of their models');
		expect(a.text).not.toContain('About us');
		expect(a.text).not.toContain('Privacy');
		expect(a.title).toMatch(/E-23/);
	});

	it('refuses a page with almost no text', () => {
		expect(() => extractArticle('<html><body><p>Please sign in</p></body></html>', 'https://example.com')).toThrow('No readable article');
	});
});

describe('linkId', () => {
	it('gives the same id for the same page, whatever the #fragment, slash or case', () => {
		const id = linkId('https://Example.com/a/');
		expect(id).toMatch(/^link-[0-9a-f]{16}$/);
		expect(linkId('https://example.com/a#part-2')).toBe(id);
		expect(linkId('https://example.com/b')).not.toBe(id);
	});
});

describe('searchRecord', () => {
	const labels = addLinkRequestSchema.parse({ url: 'https://x.org', publisher: 'Regulator', documentType: 'Guidance', country: 'Canada' });

	it('is shaped like the index records and cut to Pinecone’s limits', () => {
		const text = 'a'.repeat(30_000);
		const r = searchRecord('link-1', 'https://x.org', 'T', { title: 'T', text, excerpt: 'e', siteName: null, published: null }, labels);
		expect(r).toMatchObject({ _id: 'link-1', label: 'T', publisher: 'Regulator', documentType: 'Guidance', country: 'Canada', source: 'link' });
		expect(r.chunk_text.length).toBe(SEARCH_COPY.chunkChars);
		expect(r.content.endsWith('[Content truncated]')).toBe(true);
		expect(r).not.toHaveProperty('continent');
	});

	it('only accepts publishers and types from the taxonomy', () => {
		expect(addLinkRequestSchema.safeParse({ url: 'https://x.org', publisher: 'Blog', documentType: 'Guidance' }).success).toBe(false);
	});
});

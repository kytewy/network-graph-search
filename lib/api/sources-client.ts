/** Browser side of "Add by link": preview a page, then add it. */
import type { AddLinkRequest } from '@/lib/contracts/sources';
import { requestJson } from './http';

export type LinkPreview = { url: string; title: string; siteName: string | null; length: number; excerpt: string };
export type AddedLink = { id: string; title: string; created: boolean; length: number };

export function previewLink(url: string) {
	return requestJson<LinkPreview>('/api/sources/preview', { method: 'POST', body: JSON.stringify({ url }) }, 'Couldn’t preview that link');
}

export function addLink(request: AddLinkRequest) {
	return requestJson<AddedLink>('/api/sources', { method: 'POST', body: JSON.stringify(request) }, 'Couldn’t add that link');
}

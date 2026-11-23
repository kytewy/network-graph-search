import { expect, type Page } from '@playwright/test';
import reply from './fixtures/search-reply.json';

export const RESULT_COUNT = reply.nodes.length;
export const label = (continent: string) => reply.nodes.filter((n) => n.continent === continent).map((n) => n.label);

/** Answers every search with the fixture, so tests never call Pinecone. */
export async function fakeSearch(page: Page) {
	await page.route('**/api/reranked-vector-search', (route) => route.fulfill({ json: reply }));
}

/** Opens the graph page and runs a search through the search box. */
export async function search(page: Page, query = 'AI regulation') {
	await fakeSearch(page);
	await page.goto('/graph');
	const box = page.getByPlaceholder(/Search across/);
	await box.fill(query);
	await box.press('Enter');
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));
}

/** The graph's marker: data-node-count says how many nodes are drawn. */
export const graphNodeCount = (page: Page) => page.getByTestId('graph');

/**
 * Turns graph labels off before the page loads (the saved preference from P1-11).
 * The graph downloads its label font from the internet and waits for it, so a
 * test that needs the graph drawn shouldn't depend on that download.
 */
export async function withoutLabels(page: Page) {
	await page.addInitScript(() => {
		localStorage.setItem(
			'network-graph-search:preferences',
			JSON.stringify({ state: { showLabels: false }, version: 1 })
		);
	});
}

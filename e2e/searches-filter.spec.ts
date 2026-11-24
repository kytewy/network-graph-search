import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { graphNodeCount, RESULT_COUNT, search } from './helpers';

const compliance = {
	nodes: [
		{ ...reply.nodes.find((n) => n.id === 'eu-ai-act')!, score: 0.71 },
		{ ...reply.nodes.find((n) => n.id === 'osfi-e23')!, score: 0.95 },
		{ ...reply.nodes[0], id: 'iso-42001', label: 'ISO/IEC 42001', score: 0.88 },
		{ ...reply.nodes[0], id: 'nist-rmf', label: 'NIST AI RMF', score: 0.83 },
	],
	edges: [],
};
const total = RESULT_COUNT + 2;
const nodes = (n: number) => expect(graphNodeCount(page_)).toHaveAttribute('data-node-count', String(n));
let page_: import('@playwright/test').Page;

test('the Searches filter shows one search or the overlap, colours by search, and removes a search', async ({ page }) => {
	page_ = page;
	await search(page);
	await page.route('**/api/reranked-vector-search', (r) =>
		r.request().postDataJSON().query === 'compliance' ? r.fulfill({ json: compliance }) : r.fallback()
	);
	const box = page.getByPlaceholder(/Search across/);
	await box.fill('compliance');
	await box.press('Shift+Enter');
	await nodes(total);

	await page.getByRole('tab', { name: /^Filters/ }).click();
	const searches = page.getByRole('list', { name: 'Searches in the workspace' });
	await expect(searches.getByRole('button', { name: /^#1 AI regulation/ })).toBeVisible();

	// Only what #2 found
	await searches.getByRole('button', { name: /^#2 compliance/ }).click();
	await nodes(compliance.nodes.length);
	await expect(page.getByText(`showing ${compliance.nodes.length} of ${total}`)).toBeVisible();

	// Only the overlap (#2 untick, ★ tick)
	await searches.getByRole('button', { name: /^#2 compliance/ }).click();
	await searches.getByRole('button', { name: /Found by 2\+ searches/ }).click();
	await nodes(2);

	// Colour by search: the legend names the searches and the overlap
	await page.getByRole('button', { name: /^Color/ }).click();
	await page.getByRole('menuitem', { name: 'Search', exact: true }).click();
	await expect(page.getByText('★ Found by 2+ searches').last()).toBeVisible();

	// Removing #1 keeps what #2 also found; the workspace is back to one search
	await page.getByRole('button', { name: 'Clear All' }).click();
	await nodes(total);
	await searches.getByRole('button', { name: 'Remove search #1 AI regulation' }).click();
	await nodes(compliance.nodes.length);
	await page.getByRole('tab', { name: /^Search/ }).click();
	await expect(page.getByRole('heading', { name: `Results (${compliance.nodes.length})` })).toBeVisible();
});

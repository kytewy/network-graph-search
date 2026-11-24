import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { graphNodeCount, RESULT_COUNT, search } from './helpers';

// "compliance" finds two documents the first search found, plus two new ones
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

test('a second search can be added to the workspace: one graph, no duplicates, "found by" and the overlap icon', async ({ page }) => {
	await search(page); // #1 AI regulation (the fake search answers every query with the fixture)
	await page.route('**/api/reranked-vector-search', (r) =>
		r.request().postDataJSON().query === 'compliance' ? r.fulfill({ json: compliance }) : r.fallback()
	);
	const box = page.getByPlaceholder(/Search across/);

	// Adding needs text; Shift+Enter adds
	await box.fill('compliance');
	await box.press('Shift+Enter');
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(total));
	await expect(page.getByRole('heading', { name: `Workspace (${total}) · 2 searches` })).toBeVisible();

	// Found by more than one search: the overlap icon (narrow table)
	const rows = page.getByTestId('results-table').locator('[data-result-row]');
	await expect(rows.filter({ hasText: 'EU AI Act' }).first().getByLabel('Found by #1 #2')).toBeVisible();
	await expect(rows.filter({ hasText: 'ISO/IEC 42001' }).getByLabel(/Found by/)).toHaveCount(0);

	// Wide: a Found by column
	await page.getByRole('button', { name: 'Expand search panel' }).click();
	await expect(rows.filter({ hasText: 'OSFI Guideline E-23' }).locator('[data-found-by]')).toHaveText('#1 #2');
	await expect(rows.filter({ hasText: 'OSFI Guideline E-23' }).locator('[data-found-by]').getByLabel('Found by more than one search')).toBeVisible();
	await expect(rows.filter({ hasText: 'NIST AI RMF' }).locator('[data-found-by]')).toHaveText('#2');

	// Adding the same search again changes nothing
	await page.getByRole('button', { name: 'Add to workspace' }).click();
	await expect(page.getByRole('heading', { name: `Workspace (${total}) · 2 searches` })).toBeVisible();

	// A normal search starts over
	await box.fill('AI regulation');
	await box.press('Enter');
	await expect(page.getByRole('heading', { name: `Results (${RESULT_COUNT})` })).toBeVisible();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));
});

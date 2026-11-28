import { expect, test } from '@playwright/test';
import { graphNodeCount } from './helpers';

const content = ['Overview', 'This guideline sets out expectations.', 'Model Inventory', 'Keep a complete inventory of models.', 'Model Review', 'Review models independently.'].join('\n');
const at = (s: string) => content.indexOf(s);
const node = {
	id: 'e23', label: 'OSFI E-23', score: 0.9, similarity: 0.9, publisher: 'Regulator', documentType: 'Guidance', summary: 'Model risk', content,
	continent: 'North America', country: 'Canada', size: 9, tags: [], matches: 2,
	passages: [
		{ position: 1, heading: 'Model Inventory', start: at('Model Inventory'), text: 'Model Inventory\nKeep a complete inventory of models.', score: 0.9 },
		{ position: 2, heading: 'Model Review', start: at('Model Review'), text: 'Model Review\nReview models independently.', score: 0.7 },
	],
};

test('reading mode points to where to start, lists the key sections and lights the one you pick', async ({ page }) => {
	await page.route('**/api/reranked-vector-search', (r) => r.fulfill({ json: { nodes: [node], edges: [] } }));
	// No database in the test: reading mode uses the text it already has
	await page.route('**/api/documents/*/text', (r) => r.fulfill({ status: 503, json: { error: 'Unavailable' } }));
	await page.goto('/graph');
	const box = page.getByPlaceholder(/Search across/);
	await box.fill('model inventory');
	await box.press('Enter');
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', '1');
	await page.getByRole('button', { name: 'OSFI E-23' }).first().click();

	const matches = page.getByRole('complementary', { name: 'Key sections' });
	await expect(matches).toContainText('Start here');
	await expect(matches).toContainText('Also relevant');
	await expect(matches.getByRole('button', { name: /Model Inventory/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('[data-passage="0"]').first()).toContainText('Model Inventory');

	await matches.getByRole('button', { name: /Model Review/ }).click();
	await expect(matches.getByRole('button', { name: /Model Review/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('[data-passage="1"]').last()).toHaveClass(/shadow/);
});

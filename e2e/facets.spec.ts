import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { search } from './helpers';

// "compliance" finds the EU AI Act and OSFI (both in #1 too) plus a new North American document
const compliance = {
	nodes: [
		{ ...reply.nodes.find((n) => n.id === 'eu-ai-act')!, score: 0.71 },
		{ ...reply.nodes.find((n) => n.id === 'osfi-e23')!, score: 0.95 },
		{ ...reply.nodes.find((n) => n.id === 'us-eo')!, id: 'nist-rmf', label: 'NIST AI RMF', score: 0.83 },
	],
	edges: [],
};

test('filter counts follow the other filters; options with nothing left are faded, not hidden', async ({ page }) => {
	await search(page);
	await page.route('**/api/reranked-vector-search', (r) =>
		r.request().postDataJSON().query === 'compliance' ? r.fulfill({ json: compliance }) : r.fallback()
	);
	const box = page.getByPlaceholder(/Search across/);
	await box.fill('compliance');
	await box.press('Shift+Enter');
	await page.getByRole('tab', { name: /^Filters/ }).click();

	const location = page.getByRole('region', { name: 'Location' });
	const asia = location.locator('div', { hasText: /^Asia/ }).first();
	await expect(asia).toContainText('1');

	// Tick #2 compliance: Location recounts to what #2 found; Asia has none and fades
	const searches = page.getByRole('list', { name: 'Searches in the workspace' });
	await searches.getByRole('button', { name: /^#2 compliance/ }).click();
	await expect(location.locator('div', { hasText: /^Europe/ }).first()).toContainText('1');
	await expect(location.locator('div', { hasText: /^North America/ }).first()).toContainText('2');
	await expect(asia).toContainText('0');
	await expect(location.locator('.opacity-40', { hasText: /^Asia/ })).toHaveCount(1);

	// The Searches section doesn't recount itself: #1 still shows all it found
	await expect(searches.getByRole('button', { name: /^#1 AI regulation/ })).toContainText(String(reply.nodes.length));

	// Tick Europe: now the Searches counts follow it
	await searches.getByRole('button', { name: /^#2 compliance/ }).click();
	await location.getByText('Europe', { exact: true }).click();
	await expect(searches.getByRole('button', { name: /^#1 AI regulation/ })).toContainText('3');
	await expect(searches.getByRole('button', { name: /^#2 compliance/ })).toContainText('1');
});

import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('double-clicking the search header opens it wide, shows results in columns, and folds back', async ({ page }) => {
	await search(page);
	const panel = page.getByTestId('search-panel');
	const narrow = (await panel.boundingBox())!.width;

	await page.locator('[data-panel-header="left"]').dblclick({ position: { x: 2, y: 2 } });
	await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(narrow * 2);

	// Wide: no tabs, and the filters sit beside the results
	await expect(page.getByRole('tab', { name: /^Filters/ })).toHaveCount(0);
	const filters = page.getByRole('complementary', { name: 'Filters' });
	await expect(filters).toBeVisible();

	// Two result cards side by side: the first two start at the same height
	await page.getByRole('button', { name: 'Show as cards' }).click();
	const cards = panel.locator('[data-result-card]');
	await expect.poll(async () => {
		const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
		return a && b ? Math.abs(a.y - b.y) : 999;
	}).toBeLessThan(5);

	// Filters column is left of the results
	const [f, c] = [await filters.boundingBox(), await cards.nth(0).boundingBox()];
	expect(f!.x + f!.width).toBeLessThanOrEqual(c!.x + 1);

	// Double-clicking the header again narrows it back to the tabs
	await page.locator('[data-panel-header="left"]').dblclick({ position: { x: 2, y: 2 } });
	await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThan(narrow + 5);
	await expect(page.getByRole('tab', { name: /^Filters/ })).toBeVisible();
});

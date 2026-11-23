import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('the search panel opens wide, shows results in columns, and folds back', async ({ page }) => {
	await search(page);
	const panel = page.getByRole('tab', { name: /^Search/ }).locator('xpath=ancestor::div[contains(@class,"h-screen")][1]');
	const narrow = (await panel.boundingBox())!.width;

	await page.getByRole('button', { name: 'Expand search panel' }).click();
	await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(narrow * 2);

	// Two result cards side by side: the first two start at the same height
	const cards = page.getByRole('tabpanel', { name: /^Search/ }).locator('[data-result-card]');
	await expect.poll(async () => {
		const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
		return a && b ? Math.abs(a.y - b.y) : 999;
	}).toBeLessThan(5);

	// « folds it back
	await page.getByRole('button', { name: 'Collapse search panel' }).click();
	await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThan(narrow + 5);
});

import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('both panels close to thin rails, give the graph the room, and stay closed after a refresh', async ({ page }) => {
	await search(page);
	const graph = page.getByTestId('graph');
	const before = (await graph.boundingBox())!.width;

	// The two header bars line up: same top and same height
	const leftHeader = page.locator('[data-panel-header="left"]');
	const rightHeader = page.locator('[data-panel-header="right"]');
	const [l, r] = [await leftHeader.boundingBox(), await rightHeader.boundingBox()];
	expect(Math.abs(l!.y - r!.y)).toBeLessThan(1);
	expect(Math.abs(l!.height - r!.height)).toBeLessThan(1);

	await page.getByRole('button', { name: 'Close search panel' }).click();
	await page.getByRole('button', { name: 'Close analysis panel' }).click();
	await expect(page.getByTestId('left-rail')).toBeVisible();
	await expect(page.getByTestId('right-rail')).toBeVisible();
	await expect.poll(async () => (await graph.boundingBox())!.width).toBeGreaterThan(before + 600);

	await page.reload();
	await expect(page.getByTestId('left-rail')).toBeVisible();

	// The rails open the panels again
	await page.getByRole('button', { name: 'Open search panel' }).click();
	await page.getByRole('button', { name: 'Open analysis panel' }).click();
	await expect(page.getByRole('tab', { name: /^Search/ })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Close analysis panel' })).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('one button per panel: maximize over the graph, and restore', async ({ page }) => {
	await search(page);
	// The two header bars line up: same top and same height
	const [l, r] = [await page.locator('[data-panel-header="left"]').boundingBox(), await page.locator('[data-panel-header="right"]').boundingBox()];
	expect(Math.abs(l!.y - r!.y)).toBeLessThan(1);
	expect(Math.abs(l!.height - r!.height)).toBeLessThan(1);
	await expect(page.getByRole('button', { name: /^(Maximize (search|analysis) panel|Fold sidebar)$/ })).toHaveCount(3);
	await expect(page.getByRole('button', { name: /^Close .* panel$/ })).toHaveCount(0);

	// Maximized, a panel covers the graph; the graph keeps its size underneath
	const graph = page.getByTestId('graph');
	const before = (await graph.boundingBox())!.width;
	await page.getByRole('button', { name: 'Maximize analysis panel' }).click();
	await expect(page.getByRole('button', { name: 'Restore analysis panel' })).toBeVisible();
	expect((await graph.boundingBox())!.width).toBe(before);
});

test('the search panel maximizes over the graph and restores', async ({ page }) => {
	await page.goto('/graph');
	const panel = page.getByTestId('search-panel');
	const narrow = (await panel.boundingBox())!.width;
	await page.getByRole('button', { name: 'Maximize search panel' }).click();
	await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(narrow * 1.5);
	await page.getByRole('button', { name: 'Restore search panel' }).click();
	await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThan(narrow + 5);
	await page.getByRole('button', { name: 'Maximize analysis panel' }).click();
	await expect(page.getByRole('button', { name: 'Restore analysis panel' })).toBeVisible();
});

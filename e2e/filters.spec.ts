import { expect, test } from '@playwright/test';
import { graphNodeCount, label, search } from './helpers';

test('ticking a continent narrows the graph and stays after a refresh', async ({ page }) => {
	await search(page);
	const europe = label('Europe');

	await page.getByRole('tab', { name: /Filters/ }).click();
	// "Europe" also appears in the colour legend, so look inside the Filters panel
	await page.getByRole('tabpanel', { name: 'Filters' }).getByText('Europe', { exact: true }).click();

	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(europe.length));
	await expect(page).toHaveURL(/continent=Europe/);

	await page.reload();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(europe.length));
});

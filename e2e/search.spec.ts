import { expect, test } from '@playwright/test';
import { RESULT_COUNT, graphNodeCount, search } from './helpers';

test('a search lists the results, draws the graph and goes into the address', async ({ page }) => {
	await search(page, 'AI regulation');

	await expect(page.getByRole('tab', { name: /Results/ })).toContainText(String(RESULT_COUNT));
	await expect(page.getByText('OSFI Guideline E-23').first()).toBeVisible();
	await expect(page).toHaveURL(/[?&]q=AI(\+|%20)regulation/);
});

test('refreshing the page brings the same search back', async ({ page }) => {
	await search(page, 'AI regulation');
	await page.reload();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));
});

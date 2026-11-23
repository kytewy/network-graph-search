import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('the analysis panel has Context, Chat and Clusters tabs, and Chat says what the AI will get', async ({ page }) => {
	await search(page);
	const header = page.locator('[data-panel-header="right"]');
	await expect(header.getByRole('tab')).toHaveText([/^Context/, 'Chat', 'Clusters']);

	// Adding a document shows its count on the Context tab
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await expect(header.getByRole('tab', { name: /^Context/ })).toContainText('1');

	// The documents-and-tokens line sits in Chat, above the box
	await header.getByRole('tab', { name: 'Chat' }).click();
	await expect(page.getByTestId('context-budget')).toContainText('1 document');
	await expect(page.getByText('Analysis Workspace')).toHaveCount(0);
});

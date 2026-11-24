import { expect, test } from '@playwright/test';
import { graphNodeCount, RESULT_COUNT, search } from './helpers';

test('answers suggest action buttons; nothing changes until clicked, and Undo puts it back', async ({ page }) => {
	let sentOptions: any;
	await page.route('**/api/analyze-nodes', (r) => {
		sentOptions = r.request().postDataJSON().actionOptions;
		return r.fulfill({
			json: {
				summary: 'Europe leads on binding rules.',
				actions: [
					{ type: 'filter', filter: 'continents', values: ['Europe'], label: 'Filter to Europe' },
					{ type: 'color', mode: 'publisher', label: 'Colour by publisher' },
				],
			},
		});
	});
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	await box.fill('Where are the binding rules?');
	await box.press('Enter');

	// The browser told the server what's available
	expect(sentOptions.continents).toContain('Europe');
	expect(sentOptions.colorModes).toContain('publisher');

	// Buttons appear; nothing has changed yet
	const actions = page.getByLabel('Suggested actions');
	await expect(actions.getByRole('button', { name: 'Filter to Europe' })).toBeVisible();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));

	// Click: the filter applies; Undo removes it
	await actions.getByRole('button', { name: 'Filter to Europe' }).click();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', '3');
	await expect(actions).toContainText('Filter to Europe');
	await actions.getByRole('button', { name: 'Undo' }).click();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));

	// Colour by publisher, then undo it
	await actions.getByRole('button', { name: 'Colour by publisher' }).click();
	await expect(page).toHaveURL(/color=publisher/);
	await actions.getByRole('button', { name: 'Undo' }).click();
	await expect(page).not.toHaveURL(/color=publisher/);
});

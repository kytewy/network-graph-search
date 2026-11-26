import { expect, test } from '@playwright/test';
import { RESULT_COUNT, search } from './helpers';

test('results switch to a table, sort by column, and the ● adds a document to context', async ({ page }) => {
	await search(page);
	// The table is the default view

	const table = page.getByTestId('results-table');
	const rows = table.locator('[data-result-row]');
	await expect(rows).toHaveCount(RESULT_COUNT);
	// Narrow: just score, title and context
	await expect(table.getByRole('columnheader')).toHaveText(['Score ↓', 'Title', 'Ctx']);

	// Sorting by title puts the rows A → Z
	await table.getByRole('button', { name: 'Title' }).click();
	const titles = await rows.locator('td:nth-child(2) button').allTextContents();
	expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));

	// Clicking a row opens the document; Esc closes it
	await rows.first().click();
	await expect(page.getByRole('button', { name: 'Close reading mode' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Close reading mode' })).toHaveCount(0);

	// The ● puts the document into the context table
	const first = rows.first().getByRole('switch');
	await first.click();
	await expect(first).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByTestId('context-table')).toContainText(titles[0]);
	// …and the ● doesn't open it
	await expect(page.getByRole('button', { name: 'Close reading mode' })).toHaveCount(0);

	// Wide adds the summary, tags and cluster columns
	await page.locator('[data-panel-header="left"]').dblclick({ position: { x: 2, y: 2 } });
	await expect(table.getByRole('columnheader')).toHaveCount(5);
	await expect(table.getByRole('columnheader', { name: /Cluster/ })).toBeVisible();

	// Switching to cards is remembered after a refresh
	await page.getByRole('button', { name: 'Show as cards' }).click();
	await page.reload();
	await expect(page.locator('[data-result-card]').first()).toBeVisible();
	await expect(page.getByTestId('results-table')).toHaveCount(0);
});

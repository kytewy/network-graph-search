import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('the analysis panel has Chat and Clusters tabs; each chat shows its documents in a strip', async ({ page }) => {
	await search(page);
	const header = page.locator('[data-panel-header="right"]');
	await expect(header.getByRole('tab')).toHaveText(['Chat', 'Clusters']);

	// Adding a document adds it to the open chat; the strip under the chat bar counts it
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	const strip = page.getByTestId('documents-strip');
	await expect(strip).toContainText('1 document');
	await expect(page.getByTestId('context-budget')).toHaveCount(0);

	// The strip opens the chat's document list in place, and closes again
	await strip.click();
	await expect(page.getByRole('region', { name: "This chat's documents" })).toBeVisible();
	await page.getByRole('button', { name: 'Done' }).click();
	await expect(page.getByRole('region', { name: "This chat's documents" })).toHaveCount(0);
	await expect(page.getByText('Analysis Workspace')).toHaveCount(0);
});

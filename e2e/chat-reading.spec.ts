import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('documents the AI read in full fold into one line above the answer', async ({ page }) => {
	const lines = [
		{ type: 'reading', id: 'a', title: 'OSFI Guideline E-23', round: 1 },
		{ type: 'reading', id: 'b', title: 'Article 6', round: 2 },
		{ type: 'done', summary: 'E-23 applies from 2027.', actions: [], receipt: { model: 'gpt-4o-mini', contextWindow: 128000, tokens: 9000, charLimit: 800, documents: [], suggestions: false, memoryTurns: 0, readRounds: 2 } },
	];
	await page.route('**/api/analyze-nodes', (r) =>
		r.fulfill({ body: lines.map((l) => JSON.stringify(l)).join('\n') + '\n', headers: { 'Content-Type': 'application/x-ndjson' } })
	);
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	await box.fill('When does E-23 apply?');
	await box.press('Enter');
	await expect(page.getByText('E-23 applies from 2027.')).toBeVisible();

	const folded = page.getByTestId('read-folded');
	await expect(folded.locator('summary')).toHaveText('Read 2 documents in full · 2 rounds');
	await folded.locator('summary').click();
	await expect(folded.getByRole('listitem')).toHaveText(['OSFI Guideline E-23', 'Article 6']);
});

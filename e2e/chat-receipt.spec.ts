import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('every answer has a receipt: documents, how much of each, instructions and memory', async ({ page }) => {
	await page.route('**/api/analyze-nodes', (r) =>
		r.fulfill({
			json: {
				summary: 'Two binding rules.',
				actions: [],
				receipt: {
					model: 'gpt-4o-mini',
					contextWindow: 128000,
					tokens: 1234,
					charLimit: 800,
					documents: [
						{ id: 'a', title: 'EU AI Act', sentAs: 'text', sent: 800, total: 4200 },
						{ id: 'b', title: 'OSFI E-23', sentAs: 'summary', sent: 310, total: 310 },
					],
					question: 'Where are the binding rules?',
					suggestions: true,
					memoryTurns: 0,
				},
			},
		})
	);
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	await box.fill('Where are the binding rules?');
	await box.press('Enter');
	await expect(page.getByText('Two binding rules.')).toBeVisible();

	await page.getByRole('button', { name: 'What was sent' }).click();
	const dialog = page.getByRole('dialog', { name: 'What was sent' });
	await expect(dialog.getByTestId('receipt-line')).toHaveText('2 documents · about 1,234 of 128,000 tokens · gpt-4o-mini · 1 cut to 800 characters');
	const docs = dialog.getByRole('list', { name: 'Documents sent' });
	await expect(docs).toContainText('Document text · 800 of 4,200 characters · cut');
	await expect(docs).toContainText('Summary · 310 characters');

	await dialog.getByRole('tab', { name: 'Instructions' }).click();
	await expect(dialog).toContainText('Where are the binding rules?');
	await expect(dialog).toContainText('None set');
	await dialog.getByRole('tab', { name: /Memory/ }).click();
	await expect(dialog).toContainText('answered on its own');
});

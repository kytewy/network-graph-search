import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('every answer has a receipt: documents, how much of each, instructions and memory', async ({ page }) => {
	await page.route('**/api/analyze-nodes', (r) =>
		r.fulfill({
			json: {
				summary: 'Two binding rules, from [EU AI Act] and [The Made Up Act].',
				actions: [],
				receipt: {
					model: 'gpt-4o-mini',
					contextWindow: 128000,
					tokens: 1234,
					charLimit: 800,
					documents: [
						{ id: 'a', title: 'EU AI Act', sentAs: 'text', sent: 800, total: 4200, length: 4200 },
						{ id: 'b', title: 'OSFI E-23', sentAs: 'summary', sent: 310, total: 310, length: 29960 },
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
	await expect(page.getByText(/Two binding rules/)).toBeVisible();

	// Coverage sits at the end of the answer's tools: a link to the receipt, a dot when a citation needs a look
	const coverage = page.getByTestId('coverage');
	await expect(coverage.getByRole('img')).toHaveAccessibleName(/1 citation matches no document sent: The Made Up Act\. 1 cited but mostly unsent: EU AI Act/);
	await coverage.getByRole('button', { name: '2 sent · 1 cited' }).click();
	// The popup: the context window, how documents went, and what the answer cited
	const peek = page.getByRole('dialog', { name: 'Context for this answer' });
	await expect(peek).toContainText('about 1,234 of 128,000 tokens (1%)');
	await expect(peek.getByTestId('context-mix')).toHaveText('2 documents: 0 whole · 1 in part · 1 as summary');
	await expect(peek.getByRole('list', { name: 'Cited' })).toContainText('EU AI Act19%');
	await expect(peek.getByRole('list', { name: 'Sent, not cited' })).toContainText('OSFI E-23Summary');
	await peek.getByRole('button', { name: 'Full receipt' }).click();
	const dialog = page.getByRole('dialog', { name: 'What was sent' });
	await expect(dialog.getByTestId('receipt-line')).toHaveText('2 documents · about 1,234 of 128,000 tokens · gpt-4o-mini · 1 cut to 800 characters');
	const docs = dialog.getByRole('list', { name: 'Documents sent' });
	// A simple share per document; the exact numbers are in the hover
	await expect(docs.getByLabel('19% sent')).toHaveAttribute('title', "800 of 4,200 characters of the document's text");
	await expect(docs.getByText('Cited', { exact: true })).toHaveCount(1);
	await expect(docs.getByText('Summary', { exact: true })).toHaveAttribute('title', 'Summary sent (310 characters); the document is 29,960 characters');

	await dialog.getByRole('tab', { name: 'Instructions' }).click();
	await expect(dialog).toContainText('Where are the binding rules?');
	await expect(dialog).toContainText('None set');
	await dialog.getByRole('tab', { name: /Memory/ }).click();
	await expect(dialog).toContainText('answered on its own');
});

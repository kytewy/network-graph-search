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
						{ id: 'eu-ai-act', title: 'EU AI Act', sentAs: 'text', sent: 800, total: 4200, length: 4200 },
						{ id: 'b', title: 'OSFI E-23', sentAs: 'summary', sent: 310, total: 310, length: 29960 },
						{ id: 'c', title: 'Article 6', sentAs: 'text', sent: 5000, total: 5000, length: 5000, readOnRequest: true },
					],
					readRounds: 2,
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
	await expect(coverage.getByRole('img')).toHaveAccessibleName(/1 citation matches no document sent: The Made Up Act\. 1 cited from excerpts only \\(the AI got less than half\\): EU AI Act/);
	await coverage.getByRole('button', { name: '3 sent · 1 cited' }).click();
	// The popup: the context window, how documents went, and what the answer cited
	const peek = page.getByRole('dialog', { name: 'Context for this answer' });
	await expect(peek).toContainText('about 1,234 of 128,000 tokens (1%)');
	// One scale for what the AI saw: read on request counts as in full
	const mix = peek.getByTestId('context-mix');
	await expect(mix).toContainText('What the AI read · 3 documents');
	for (const part of ['In full 1', 'Partly 1', 'Summary only 1']) await expect(mix).toContainText(part);
	await expect(peek.getByTestId('context-cited')).toHaveText('Cited 1 of 3 · 1 cited from excerpts only · 1 match no document sent');
	await peek.getByRole('button', { name: 'Full receipt' }).click();
	const dialog = page.getByRole('dialog', { name: 'What was sent' });
	await expect(dialog.getByTestId('receipt-line')).toHaveText('3 documents · about 1,234 of 128,000 tokens · gpt-4o-mini · 1 cut to 800 characters');
	const docs = dialog.getByRole('list', { name: 'Documents sent' });
	// A simple share per document; the exact numbers are in the hover
	await expect(docs.getByLabel('19% seen')).toHaveAttribute('title', "800 of 4,200 characters of the document's text");
	// A summary's share is its size against the whole document
	await expect(docs.getByLabel('1% seen')).toBeVisible();
	await expect(docs.getByRole('img', { name: 'Cited' })).toHaveCount(1);
	await expect(docs).toContainText('29,960');
	await expect(docs.getByText('In full', { exact: true })).toHaveCount(1);
	await expect(docs.getByText('Partly', { exact: true })).toHaveCount(1);
	await expect(dialog.getByTestId('read-on-request')).toHaveText('Read 1 in full on request · 5,000 of 200,000 budget characters · 2 rounds');
	await expect(dialog.getByTestId('receipt-total')).toHaveText('3 documents · 39,160 characters in all · 5,800 sent (15%)');
	await expect(docs.getByText('Summary', { exact: true })).toHaveAttribute('title', 'Summary sent (310 characters); the document is 29,960 characters');

	// A document opens in reading mode; closing it brings the receipt back
	await docs.getByRole('button', { name: 'EU AI Act' }).click();
	await expect(page.getByRole('button', { name: 'Close reading mode' })).toBeVisible();
	await page.getByRole('button', { name: 'Close reading mode' }).click();
	await expect(dialog).toBeVisible();

	await dialog.getByRole('tab', { name: 'Instructions' }).click();
	await expect(dialog).toContainText('Where are the binding rules?');
	await expect(dialog).toContainText('None set');
	await dialog.getByRole('tab', { name: /Memory/ }).click();
	await expect(dialog).toContainText('answered on its own');
});

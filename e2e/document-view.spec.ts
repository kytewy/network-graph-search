import { expect, test } from '@playwright/test';
import { search } from './helpers';

const ANSWER = `## Bank impact memo

1. Model risk rules apply to AI models across their lifecycle [OSFI Guideline E-23].
2. High-risk systems need conformity checks under the [EU AI Act].
3. Some say [GDPR] matters too.`;

test('an answer opens as a document with linked citations, sources, download, expand and close', async ({ page }) => {
	await page.route('**/api/analyze-nodes', (r) => r.fulfill({ json: { summary: ANSWER } }));
	await search(page);
	const rows = page.getByTestId('results-table').locator('[data-result-row]');
	await rows.filter({ hasText: 'EU AI Act' }).first().getByRole('switch').click();
	await rows.filter({ hasText: 'OSFI Guideline E-23' }).getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	await box.fill('How do these affect banks?');
	await box.press('Enter');

	// Narrow panel: the document covers the chat
	await page.getByRole('button', { name: 'Open Bank impact memo as a document' }).click();
	const doc = page.getByTestId('document-view');
	await expect(doc.locator('header')).toContainText('Bank impact memo');
	await expect(doc.getByRole('heading', { name: 'Bank impact memo' })).toBeVisible();
	await expect(page.getByTestId('chat')).toHaveCount(0);

	// Citations matched to documents in context become links; Sources lists them; unknown names are counted
	await expect(doc.locator('[data-citation]')).toHaveCount(2);
	await expect(doc.getByRole('region', { name: 'Sources' })).toContainText('Sources (2)');
	await expect(doc.getByRole('region', { name: 'Sources' })).toContainText("1 cited name didn't match");

	// Clicking a citation opens that document in reading mode
	await doc.locator('[data-citation="osfi-e23"]').click();
	await expect(page.getByRole('heading', { name: 'OSFI Guideline E-23', level: 1 })).toBeVisible();
	await page.keyboard.press('Escape');

	// Download as Markdown
	const [file] = await Promise.all([
		page.waitForEvent('download'),
		doc.getByRole('button', { name: 'Download document' }).click().then(() => page.getByRole('menuitem', { name: /Markdown/ }).click()),
	]);
	expect(file.suggestedFilename()).toBe('bank-impact-memo.md');

	// ⤢ widens the panel into chat | document; again fills the panel; ✕ closes
	await doc.getByRole('button', { name: 'Expand document' }).click();
	await expect(page.getByTestId('chat')).toBeVisible();
	await expect(doc).toBeVisible();
	await doc.getByRole('button', { name: 'Expand document' }).click();
	await expect(page.getByTestId('chat')).toHaveCount(0);
	await doc.getByRole('button', { name: 'Show chat beside document' }).click();
	await expect(page.getByTestId('chat')).toBeVisible();
	await doc.getByRole('button', { name: 'Close document' }).click();
	await expect(doc).toHaveCount(0);
});

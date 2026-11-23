import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('saved prompts: + opens them, use one, save a new one from the box, edit and delete', async ({ page }) => {
	await search(page);
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });

	// The three starters are chips; a chip fills the box
	await page.getByRole('button', { name: 'Business impact' }).click();
	await expect(box).toHaveValue(/strategic implications/);

	// Save what's in the box as a new prompt
	await box.fill('How do these compare to OSFI E-23?');
	await page.getByRole('button', { name: 'Saved prompts' }).click();
	const dialog = page.getByRole('dialog', { name: 'Saved prompts' });
	await dialog.getByRole('button', { name: /Save what’s in the chat box/ }).click();
	await expect(dialog.getByLabel('Prompt text')).toHaveValue('How do these compare to OSFI E-23?');
	await dialog.getByLabel('Prompt name').fill('Compare to OSFI');
	await dialog.getByRole('button', { name: 'Save prompt' }).click();

	// Edit it, then use it from the window
	await dialog.getByRole('button', { name: 'Edit Compare to OSFI' }).click();
	await dialog.getByLabel('Prompt name').fill('OSFI check');
	await dialog.getByRole('button', { name: 'Save prompt' }).click();
	await expect(dialog.getByRole('button', { name: 'Use OSFI check' })).toBeVisible();
	await dialog.getByRole('button', { name: 'Use Summary', exact: true }).click();
	await expect(dialog).toBeHidden();
	await expect(box).toHaveValue(/comprehensive summary/);

	// Duplicate a prompt: the copy opens for editing, the original stays
	await page.getByRole('button', { name: 'Saved prompts' }).click();
	await dialog.getByRole('button', { name: 'Duplicate Summary' }).click();
	await expect(dialog.getByLabel('Prompt name')).toHaveValue('Summary (copy)');
	await dialog.getByLabel('Prompt name').fill('Short summary');
	await dialog.getByLabel('Prompt text').fill('Summarize in 3 bullets.');
	await dialog.getByRole('button', { name: 'Save prompt' }).click();
	await expect(dialog.getByRole('button', { name: 'Use Summary', exact: true })).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Use Short summary' })).toBeVisible();
	await page.keyboard.press('Escape');

	// Saved prompts survive a refresh; delete one
	await page.reload();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	await page.getByRole('button', { name: 'Saved prompts' }).click();
	await expect(dialog.getByRole('button', { name: 'Use OSFI check' })).toBeVisible();
	await dialog.getByRole('button', { name: 'Delete Citations' }).click();
	await expect(dialog.getByRole('button', { name: 'Use Citations' })).toHaveCount(0);
});

test('a question from the chat can be saved as a prompt', async ({ page }) => {
	await page.route('**/api/analyze-nodes', (r) => r.fulfill({ json: { summary: 'An answer' } }));
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	await box.fill('Which documents mention penalties?');
	await box.press('Enter');
	await page.getByRole('button', { name: 'Save question as prompt' }).click();

	// The window opens straight on the form, filled with that question
	const dialog = page.getByRole('dialog', { name: 'Saved prompts' });
	await expect(dialog.getByLabel('Prompt text')).toHaveValue('Which documents mention penalties?');
	await dialog.getByLabel('Prompt name').fill('Penalties');
	await dialog.getByRole('button', { name: 'Save prompt' }).click();
	await expect(dialog).toBeHidden();
	await page.getByRole('button', { name: 'Saved prompts' }).click();
	await expect(dialog.getByRole('button', { name: 'Use Penalties' })).toBeVisible();
});

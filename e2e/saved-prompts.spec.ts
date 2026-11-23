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
	await dialog.getByRole('button', { name: 'Use Summary' }).click();
	await expect(dialog).toBeHidden();
	await expect(box).toHaveValue(/comprehensive summary/);

	// Saved prompts survive a refresh; delete one
	await page.reload();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	await page.getByRole('button', { name: 'Saved prompts' }).click();
	await expect(dialog.getByRole('button', { name: 'Use OSFI check' })).toBeVisible();
	await dialog.getByRole('button', { name: 'Delete Citations' }).click();
	await expect(dialog.getByRole('button', { name: 'Use Citations' })).toHaveCount(0);
});

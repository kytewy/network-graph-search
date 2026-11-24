import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('several chats: start a new one, flip back and forth, delete one', async ({ page }) => {
	await page.route('**/api/analyze-nodes', (r) => {
		const { customPrompt } = r.request().postDataJSON();
		return r.fulfill({ json: { summary: `Answer to: ${customPrompt}`, actions: [] } });
	});
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	const switcher = page.getByTestId('chat-switcher');

	await box.fill('First question');
	await box.press('Enter');
	await expect(page.getByText('Answer to: First question')).toBeVisible();
	await expect(switcher).toContainText('1 of 1');

	// A new chat is empty, and takes its name from its first question
	await switcher.getByRole('button', { name: 'New' }).click();
	await expect(switcher).toContainText('2 of 2');
	await expect(page.getByText('Answer to: First question')).toHaveCount(0);
	await box.fill('Second topic');
	await box.press('Enter');
	await expect(page.getByText('Answer to: Second topic')).toBeVisible();
	await expect(switcher.getByRole('button', { name: 'Chats: Second topic' })).toBeVisible();

	// Flip back: the first chat's answer is there, the second's isn't
	await switcher.getByRole('button', { name: 'Previous chat' }).click();
	await expect(switcher).toContainText('1 of 2');
	await expect(page.getByText('Answer to: First question')).toBeVisible();
	await expect(page.getByText('Answer to: Second topic')).toHaveCount(0);

	// The dropdown lists every chat; delete the second after a confirm
	await switcher.getByRole('button', { name: 'Chats: Main chat' }).click();
	await page.getByRole('menuitem', { name: /Second topic/ }).click();
	await switcher.getByRole('button', { name: 'Chats: Second topic' }).click();
	await page.getByRole('menuitem', { name: 'Delete this chat' }).click();
	await page.getByRole('group', { name: 'Confirm delete' }).getByRole('button', { name: 'Delete' }).click();
	await expect(switcher).toContainText('1 of 1');
	await expect(page.getByText('Answer to: First question')).toBeVisible();
});

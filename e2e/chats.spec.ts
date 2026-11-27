import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('chat tabs: start a new one, switch, close a tab, reopen it, delete one', async ({ page }) => {
	await page.route('**/api/analyze-nodes', (r) => {
		const { customPrompt } = r.request().postDataJSON();
		return r.fulfill({ json: { summary: `Answer to: ${customPrompt}`, actions: [] } });
	});
	// The AI names each new chat after its first answer
	await page.route('**/api/chat-title', (r) => r.fulfill({ json: { title: `Topic: ${r.request().postDataJSON().question}` } }));
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	const tabs = page.getByRole('tablist', { name: 'Chats' });
	const tab = (name: string) => tabs.getByRole('tab', { name });

	await box.fill('First question');
	await box.press('Enter');
	await expect(page.getByText('Answer to: First question')).toBeVisible();
	await expect(tab('Topic: First question')).toHaveAttribute('aria-selected', 'true');

	// + opens a new, empty chat in its own tab, named after its first exchange
	await page.getByRole('button', { name: 'New chat' }).click();
	await expect(tab('New chat')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByText('Answer to: First question')).toHaveCount(0);
	await box.fill('Second topic');
	await box.press('Enter');
	await expect(page.getByText('Answer to: Second topic')).toBeVisible();
	await expect(tab('Topic: Second topic')).toHaveAttribute('aria-selected', 'true');

	// Clicking a tab switches chats
	await tab('Topic: First question').click();
	await expect(page.getByText('Answer to: First question')).toBeVisible();
	await expect(page.getByText('Answer to: Second topic')).toHaveCount(0);

	// × closes a tab (the chat isn't deleted); ▾ lists every chat and reopens it
	await page.getByRole('button', { name: 'Close Topic: Second topic' }).click();
	await expect(tab('Topic: Second topic')).toHaveCount(0);
	await page.getByRole('button', { name: 'All chats' }).click();
	await page.getByRole('menuitem', { name: /Second topic/ }).click();
	await expect(tab('Topic: Second topic')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByText('Answer to: Second topic')).toBeVisible();

	// Delete the open chat from ▾ after a confirm
	await page.getByRole('button', { name: 'All chats' }).click();
	await page.getByRole('menuitem', { name: 'Delete this chat' }).click();
	await page.getByRole('group', { name: 'Confirm delete' }).getByRole('button', { name: 'Delete' }).click();
	await expect(tab('Topic: Second topic')).toHaveCount(0);
	await expect(tab('Topic: First question')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByText('Answer to: First question')).toBeVisible();
});

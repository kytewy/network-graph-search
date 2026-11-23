import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('chat: Enter sends, follow-ups carry earlier turns, and Stop cancels', async ({ page }) => {
	const bodies: any[] = [];
	let slow = false;
	await page.route('**/api/analyze-nodes', async (route) => {
		bodies.push(route.request().postDataJSON());
		if (slow) await new Promise((r) => setTimeout(r, 5_000));
		await route.fulfill({ json: { summary: `Answer ${bodies.length}` } }).catch(() => {});
	});

	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });

	// Enter sends; the answer appears above the box
	await box.fill('Summarize these');
	await box.press('Enter');
	await expect(page.locator('[data-role="assistant"]').last()).toContainText('Answer 1');
	expect(bodies[0].history).toEqual([]);

	// Shift+Enter is a new line, not a send
	await box.fill('and for');
	await box.press('Shift+Enter');
	await box.pressSequentially('Canada?');
	expect(bodies).toHaveLength(1);

	// The follow-up carries the first question and answer
	await box.press('Enter');
	await expect(page.locator('[data-role="assistant"]').last()).toContainText('Answer 2');
	expect(bodies[1].history).toEqual([
		{ role: 'user', content: 'Summarize these' },
		{ role: 'assistant', content: 'Answer 1' },
	]);
	await expect(page.getByTestId('chat-memory')).toContainText('last 2 answers');

	// Stop cancels a slow answer, and a stopped turn isn't remembered
	slow = true;
	await box.fill('Something slow');
	await box.press('Enter');
	await page.getByRole('button', { name: 'Stop' }).click();
	await expect(page.locator('[data-role="assistant"]').last()).toContainText('Stopped');
	await expect(page.getByTestId('chat-memory')).toContainText('last 2 answers');

	// The box grows with a long question, then stops growing and scrolls
	const short = (await box.boundingBox())!.height;
	await box.fill('line\n'.repeat(4));
	await expect.poll(async () => (await box.boundingBox())!.height).toBeGreaterThan(short + 30);
	await box.fill('line\n'.repeat(40));
	await expect.poll(async () => (await box.boundingBox())!.height).toBeLessThanOrEqual(201);
});

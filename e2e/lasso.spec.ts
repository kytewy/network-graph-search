import { expect, test } from '@playwright/test';
import { RESULT_COUNT, graphNodeCount, search, withoutLabels } from './helpers';

test('lassoing nodes and sending them puts them in the context table', async ({ page }) => {
	await withoutLabels(page);
	await search(page);
	// Let the layout settle so every node is inside the drawn area
	await page.waitForTimeout(2000);

	const box = await graphNodeCount(page).boundingBox();
	if (!box) throw new Error('graph not visible');

	// Shift + drag across the graph, starting clear of the colour legend (top left),
	// the settings bar (top) and the hint (bottom left), which would catch the drag
	await page.keyboard.down('Shift');
	await page.mouse.move(box.x + 200, box.y + 90);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width - 20, box.y + box.height - 50, { steps: 25 });
	await page.mouse.up();
	await page.keyboard.up('Shift');

	// The layout differs a little each run, so check what the lasso reports it caught
	const heading = page.getByRole('heading', { name: /Nodes Selected/ });
	await expect(heading).toBeVisible();
	const caught = Number((await heading.textContent())?.match(/\d+/)?.[0]);
	expect(caught).toBeGreaterThan(0);
	expect(caught).toBeLessThanOrEqual(RESULT_COUNT);

	await page.getByRole('button', { name: 'Add to this chat' }).click();

	// Everything caught ends up in the open chat's documents
	await page.getByTestId('documents-strip').click();
	await expect(page.getByTestId('context-table').locator('tbody tr')).toHaveCount(caught);
});

test('lassoing nodes and choosing Analyze in a new chat starts a chat with just those', async ({ page }) => {
	await withoutLabels(page);
	await search(page);
	await page.waitForTimeout(2000);
	const box = await graphNodeCount(page).boundingBox();
	if (!box) throw new Error('graph not visible');
	await page.keyboard.down('Shift');
	await page.mouse.move(box.x + 200, box.y + 90);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width - 20, box.y + box.height - 50, { steps: 25 });
	await page.mouse.up();
	await page.keyboard.up('Shift');
	const heading = page.getByRole('heading', { name: /Nodes Selected/ });
	const caught = Number((await heading.textContent())?.match(/\d+/)?.[0]);

	await page.getByRole('button', { name: 'Analyze in a new chat' }).click();
	const switcher = page.getByTestId('chat-switcher');
	await expect(switcher.getByRole('button', { name: `Chats: Selection: ${caught} documents` })).toBeVisible();
	await expect(page.getByTestId('documents-strip')).toContainText(`${caught} document`);
});
